"use strict";
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const http = require('http');
const https = require('https');
require('dotenv').config()

       
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

//// MQTT HANDLING 
const mqtt_connect = require('./src/global_config/mqtt_config')
const { incomingData_panjang } = require('./src/panjang/controllers/controller_mqtt_panjang');

// List of all subscribed topics
var topic = [
  process.env.TOPIC_PANJANG1,
  process.env.TOPIC_PANJANG_IMAGE,
 ];

// Subscribe topic to receive data from raspberryPi
// Data From Canti
mqtt_connect.subscribe(topic, (err) => {
  if (!err) {
    topic.forEach(function(value){
      console.log("Subscribed to topic : " + value); 
    });
  } else throw (err);
});

mqtt_connect.on("message", incomingData_panjang);



