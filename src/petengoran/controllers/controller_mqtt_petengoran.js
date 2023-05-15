const dbase_mqtt = require('../configs/database_petengoran');
const mqtt_connect = require('../../global_config/mqtt_config');
const moment = require('moment-timezone');
const fs = require('fs');
const findRemoveSync = require('find-remove')
const lsq = require('least-squares'); //Least square method to forecasting

require('dotenv').config()

// PATH name check on .env
TS_PATH = process.env.PAYLOAD_PETENGORAN_TS // Now using TSjsn;
DATE_PATH = process.env.PAYLOAD_PETENGORAN_DATE //Now using Datejsn;
WATERLEVEL_PATH = process.env.PAYLOAD_PETENGORAN_WATERLEVEL //Now using tinggijsn; //change path based on data from raspberrypi
TEMP_PATH = process.env.PAYLOAD_PETENGORAN_TEMP
VOLTAGE_PATH = process.env.PAYLOAD_PETENGORAN_VOLTAGE

var { DATA_ID, TS, DATE, WATERLEVEL, TEMP, VOLTAGE,FORECAST30, FORECAST300, DATETIME } = [];

//Save ALERT and RMS data forecasting 
var ALERTLEVEL;
var RMSROOT;
var RMSTHRESHOLD;
var STATUSWARNING;
var FEEDLATENCY;

//FAILSAFE
if (TEMP===null){TEMP=49};
if (VOLTAGE===null){VOLTAGE=12.5};

