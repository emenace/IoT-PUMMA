const dbase_mqtt = require('../panjang/configs/database_panjang');
const mqtt_connect = require('../global_config/mqtt_config');
const moment = require('moment-timezone');
const fs = require('fs');
const findRemoveSync = require('find-remove')
const lsq = require('least-squares'); //Least square method to forecasting

require('dotenv').config()

// PATH name check on .env
TS_PATH = process.env.PAYLOAD_PANJANG_TS // Now using TSjsn;
DATE_PATH = process.env.PAYLOAD_PANJANG_DATE //Now using Datejsn;
WATERLEVEL_PATH = process.env.PAYLOAD_PANJANG_WATERLEVEL //Now using tinggijsn; //change path based on data from raspberrypi
TEMP_PATH = process.env.PAYLOAD_PANJANG_TEMP
VOLTAGE_PATH = process.env.PAYLOAD_PANJANG_VOLTAGE

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
    async incomingData_panjang(topic,message){

        // Handling data from topic 1 (data from raspberrypi)
        if (topic === process.env.TOPIC_PANJANG1){
            
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
                    var DuplicateCheck = await dbase_mqtt.query(`SELECT CASE WHEN EXISTS (SELECT datetime FROM mqtt_panjang where id = ${DATA_ID}) THEN 1 ELSE 0 END`)
                    if (DuplicateCheck.rows[0].case === 0){ //If no duplicate then :
                        console.log(`[U_TEWS PANJANG 003] OK. No data Duplicated on time : ${DATETIME}`);

                        // fetch data DB
                        var dataDB_panjang = await dbase_mqtt.query(`SELECT datetime, waterlevel, voltage, temperature, alertlevel FROM mqtt_panjang ORDER BY datetime DESC LIMIT 300;`);
                        var dbPanjang_dataLength = dataDB_panjang.rowCount;

                        if (payload.hasOwnProperty(TEMP_PATH)) {
                            TEMP = parseFloat(payload[TEMP_PATH]);
                        } else {
                            TEMP = (dataDB_panjang.rows[dbPanjang_dataLength-1].temperature); //use latest data from database if temperature not available
                        }

                        if (payload.hasOwnProperty(VOLTAGE_PATH)) {
                            VOLTAGE = parseFloat(payload[VOLTAGE_PATH]);
                        } else {
                            VOLTAGE = (dataDB_panjang.rows[dbPanjang_dataLength-1].voltage); //use latest data from database if temperature not available
                        }

                        // Forecast 30
                        var timeSeries = []; var timeWater = [];
                        var rmsSquare = 0;   var rmsMean = 0;
                        timeSeries.push(30);
                        timeWater.push(WATERLEVEL);

                        for (i=0 ; i<=29; i++){
                            timeSeries.push(i);
                            timeWater.push(dataDB_panjang.rows[i].waterlevel);
                        }   
                        timeSeries.reverse(); 
                        timeWater.reverse();
                        var forecast = lsq(timeSeries, timeWater);
                        FORECAST30 = parseFloat(forecast(31).toFixed(2));

                        // Forecast 300
                        var timeSeries_fc300 = []; var timeWater_fc300 = [];
                        timeSeries_fc300.push(300);
                        timeWater_fc300.push(WATERLEVEL);

                        for (i=0 ; i<=299; i++){
                            timeSeries_fc300.push(i);
                            timeWater_fc300.push(dataDB_panjang.rows[i].waterlevel);
                        }
                        timeSeries_fc300.reverse(); 
                        timeWater_fc300.reverse();//reverse descending data from db and mqtt

                        var forecast3 = lsq(timeSeries_fc300, timeWater_fc300);
                        FORECAST300 = parseFloat(forecast3(301).toFixed(2));

                        // Calculate RMS
                        for (i=0 ; i<=100; i++){
                            rmsSquare += Math.pow(dataDB_panjang.rows[i].alertlevel, 2);
                        }    
                        rmsMean = (rmsSquare / (dataDB_panjang.rowCount));
                        RMSROOT = parseFloat(Math.sqrt(rmsMean).toFixed(2));
                        RMSTHRESHOLD = parseFloat((RMSROOT * 9).toFixed(2)); 

                        // ALERT logic
                        //Calculate Alert
                        ALERTLEVEL = (Math.abs(FORECAST300 - WATERLEVEL)).toFixed(2);
                        //console.log("ALERT : " + ALERTLEVEL);
                        if (ALERTLEVEL >= RMSTHRESHOLD) {STATUSWARNING = "WARNING";} else STATUSWARNING = "SAFE";

                        console.log(`Panjang = ID : ${DATA_ID}, DATETIME : ${DATETIME}, WL : ${WATERLEVEL}, FC30 : ${FORECAST30}, FC300 : ${FORECAST300}, RMS : ${RMSROOT}, THR : ${RMSTHRESHOLD}, AL : ${ALERTLEVEL}`);

                        dataArray = [DATA_ID, DATETIME, TS, DATE, WATERLEVEL, VOLTAGE, TEMP, FORECAST30, FORECAST300, RMSROOT, RMSTHRESHOLD, ALERTLEVEL]; 
                        insertQuery = await dbase_mqtt.query(`INSERT INTO mqtt_panjang(id, datetime, time, date, waterlevel, voltage, temperature, 
                            forecast30, forecast300, rms, threshold, alertlevel) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,dataArray);

                    } else {
                        console.log(`[U_TEWS PANJANG 003] ERROR Data Duplicated on time : ${DATETIME}`);
                    }    
                }
            }
        }

        if (topic === process.env.TOPIC_PANJANG_IMAGE){
            const imagePayload = message.toString();
            fs.writeFile("src/panjang/image/panjang_b64string.txt", imagePayload, function(err) {
                if(err) {
                    return console.log(err);
                }
                //console.log("IMAGE [U_TEWS Panjang] file was saved!");
            }); 

            let image = `data:image/jpeg;base64,${message}`
            var data = image.replace(/^data:image\/\w+;base64,/, '');
            fs.writeFile(`src/panjang/image/panjang.png`, data, {encoding: 'base64'}, function(err) {
                if(err) {
                    return console.log(err);
                }
                console.log("[U_TEWS Panjang 003   ] Image file was saved!");
            });

            let ts = new Date(Date.now());
            var datetimes = (ts.getDate() +"-"+ (ts.getMonth()+1) +"-"+ ts.getFullYear() + "_" + ts.getHours() +":"+ ts.getMinutes() +":"+ ts.getSeconds());
            const itemCount = fs.readdirSync('src/panjang/image/').length;
            if (itemCount <= 50){
                fs.writeFile(`src/panjang/image/${datetimes}_panjang.png`, data, {encoding: 'base64'}, function(err) {
                    if(err) {
                        return console.log(err);
                    }
                });
            } else {
                var result = findRemoveSync('src/panjang/image/', {
                    age: { seconds: 3600 },
                    extensions: '.png',
                    limit: 50
                });
                fs.writeFile(`src/panjang/image/${datetimes}_panjang.png`, data, {encoding: 'base64'}, function(err) {
                    if(err) {
                        return console.log(err);
                    }
                });
            }   
        }
    }
}