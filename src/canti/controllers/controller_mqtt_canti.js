const dbase_mqtt = require('../configs/database_canti');
const mqtt_connect = require('../configs/mqtt_canti')
const lsq = require('least-squares'); //Least square method to forecasting

require('dotenv').config()

// PATH name check on .env
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
    incomingData1(topic, message){
     
        console.log(`Incoming Data From Topic ${topic}`);
        const payload = JSON.parse(message.toString());
        //console.log(payload);

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

        //Logic to check there is "suhu" & "tegangan" or not in JSON from mqtt
        //If "suhu" or "tegangan" available in json, use that data.. if not, use last data from database (checkdata function).
        if (payload.hasOwnProperty(TEMP_PATH)) {TEMP = parseFloat(payload[TEMP_PATH]);} else {
            dbase_mqtt.query("SELECT CASE WHEN EXISTS (SELECT * FROM mqtt_canti LIMIT 1) THEN 1 ELSE 0 END", function(err, result){
                if (result.rows[0].case === 0){
                    console.log("Table is empty");
                    // If table is empty, value of variables set to 0.
                    TEMP = 0;
                } 
                else {
                    //get last data from database.
                    dbase_mqtt.query("SELECT temperature FROM mqtt_canti ORDER BY date DESC, time DESC LIMIT 1", function(err, result){
                        if (!err){
                            // If table is not empty, value of variables set from database.
                            TEMP = (result.rows[0].temperature);
                        } else throw (err);
                    });
                    
                };
            });
        };
        if (payload.hasOwnProperty(VOLTAGE_PATH)) {VOLTAGE = parseFloat(payload[VOLTAGE_PATH]);} else {
            //Checking if data is available
            dbase_mqtt.query("SELECT CASE WHEN EXISTS (SELECT * FROM mqtt_canti LIMIT 1) THEN 1 ELSE 0 END", function(err, result){
                if (result.rows[0].case === 0){
                    console.log("Table is empty");
                    // If table is empty, value of variables set to 0.
                    VOLTAGE = 0;
                } 
                else {
                    //get last data from database.
                    dbase_mqtt.query("SELECT voltage FROM mqtt_canti ORDER BY date DESC, time DESC LIMIT 1", function(err, result){
                        if (!err){
                            // If table is not empty, value of variables set from database.
                            VOLTAGE = (result.rows[0].voltage);
                        } else throw (err);
                    });
                    
                };
            });
        };

        // Forecasting 30 & RMS
        //Get 30 data for forecasting
        //30 forecast : 29 data from db, 1 data from mqtt
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

        //Forecasting 300 & RMS
        //Get 30 data for forecasting
        //300 forecast : 299 data from db, 1 data from mqtt
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

        //Threshold logic
        if (WATERLEVEL >= RMSTHRESHOLD) {
        STATUSWARNING = "WARNING";
        } else STATUSWARNING = "SAFE";

        console.log(`
        Time : ${TS}, Date : ${DATE}, WaterLevel : ${WATERLEVEL}, FC30 : ${FORECAST30}, FC300 : ${FORECAST300}
        Temperature : ${TEMP}, Voltage : ${VOLTAGE}
        RMS : ${RMSROOT}, THRESHOLD : ${RMSTHRESHOLD}
        STATUS : ${STATUSWARNING}`);

        //PUBLISH ALL DATA TO NEW TOPIC ON MQTT
        const jsonToPublish = {"TS" : TS, "Date":DATE, "tinggi":WATERLEVEL, "tegangan":VOLTAGE, 
                               "suhu":TEMP ,"frcst30":FORECAST30, "frcst300":FORECAST300, "rms":RMSROOT, 
                               "threshold":RMSTHRESHOLD, "status":STATUSWARNING}
        mqtt_connect.publish('pummamqtt/canti/2',JSON.stringify(jsonToPublish), {qos: 0, retain:false}, (err) => {if (err) {console.log(err);};

        //INSERT ALL DATA TO DATABASE
        if ((VOLTAGE === null) || TEMP === null){
            VOLTAGE = 12;
            TEMP = 20;
        }
        const dataArray = [TS, DATE, WATERLEVEL, VOLTAGE, TEMP, FORECAST30, FORECAST300]; 
        const insertQuery = `INSERT INTO mqtt_canti(time, date, waterlevel, voltage, temperature, 
                             forecast30, forecast300) VALUES ($1, $2, $3, $4, $5, $6, $7)`;
        dbase_mqtt.query(insertQuery, dataArray, (err, res) => {
            if (err) throw err;
            //console.log(`Data : ${JSON.stringify(jsonToPublish)} INSERTED TO DATABASE`);
            console.log(`DATA INSERTED TO DATABASE : Time = ${TS}, WLevel = ${WATERLEVEL}, FRC 30 = ${FORECAST30}, FRC 300 = ${FORECAST300}, Volt = ${VOLTAGE}, Temp = ${TEMP}`);
        });       
    });
    }
}