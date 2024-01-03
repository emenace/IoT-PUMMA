"use strict";
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const http = require('http');
const https = require('https');
require('dotenv').config()

//// MQTT HANDLING 
const mqtt_connect = require('./src/global_config/mqtt_config')
const { incomingData_canti } = require('./src/canti/controllers/controller_mqtt_canti');
const { incomingData_petengoran } = require('./src/petengoran/controllers/controller_mqtt_petengoran');
const { incomingData_panjang } = require('./src/panjang/controllers/controller_mqtt_panjang');

// List of all subscribed topics
var topic = [
  process.env.TOPIC_1, 
  process.env.TOPIC_2, 
  process.env.TOPIC_PETENGORAN1,
  process.env.TOPIC_PETENGORAN_IMAGE,
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

// Handle message from mqtt
mqtt_connect.on("message", incomingData_canti);
mqtt_connect.on("message", incomingData_petengoran);
mqtt_connect.on("message", incomingData_panjang);



