require('dotenv').config()

// Database Initialize
const {init_db_marinaj} = require('./src/marinaj/configs/db_initialize_marinaj')
const {init_db_gebang} = require('./src/gebang/configs/db_initialize_gebang')
//init_db_marinaj(); 
//();

// Handle message from mqtt
const {data_gebang} = require('../IoT-PUMMA/src/gebang/controllers/controller_mqtt_gebang')
const {data_marinaj} = require('../IoT-PUMMA/src/marinaj/controllers/controller_mqtt_marinaj')

// MQTT HANDLING 
const mqtt_connect = require('./src/global_config/config/mqtt_config')
var topic = process.env.TOPIC.split(", "); //Topic as Array

// Subscribe topic to receive data from raspberryPi
mqtt_connect.subscribe(topic, (err) => {
  if (!err) {
    topic.forEach(function(value){
      console.log("Subscribed to topic : " + value); 
    });
  } else throw (err);
});


mqtt_connect.on("message", data_marinaj);
mqtt_connect.on("message", data_gebang);



