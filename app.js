"use strict";
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
const dbase_canti = require('./src/canti/configs/database_canti'); 
dbase_canti.query(`CREATE TABLE IF NOT EXISTS mqtt_canti (
  time TIME NOT NULL, 
  date DATE NOT NULL, 
  waterLevel FLOAT, 
  voltage FLOAT, 
  temperature FLOAT,
  forecast30 FLOAT, 
  forecast300 FLOAT,
  rms FLOAT,
  threshold FLOAT)
  `, function(err, result){
    console.log("Database Canti Connected");
  });

const dbase_petengoran = require('./src/petengoran/configs/database_petengoran'); 
dbase_petengoran.query(`CREATE TABLE IF NOT EXISTS mqtt_petengoran (
  id BIGINT NOT NULL PRIMARY KEY,
  datetime TIMESTAMP NOT NULL,
  time TIME NOT NULL, 
  date DATE NOT NULL, 
  waterLevel FLOAT, 
  voltage FLOAT, 
  temperature FLOAT,
  forecast30 FLOAT, 
  forecast300 FLOAT,
  rms FLOAT,
  threshold FLOAT)
  `, function(err, result){
    console.log("Database Petengoran Connected");
  });
            

// API HANLDING FOR CANTI
const canti_appRoute = require('./src/canti/routes/route_http_canti');
api.use('/', cors(), canti_appRoute);

// API HANLDING FOR CANTI
const petengoran_appRoute = require('./src/petengoran/routes/routes_http_petengoran');
api.use('/', cors(), petengoran_appRoute);

api.use('/', cors(), (req, res) => {
    res.status(404);
    res.send('404 Not Found'); // respond 404 if not available
});     
api.listen(process.env.API_PORT, ()=>{
    console.log('HTTP REST-API Berjalan di Port : ',process.env.API_PORT);
});

//// MQTT HANDLING 
const mqtt_connect = require('./src/global_config/mqtt_config')
const { incomingData_canti } = require('./src/canti/controllers/controller_mqtt_canti');
const { incomingData_petengoran } = require('./src/petengoran/controllers/controller_mqtt_petengoran');

//Topic Use in Canti
const topic1 = process.env.TOPIC_1; //Topic to receive data from raspberrypi
const topic2 = process.env.TOPIC_2; //Topic to receive API request

//Topic Use in Petengoran
const topic1_ptg = process.env.TOPIC_PETENGORAN1; //Topic to receive data from raspberrypi

// Subscribe topic to receive data from raspberryPi
// Data From Canti
mqtt_connect.subscribe(topic1, (err) => {
  if (!err) {
    console.log("Subscribed to topic : " + topic1); 
  } else throw (err);
});

// Data From Petengoran
mqtt_connect.subscribe(topic1_ptg, (err) => {
  if (!err) {
    console.log("Subscribed to topic : " + topic1_ptg); 
  } else throw (err);
});


//Subscribe topic to receive API request
//Test Only
mqtt_connect.subscribe(topic2, (err) => {
  if (!err) {
    console.log("Subscribed to topic : " + topic2); 
  } else throw (err);
});

// Handle message from mqtt
mqtt_connect.on("message", incomingData_canti);
mqtt_connect.on("message", incomingData_petengoran);




