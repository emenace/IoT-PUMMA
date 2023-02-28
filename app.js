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

// API HANLDING FOR CANTI
const canti_appRoute = require('./src/canti/routes/route_http_canti');
api.use('/', cors(), canti_appRoute);

api.use('/', cors(), (req, res) => {
    res.status(404);
    res.send('404 Not Found');
});     
api.listen(8080, ()=>{
    console.log('HTTP REST-API Berjalan di Port : 8080');
});

//// MQTT HANDLING FOR CANTI
const { incomingData1, mqttAPI } = require('./src/canti/controllers/controller_mqtt_canti');
const mqtt_connect = require('./src/canti/configs/mqtt_canti')
const topic = "pummamqtt";
console.log(topic);

mqtt_connect.subscribe(topic, (err) => {
  if (!err) {
    console.log("MQTT CONNECTED");
    console.log("Subscribed to topic : " + topic); 
  } else throw (err);
});
mqtt_connect.on("message", incomingData1);