module.exports = {

    // MQTT HANDLING
    async incomingData_petengoran(topic,message){

        // Handling data from topic 1 (data from raspberrypi)
        if (topic === process.env.TOPIC_PETENGORAN1){
            
            // Save subscribed message to payload variable
            const payload = JSON.parse(message.toString());

            // Checking property of Time, Date, and Waterlevel. so it will never null
            if ((payload.hasOwnProperty(TS_PATH)) 
                && (payload.hasOwnProperty(DATE_PATH)) 
                && (payload.hasOwnProperty(WATERLEVEL_PATH))){

                if ((payload[TS_PATH] != null) 
                    && (payload[DATE_PATH] != null) 
                    && (payload[WATERLEVEL_PATH] != null)) {
                    
                    // Save Payload to a variable.       
                    TS = payload[TS_PATH]
                    DATE = payload[DATE_PATH];
                    WATERLEVEL = parseFloat(payload[WATERLEVEL_PATH]);

                    DATETIME = DATE +'T'+ TS;
                    DATA_ID = (Date.now()+(Math.floor(Math.random() * 999)));
                    FEEDLATENCY = Math.abs(Date.now()-Date.parse(DATETIME));
                    
                    //Data Duplication Check
                    var DuplicateCheck = await dbase_mqtt.query(`SELECT CASE WHEN EXISTS (SELECT datetime FROM mqtt_petengoran where id = ${DATA_ID}) THEN 1 ELSE 0 END`)
                    if (DuplicateCheck.rows[0].case === 0){ //If no duplicate then :
                        
                        // fetch data DB
                        var dataDB_petengoran = await dbase_mqtt.query(`SELECT datetime, waterlevel, voltage, temperature, alertlevel FROM mqtt_petengoran ORDER BY datetime DESC LIMIT 300;`);
                        if (dataDB_petengoran.rowCount >= 500000){
                            dbPetengoran_delete_lastweek = await dbase_mqtt.query(`DELETE FROM mqtt_petengoran WHERE datetime < now()-'1 week'::interval`);
                            console.log(`[U_TEWS PETENGORAN 003   ] Fast-table Cleaned`);
                        }                        
                        if (dataDB_petengoran.rowCount === 0){
                            console.log("Database still empty. Waiting for new data");
                            dataArray = [DATA_ID, DATETIME, TS, DATE, 0, 0, 0, 0, 0, 0, 0, 0, 0]; 
                            insertQuery = await dbase_mqtt.query(`INSERT INTO mqtt_petengoran(id, datetime, time, date, waterlevel, voltage, temperature, 
                            forecast30, forecast300, rms, threshold, alertlevel, feedlatency) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,dataArray);
                        } else {
                            var pull30_length;
                            var dbPetengoran_dataLength = dataDB_petengoran.rowCount;
                            
                            if (payload.hasOwnProperty(TEMP_PATH)) {
                                TEMP = parseFloat(payload[TEMP_PATH]);
                            } else {
                                TEMP = (dataDB_petengoran.rows[0].temperature); //use latest data from database if temperature not available
                            }

                            if (payload.hasOwnProperty(VOLTAGE_PATH)) {
                                VOLTAGE = parseFloat(payload[VOLTAGE_PATH]);
                            } else {
                                VOLTAGE = (dataDB_petengoran.rows[0].voltage); //use latest data from database if temperature not available
                            }

                            // Forecast 30
                            if (dbPetengoran_dataLength <= 30){
                                pull30_length = dbPetengoran_dataLength;
                            } else {
                                pull30_length = 30;
                            }
                            var timeSeries = []; var timeWater = [];
                            var rmsSquare = 0;   var rmsMean = 0;
                            timeSeries.push(30);
                            timeWater.push(WATERLEVEL);

                            for (i=0 ; i<=pull30_length-1; i++){
                                timeSeries.push(i);
                                timeWater.push(dataDB_petengoran.rows[i].waterlevel);
                            }   
                            timeSeries.reverse(); 
                            timeWater.reverse();
                            var forecast = lsq(timeSeries, timeWater);
                            FORECAST30 = parseFloat(forecast(31).toFixed(2));

                            // Forecast 300
                            var timeSeries_fc300 = []; var timeWater_fc300 = [];
                            timeSeries_fc300.push(300);
                            timeWater_fc300.push(WATERLEVEL);

                            for (i=0 ; i<=dataDB_petengoran.rowCount-1; i++){
                                timeSeries_fc300.push(i);
                                timeWater_fc300.push(dataDB_petengoran.rows[i].waterlevel);
                            }
                            timeSeries_fc300.reverse(); 
                            timeWater_fc300.reverse();//reverse descending data from db and mqtt

                            var forecast3 = lsq(timeSeries_fc300, timeWater_fc300);
                            FORECAST300 = parseFloat(forecast3(301).toFixed(2));

                            // Calculate RMS
                            for (i=0 ; i<=dataDB_petengoran.rowCount-1; i++){
                                rmsSquare += Math.pow(dataDB_petengoran.rows[i].alertlevel, 2);
                            }    
                            rmsMean = (rmsSquare / (dataDB_petengoran.rowCount));
                            RMSROOT = parseFloat(Math.sqrt(rmsMean).toFixed(2));
                            RMSTHRESHOLD = parseFloat((RMSROOT * 9).toFixed(2)); 

                            // ALERT logic
                            //Calculate Alert
                            ALERTLEVEL = (Math.abs(FORECAST300 - WATERLEVEL)).toFixed(2);
                            //console.log("ALERT : " + ALERTLEVEL);
                            if (ALERTLEVEL >= RMSTHRESHOLD) {STATUSWARNING = "WARNING";} else STATUSWARNING = "SAFE";

                            console.log(`[U_TEWS PETENGORAN 001] OK. TIME : ${Date(DATETIME)}`);

                            dataArray = [DATA_ID, DATETIME, TS, DATE, WATERLEVEL, VOLTAGE, TEMP, FORECAST30, FORECAST300, RMSROOT, RMSTHRESHOLD, ALERTLEVEL, FEEDLATENCY]; 
                            insertQuery = await dbase_mqtt.query(`INSERT INTO mqtt_petengoran(id, datetime, time, date, waterlevel, voltage, temperature, 
                                forecast30, forecast300, rms, threshold, alertlevel, feedlatency) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,dataArray);
                            insertQuery = await dbase_mqtt.query(`INSERT INTO mqtt_petengoran_stored(id, datetime, time, date, waterlevel, voltage, temperature, 
                                forecast30, forecast300, rms, threshold, alertlevel, feedlatency) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,dataArray);
                            
                            // PUBLISH DATA

                            var isoDateString = new Date(DATETIME).toISOString();
                            const jsonToJRC = {"UTC_TIME":isoDateString, "LOCAL_TIME":DATETIME, "WATERLEVEL":WATERLEVEL, "DEVICE_TEMP":TEMP, "DEVICE_VOLTAGE":VOLTAGE}
                            const jsonToPublish = {
                                "DATETIME":DATETIME ,"TS" : TS, "Date":DATE, "tinggi":WATERLEVEL, "tegangan":VOLTAGE, 
                                "suhu":TEMP ,"frcst30":FORECAST30, "frcst300":FORECAST300, "alertlevel":ALERTLEVEL, "rms":RMSROOT, 
                                "threshold":RMSTHRESHOLD, "status":STATUSWARNING, "feedLatency":FEEDLATENCY
                            };

                            mqtt_connect.publish('pummaUTEWS/gebang', JSON.stringify(jsonToJRC), {qos:2, retain:false});    
                            mqtt_connect.publish('pumma/petengoran',JSON.stringify(jsonToPublish), {qos: 2, retain:false}, (err) => {});
                        }                        
                        
                    } else {
                        console.log(`[U_TEWS PETENGORAN 001] ERROR Data Duplicated on time : ${DATETIME}`);
                    }    
                }
            }
        }

        if (topic === process.env.TOPIC_PETENGORAN_IMAGE){
            const imagePayload = message.toString();
            fs.writeFile("src/petengoran/image/petengoran_b64string.txt", imagePayload, function(err) {
                if(err) {
                    return console.log(err);
                }
                //console.log("IMAGE [U_TEWS Petengoran] file was saved!");
            }); 

            let image = `data:image/jpeg;base64,${message}`
            var data = image.replace(/^data:image\/\w+;base64,/, '');
            fs.writeFile(`src/petengoran/image/petengoran.png`, data, {encoding: 'base64'}, function(err) {
                if(err) {
                    return console.log(err);
                }
                console.log("[U_TEWS Petengoran 001] Image file was saved!");
            });

            let ts = new Date(Date.now());
            var datetimes = (ts.getDate() +"-"+ (ts.getMonth()+1) +"-"+ ts.getFullYear() + "_" + ts.getHours() +"."+ ts.getMinutes() +"."+ ts.getSeconds());
            const itemCount = fs.readdirSync('src/petengoran/image/').length;
            if (itemCount <= 50){
                fs.writeFile(`src/petengoran/image/${datetimes}_petengoran.png`, data, {encoding: 'base64'}, function(err) {
                    if(err) {
                        return console.log(err);
                    }
                });
            } else {
                var result = findRemoveSync('src/petengoran/image/', {
                    age: { seconds: 3600 },
                    extensions: '.png',
                    limit: 50
                });
                fs.writeFile(`src/petengoran/image/${datetimes}_petengoran.png`, data, {encoding: 'base64'}, function(err) {
                    if(err) {
                        return console.log(err);
                    }
                });
            }   
        }
    }
}