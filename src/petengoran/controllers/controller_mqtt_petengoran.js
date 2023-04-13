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
                    DATA_ID = Date.parse(DATETIME);
                    
                    //Data Duplication Check
                    var DuplicateCheck = await dbase_mqtt.query(`SELECT CASE WHEN EXISTS (SELECT datetime FROM mqtt_petengoran where id = ${DATA_ID}) THEN 1 ELSE 0 END`)
                    if (DuplicateCheck.rows[0].case === 0){ //If no duplicate then :

                        // Logic to check there is "suhu" & "tegangan" or not in JSON from mqtt
                        // If "suhu" or "tegangan" available in json, use that data.. if not, use last data from database.
                        // Check data is available or not in database   
                        var checkZero = await dbase_mqtt.query("SELECT CASE WHEN EXISTS (SELECT * FROM mqtt_petengoran LIMIT 1) THEN 1 ELSE 0 END");
                        if (checkZero.rows[0].case === 0) {
                            console.log("Table is empty. no value about voltage and temp. use 0 instead");
                            // If table is empty, value of variables set to 0.
                            TEMP = 0; VOLTAGE = 0;
                        } else {
                            if (payload.hasOwnProperty(TEMP_PATH)) {
                                TEMP = parseFloat(payload[TEMP_PATH]);
                            } else {
                                getLastTemp = await dbase_mqtt.query("SELECT temperature, voltage FROM mqtt_petengoran ORDER BY date DESC, time DESC LIMIT 1");
                                TEMP = (getLastTemp.rows[0].temperature); //use latest data from database if temperature not available
                            }

                            // Checking payload has voltage or not
                            if (payload.hasOwnProperty(VOLTAGE_PATH)) {
                                VOLTAGE = parseFloat(payload[VOLTAGE_PATH]);
                            } else {
                                getLastVolt = await dbase_mqtt.query("SELECT voltage, voltage FROM mqtt_petengoran ORDER BY date DESC, time DESC LIMIT 1");
                                VOLTAGE = (getLastVolt.rows[0].voltage); //use latest data from database if voltage not available
                            }

                            // Fetch 30 Data From Database
                            var get30DB = await dbase_mqtt.query(`SELECT waterlevel FROM mqtt_petengoran ORDER BY datetime DESC LIMIT 29;`);
                            
                            // Temporary Variable
                            var timeSeries = []; var timeWater = [];
                            var rmsSquare = 0;   var rmsMean = 0;

                            // Insert latest data to Array. positition 30 on timeseries.
                            timeSeries.push(30);
                            timeWater.push(WATERLEVEL);

                            // Insert data 1 - 29 from database to Array.
                            for (i=0 ; i<=get30DB.rowCount-1; i++){
                                timeSeries.push(i);
                                timeWater.push(get30DB.rows[i].waterlevel);
                                //rmsSquare += Math.pow(get30DB.rows[i].waterlevel, 2);
                            }    
                            
                            //Reverse position because DB is DESCENDING
                            timeSeries.reverse(); 
                            timeWater.reverse();//reverse descending data from db and mqtt
                            
                            // Do Forecast 30
                            var forecast = lsq(timeSeries, timeWater);
                            FORECAST30 = parseFloat(forecast(31).toFixed(2));

                            // Fetch 300 Data From Database
                            var get300DB = await dbase_mqtt.query(`SELECT waterlevel FROM mqtt_petengoran ORDER BY datetime DESC LIMIT 299;`);
                            
                            // Temp Variable
                            var timeSeries_fc300 = []; var timeWater_fc300 = [];

                            // Insert latest data to Array. positition 30 on timeseries.
                            timeSeries_fc300.push(300);
                            timeWater_fc300.push(WATERLEVEL);
                            
                            //parse all data from db to variable
                            for (i=0 ; i<=get300DB.rowCount-1; i++){
                                timeSeries_fc300.push(i);
                                timeWater_fc300.push(get300DB.rows[i].waterlevel);
                            }
                            timeSeries_fc300.reverse(); 
                            timeWater_fc300.reverse();//reverse descending data from db and mqtt

                            var forecast = lsq(timeSeries_fc300, timeWater_fc300);
                            FORECAST300 = parseFloat(forecast(301).toFixed(2));

                            // Calculate RMS
                            get30Alert = await dbase_mqtt.query('SELECT alertlevel from mqtt_petengoran ORDER BY datetime DESC LIMIT 100');
                            for (i=0 ; i<=get30Alert.rowCount-1; i++){
                                rmsSquare += Math.pow(get30Alert.rows[i].alertlevel, 2);
                            }    
                            rmsMean = (rmsSquare / (get30Alert.rowCount));
                            RMSROOT = parseFloat(Math.sqrt(rmsMean).toFixed(2));
                            RMSTHRESHOLD = parseFloat((RMSROOT * 9).toFixed(2)); 

                            // ALERT logic
                            //Calculate Alert
                            ALERTLEVEL = (Math.abs(FORECAST300 - WATERLEVEL)).toFixed(2);
                            //console.log("ALERT : " + ALERTLEVEL);
                            if (ALERTLEVEL >= RMSTHRESHOLD) {STATUSWARNING = "WARNING";} else STATUSWARNING = "SAFE";

                            //PUBLISH ALL DATA TO NEW TOPIC ON MQTT
                            const jsonToPublish = {
                                "DATETIME":DATETIME ,"TS" : TS, "Date":DATE, "tinggi":WATERLEVEL, "tegangan":VOLTAGE, 
                                "suhu":TEMP ,"frcst30":FORECAST30, "frcst300":FORECAST300, "alertlevel":ALERTLEVEL, "rms":RMSROOT, 
                                "threshold":RMSTHRESHOLD, "status":STATUSWARNING
                            };
                            dataArray = [DATA_ID, DATETIME, TS, DATE, WATERLEVEL, VOLTAGE, TEMP, FORECAST30, FORECAST300, RMSROOT, RMSTHRESHOLD, ALERTLEVEL]; 
                            insertQuery = await dbase_mqtt.query(`INSERT INTO mqtt_petengoran(id, datetime, time, date, waterlevel, voltage, temperature, 
                                forecast30, forecast300, rms, threshold, alertlevel) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,dataArray);
                            
                            var isoDateString = new Date(DATETIME).toISOString();
                            const jsonToJRC = {"UTC_TIME":isoDateString, "LOCAL_TIME":DATETIME, "WATERLEVEL":WATERLEVEL, "DEVICE_TEMP":TEMP, "DEVICE_VOLTAGE":VOLTAGE}
                            
                            //SEND UTC TIME TO JRC                       
                            mqtt_connect.publish('pummaUTEWS/gebang', JSON.stringify(jsonToJRC), {qos:0, retain:false});    
                            mqtt_connect.publish('pumma/petengoran',JSON.stringify(jsonToPublish), {qos: 0, retain:false}, (err) => {});
                            console.log("[U_TEWS Petengoran 001] Updated "+ Date(Date.now()));

                            //publish data to new topic for 100 data update
                            var mqttUpdate = await dbase_mqtt.query("SELECT * FROM mqtt_petengoran ORDER BY datetime DESC LIMIT 100");
                            mqtt_data={result: mqttUpdate.rows.reverse()}
                            mqtt_connect.publish('pumma/petengoran/update',JSON.stringify(mqtt_data), {qos:0, retain:true});   
                            
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

            fs.writeFile("src/petengoran/image/petengoran.png", data, {encoding: 'base64'}, function(err) {
                if(err) {
                    return console.log(err);
                }
                console.log("[U_TEWS Petengoran 001] Image file was saved!");
            }); 

            let ts = new Date(Date.now());
            var datetimes = (ts.getDate() +"-"+ (ts.getMonth()+1) +"-"+ ts.getFullYear() + "_" + ts.getHours() +":"+ ts.getMinutes() +":"+ ts.getSeconds());
            const itemCount = fs.readdirSync('src/petengoran/image/').length;
            if (itemCount <= 50){
                fs.writeFile(`src/petengoran/image/${datetimes}_petengoran.png`, data, {encoding: 'base64'}, function(err) {
                    if(err) {
                        return console.log(err);
                    }
                });
            } else {
                var result = findRemoveSync('src/petengoran/image/', {
                    age: { seconds: 600 },
                    extensions: '.png',
                    limit: 1,
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