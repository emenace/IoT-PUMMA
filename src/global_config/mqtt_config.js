const Mqtt = require("mqtt");
require('dotenv').config()

const mqtt = Mqtt.connect(process.env.MQTT_HOST, {
    port : process.env.MQTT_PORT,
    username: process.env.MQTT_USER,
    password: process.env.MQTT_PASSWORD,
    clientId: 'mqttjs_' + Math.random(),
    keepalive: 60,
    reconnectPeriod: 1000,
    clean: true,
});

mqtt.on("connect", () => {
    console.log(`MQTT Connected on host : ${process.env.MQTT_HOST}`); 
})

module.exports = mqtt;