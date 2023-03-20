"use strict";
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const http = require('http');
const https = require('https');
require('dotenv').config()

const privateKey = fs.readFileSync('/etc/letsencrypt/live/vps.isi-net.org/privkey.pem','utf8');
const certificate = fs.readFileSync('/etc/letsencrypt/live/vps.isi-net.org/cert.pem','utf8');
const ca = fs.readFileSync('/etc/letsencrypt/live/vps.isi-net.org/chain.pem','utf8');

const credentials = {
	key: privateKey,
	cert: certificate,
  ca: ca
};

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
       
  const dbase_panjang = require('./src/panjang/configs/database_panjang'); 
  dbase_panjang.query(`CREATE TABLE IF NOT EXISTS mqtt_panjang (
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

// API HANLDING FOR PETENGORAN
const petengoran_appRoute = require('./src/petengoran/routes/routes_http_petengoran');
api.use('/', cors(), petengoran_appRoute);

// API HANLDING FOR PANJANG
const panjang_appRoute = require('./src/panjang/routes/routes_http_panjang');
api.use('/', cors(), panjang_appRoute);

api.use('/', cors(), (req, res) => {
    res.status(404);
    res.send('404 Not Found'); // respond 404 if not available
});    

// Starting both http & https servers
const httpServer = http.createServer(api);
const httpsServer = https.createServer(credentials, api);

httpServer.listen(process.env.API_PORT, () => {
	console.log(`HTTP REST-API running on port ${process.env.API_PORT}`);
});

httpsServer.listen(4443, () => {
	console.log('HTTPS REST-API running on port 4443');
});

//// MQTT HANDLING 
const mqtt_connect = require('./src/global_config/mqtt_config')
const { incomingData_canti } = require('./src/canti/controllers/controller_mqtt_canti');
const { incomingData_petengoran } = require('./src/petengoran/controllers/controller_mqtt_petengoran');
const { incomingData_panjang } = require('./src/panjang/controllers/controller_mqtt_panjang');

//Topic Use in Canti
const topic1 = process.env.TOPIC_1; //Topic to receive data from raspberrypi
const topic2 = process.env.TOPIC_2; //Topic to receive API request

//Topic Use in Petengoran
const topic1_ptg = process.env.TOPIC_PETENGORAN1; //Topic to receive data from raspberrypi

//Topic Use in Panjang
const topic1_pjg = process.env.TOPIC_PANJANG1; //Topic to receive data from raspberrypi

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

// Data From Panjang
mqtt_connect.subscribe(topic1_pjg, (err) => {
  if (!err) {
    console.log("Subscribed to topic : " + topic1_pjg); 
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
mqtt_connect.on("message", incomingData_panjang);



