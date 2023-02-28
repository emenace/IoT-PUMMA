const dbase_mqtt = require('./src/canti/configs/database_canti');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config()

const api = express();

api.use(bodyParser.urlencoded({ extended: false }))
api.use(bodyParser.json())
api.use(cors({
    origin:['http://localhost/3000','*']
}));

// CHECK for database. create if database not exist
dbase_mqtt.query(` CREATE TABLE IF NOT EXISTS mqtt_canti (
  time TIME NOT NULL, 
  date DATE NOT NULL, 
  waterLevel FLOAT, 
  voltage FLOAT, 
  temperature FLOAT,
  forecast30 FLOAT, 
  forecast 300 FLOAT )
  `, function(err, result){
    console.log("Database Connected");
  });
            

// API HANLDING FOR CANTI
const canti_appRoute = require('./src/canti/routes/route_http_canti');
api.use('/', cors(), canti_appRoute);

api.use('/', cors(), (req, res) => {
    res.status(404);
    res.send('404 Not Found');
});     
api.listen(process.env.API_PORT, ()=>{
    console.log('HTTP REST-API Berjalan di Port : ',process.env.API_PORT);
});

//// MQTT HANDLING FOR CANTI
const { incomingData, mqttAPI } = require('./src/canti/controllers/controller_mqtt_canti');
const mqtt_connect = require('./src/canti/configs/mqtt_canti')
const topic1 = process.env.TOPIC_1; //Topic to receive data from raspberrypi
const topic2 = process.env.TOPIC_2; //Topic to receive API request

// Subscribe topic to receive data from raspberryPi
mqtt_connect.subscribe(topic1, (err) => {
  if (!err) {
    console.log("Subscribed to topic : " + topic1); 
  } else throw (err);
});

//Subscribe topic to receive API request
mqtt_connect.subscribe(topic2, (err) => {
  if (!err) {
    console.log("Subscribed to topic : " + topic2); 
  } else throw (err);
});

// Handle message from mqtt
mqtt_connect.on("message", incomingData);



