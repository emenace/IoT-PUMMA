"use strict";
require('dotenv').config()
const dbase_mqtt2 = require('./src/panjang/configs/database_panjang');
const mqtt_connect = require('./src/global_config/mqtt_config')
const { mqtt_test } = require('./src/test/controller_test');

// List of all subscribed topics
var topic = [ process.env.TOPIC_PANJANG1 ];
mqtt_connect.subscribe(topic, (err) => {
  if (!err) {
    topic.forEach(function(value){
      console.log("Subscribed to topic : " + value); 
    });
  } else throw (err);
});

async function getData(){
    var dataDB = await dbase_mqtt2.query("SELECT * from mqtt_panjang ORDER BY datetime DESC LIMIT 1");
    var data = dataDB.rows;
    var count = dataDB.rowCount;
    const publish = {
        "count":count, "data":data
    }
    mqtt_connect.publish('mqtt_test', JSON.stringify(publish), {qos:2, retain:false});   
    console.log("Data published");
    console.log("data sent");
}

setInterval(getData, 1000);



