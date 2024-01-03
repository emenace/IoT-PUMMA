"use strict";
require('dotenv').config()

// Database Initialize
const {init_db_marinaj} = require('./src/marinaj/configs/db_initialize_marinaj')

// MQTT HANDLING 
const mqtt_connect = require('./src/global_config/mqtt_config')
var topic = process.env.TOPIC_MARINAJ.split(", "); //Topic as Array

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
//mqtt_connect.on("message", incomingData_canti);
//mqtt_connect.on("message", incomingData_petengoran);
//mqtt_connect.on("message", incomingData_panjang);



