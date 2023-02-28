const dbase_mqtt = require('../configs/database_canti');
const mqtt_connect = require('../configs/mqtt_canti')
const lsq = require('least-squares'); //Least square method to forecasting

require('dotenv').config()

// PATH name check on .env
TOPIC_1 = process.env.TOPIC_1;
TOPIC_API = process.env.TOPIC_2;

TS_PATH = process.env.PAYLOAD_CANTI_TS // Now using TSjsn;
DATE_PATH = process.env.PAYLOAD_CANTI_DATE //Now using Datejsn;
WATERLEVEL_PATH = process.env.PAYLOAD_CANTI_WATERLEVEL //Now using tinggijsn; //change path based on data from raspberrypi
TEMP_PATH = process.env.PAYLOAD_CANTI_TEMP
VOLTAGE_PATH = process.env.PAYLOAD_CANTI_VOLTAGE

var { TS, DATE, WATERLEVEL, TEMP, VOLTAGE,FORECAST30, FORECAST300 } = [];

//Save RMS data for forecasting 
var RMSROOT;
var RMSTHRESHOLD;
var STATUSWARNING;

module.exports = {

    // MQTT HANDLING
    incomingData(topic,message){

        // Handling data from topic 1 (data from raspberrypi)
        if (topic === TOPIC_1){
            
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
                }
            }

                // TEMPORARY. Add value to voltage and temp because its not available now
                if ((VOLTAGE === null) || TEMP === null){
                    VOLTAGE = 12;
                    TEMP = 20;
                } // DELETE IF NOT USE

            // Logic to check there is "suhu" & "tegangan" or not in JSON from mqtt
            // If "suhu" or "tegangan" available in json, use that data.. if not, use last data from database.
            
            // Check data is available or not in database   
            dbase_mqtt.query("SELECT CASE WHEN EXISTS (SELECT * FROM mqtt_canti LIMIT 1) THEN 1 ELSE 0 END", function(err, result){
                if (result.rows[0].case === 0){
                    console.log("Table is empty. no value about voltage and temp. use 0 instead");
                    // If table is empty, value of variables set to 0.
                    TEMP = 0;
                    VOLTAGE = 0;
                } 
                else {
                    //get last data from database.
                    dbase_mqtt.query("SELECT temperature, voltage FROM mqtt_canti ORDER BY date DESC, time DESC LIMIT 1", function(err, result){
                        if (!err){

                            // Checking payload has temp or not
                            if (payload.hasOwnProperty(TEMP_PATH)) {
                                TEMP = parseFloat(payload[TEMP_PATH]);
                            } else {
                                TEMP = (result.rows[0].temperature); //use latest data from database if temperature not available
                            }

                            // Checking payload has voltage or not
                            if (payload.hasOwnProperty(TEMP_PATH)) {
                                VOLTAGE = (result.rows[0].voltage);
                            } else {
                                TEMP = (result.rows[0].temperature); //use latest data from database if voltage not available
                            }
                        } else throw (err);
                    });
                };
            });

            // Forecasting 30 & RMS
            // Get 30 data for forecasting
            // 30 forecast : 29 data from db, 1 data from mqtt
            dbase_mqtt.query(`SELECT waterlevel FROM mqtt_canti 
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
                
                //TESTING PURPOSE
                var tw30 = timeWater;
                mqtt_connect.publish('pummamqtt/canti/chart/',JSON.stringify(tw30), {qos: 0, retain:false}, (err) => {
                    if (err) {console.log(err);}
                });

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
            dbase_mqtt.query(`SELECT waterlevel FROM mqtt_canti 
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

            // Show All Data To console.log 
            // Uncomment console.log below to show data on terminal

            // console.log(`
            // Time : ${TS}, Date : ${DATE}, WaterLevel : ${WATERLEVEL}, FC30 : ${FORECAST30}, FC300 : ${FORECAST300}
            // Temperature : ${TEMP}, Voltage : ${VOLTAGE}
            // RMS : ${RMSROOT}, THRESHOLD : ${RMSTHRESHOLD}
            // STATUS : ${STATUSWARNING}`);

            //PUBLISH ALL DATA TO NEW TOPIC ON MQTT
            const jsonToPublish = {"TS" : TS, "Date":DATE, "tinggi":WATERLEVEL, "tegangan":VOLTAGE, 
                                "suhu":TEMP ,"frcst30":FORECAST30, "frcst300":FORECAST300, "rms":RMSROOT, 
                                "threshold":RMSTHRESHOLD, "status":STATUSWARNING}
            mqtt_connect.publish('pummamqtt/canti/2',JSON.stringify(jsonToPublish), {qos: 0, retain:false}, (err) => {if (err) {console.log(err);};

            //INSERT ALL DATA TO DATABASE
            const dataArray = [TS, DATE, WATERLEVEL, VOLTAGE, TEMP, FORECAST30, FORECAST300, RMSROOT, RMSTHRESHOLD]; 
            const insertQuery = `INSERT INTO mqtt_canti(time, date, waterlevel, voltage, temperature, 
                                forecast30, forecast300, rms, threshold) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`;
            dbase_mqtt.query(insertQuery, dataArray, (err, res) => {
                if (err) throw err;
                console.log(`DATA INSERTED TO DATABASE : Time = ${TS}, WLevel = ${WATERLEVEL}, FRC 30 = ${FORECAST30}, FRC 300 = ${FORECAST300}, Volt = ${VOLTAGE}, Temp = ${TEMP}`);
            });       
        });
        }

        // Handling topic 2 (API)
        if (topic === TOPIC_API) {
            payload = (message.toString());
            
            if (payload === "getDataCanti"){
                dbase_mqtt.query("SELECT * FROM mqtt_canti ORDER BY date DESC, time DESC LIMIT 100", function(err, result){
                    if (err) throw (err);
                    mqtt_connect.publish(TOPIC_API,JSON.stringify(result.rows.reverse()), {qos:2, retain:true});
                    console.log("Data published");
                });
            } 
        }
    }
}
     