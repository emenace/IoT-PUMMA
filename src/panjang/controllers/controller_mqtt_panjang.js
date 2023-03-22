const dbase_mqtt = require('../configs/database_panjang');
const mqtt_connect = require('../../global_config/mqtt_config');
const moment = require('moment-timezone');
const lsq = require('least-squares'); //Least square method to forecasting

require('dotenv').config()

// PATH name check on .env
TS_PATH = process.env.PAYLOAD_PANJANG_TS // Now using TSjsn;
DATE_PATH = process.env.PAYLOAD_PANJANG_DATE //Now using Datejsn;
WATERLEVEL_PATH = process.env.PAYLOAD_PANJANG_WATERLEVEL //Now using tinggijsn; //change path based on data from raspberrypi
TEMP_PATH = process.env.PAYLOAD_PANJANG_TEMP
VOLTAGE_PATH = process.env.PAYLOAD_PANJANG_VOLTAGE

var { DATA_ID, TS, DATE, WATERLEVEL, TEMP, VOLTAGE,FORECAST30, FORECAST300, DATETIME } = [];

//Save RMS data for forecasting 
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
                }
                // Logic to check there is "suhu" & "tegangan" or not in JSON from mqtt
                // If "suhu" or "tegangan" available in json, use that data.. if not, use last data from database.
                
                // Check data is available or not in database   
                dbase_mqtt.query("SELECT CASE WHEN EXISTS (SELECT * FROM mqtt_panjang LIMIT 1) THEN 1 ELSE 0 END", function(err, result){
                    if (result.rows[0].case === 0){
                        console.log("Table is empty. no value about voltage and temp. use 0 instead");
                        // If table is empty, value of variables set to 0.
                        TEMP = 0;
                        VOLTAGE = 0;
                    } 
                    else {
                        //get last data from database.
                        dbase_mqtt.query("SELECT temperature, voltage FROM mqtt_panjang ORDER BY date DESC, time DESC LIMIT 1", function(err, result){
                            if (!err){

                                // Checking payload has temp or not
                                if (payload.hasOwnProperty(TEMP_PATH)) {
                                    TEMP = parseFloat(payload[TEMP_PATH]);
                                } else {
                                    TEMP = (result.rows[0].temperature); //use latest data from database if temperature not available
                                }

                                // Checking payload has voltage or not
                                if (payload.hasOwnProperty(VOLTAGE_PATH)) {
                                    VOLTAGE = parseFloat(payload[VOLTAGE_PATH]);
                                } else {
                                    VOLTAGE = (result.rows[0].voltage); //use latest data from database if voltage not available
                                }
                            } else throw (err);
                        });
                    };
                });

                // Forecasting 30 & RMS
                // Get 30 data for forecasting
                // 30 forecast : 29 data from db, 1 data from mqtt
                dbase_mqtt.query(`SELECT waterlevel FROM mqtt_panjang
                            ORDER BY date DESC, time DESC LIMIT 29;`,function(err,result){

                    if (err) throw err;
                    var timeSeries = []; var timeWater = [];
                    var rmsSquare = 0;   var rmsMean = 0;

                    // Add latest data to forecast series
                    timeSeries.push(30);
                    timeWater.push(WATERLEVEL);

                    //parse all data from db to variable
                    for (i=0 ; i<=result.rowCount-1; i++){
                        timeSeries.push(i);
                        timeWater.push(result.rows[i].waterlevel);
                        rmsSquare += Math.pow(result.rows[i].waterlevel, 2);
                    }    

                    timeSeries.reverse(); 
                    timeWater.reverse();//reverse descending data from db and mqtt

                    var forecast = lsq(timeSeries, timeWater);
                    FORECAST30 = parseFloat(forecast(31).toFixed(2));

                    // Calculate RMS
                    rmsMean = (rmsSquare / (result.rowCount));
                    RMSROOT = parseFloat(Math.sqrt(rmsMean).toFixed(2));
                    RMSTHRESHOLD = parseFloat((RMSROOT * 9).toFixed(2));   
                });

                // Forecasting 300 & RMS
                // Get 30 data for forecasting
                // 300 forecast : 299 data from db, 1 data from mqtt
                dbase_mqtt.query(`SELECT waterlevel FROM mqtt_panjang 
                            ORDER BY date DESC, time DESC LIMIT 299;`,function(err,result){
                    if (err) throw err;
                    var timeSeries = []; var timeWater = [];

                    // Add latest data to forecast series
                    timeSeries.push(30);
                    timeWater.push(WATERLEVEL);

                    //parse all data from db to variable
                    for (i=0 ; i<=result.rowCount-1; i++){
                        timeSeries.push(i);
                        timeWater.push(result.rows[i].waterlevel);
                    }
                    timeSeries.reverse(); 
                    timeWater.reverse();//reverse descending data from db and mqtt

                    var forecast = lsq(timeSeries, timeWater);
                    FORECAST300 = parseFloat(forecast(301).toFixed(2));
                });

                // Threshold logic
                if (WATERLEVEL >= RMSTHRESHOLD) {
                STATUSWARNING = "WARNING";
                } else STATUSWARNING = "SAFE";

                //PUBLISH ALL DATA TO NEW TOPIC ON MQTT
                const jsonToPublish = {"DATETIME":DATETIME ,"TS" : TS, "Date":DATE, "tinggi":WATERLEVEL, "tegangan":VOLTAGE, 
                                    "suhu":TEMP ,"frcst30":FORECAST30, "frcst300":FORECAST300, "rms":RMSROOT, 
                                    "threshold":RMSTHRESHOLD, "status":STATUSWARNING};

                //SEND UTC TIME TO JRC
                var isoDateString = new Date(DATETIME).toISOString();
                const jsonToJRC = {"UTC_TIME":isoDateString, "LOCAL_TIME":DATETIME, "WATERLEVEL":WATERLEVEL, "DEVICE_TEMP":TEMP, "DEVICE_VOLTAGE":VOLTAGE}
                mqtt_connect.publish('pummaUTEWS/panjang', JSON.stringify(jsonToJRC), {qos:0, retain:false});
                
                mqtt_connect.publish('pumma/panjang',JSON.stringify(jsonToPublish), {qos: 0, retain:false}, (err) => {
                    if (err) throw (err);
                    //INSERT ALL DATA TO DATABASE
                    const dataArray = [DATA_ID, DATETIME, TS, DATE, WATERLEVEL, VOLTAGE, TEMP, FORECAST30, FORECAST300, RMSROOT, RMSTHRESHOLD]; 
                    const insertQuery = `INSERT INTO mqtt_panjang(id, datetime, time, date, waterlevel, voltage, temperature, 
                                        forecast30, forecast300, rms, threshold) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`;
                    dbase_mqtt.query(insertQuery, dataArray, (err, res) => {
                        if (err) throw err;
                        console.log(`DB PANJANG : Time = ${TS}, WLevel = ${WATERLEVEL}, FRC 30 = ${FORECAST30}, FRC 300 = ${FORECAST300}, Volt = ${VOLTAGE}, Temp = ${TEMP}`);
                        
                        //publish data to new topic for 100 data update
                        dbase_mqtt.query("SELECT * FROM mqtt_panjang ORDER BY date DESC, time DESC LIMIT 100", function(err, result){
                            if (err) throw (err);
                                mqtt_data={result: result.rows.reverse()}
                                mqtt_connect.publish('pumma/panjang/update',JSON.stringify(mqtt_data), {qos:0, retain:true});                           
                            console.log("Data published From Panjang");
                        });
                    });       
                });
            }
        }
    }
}