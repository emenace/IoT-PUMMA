const dbase_mqtt2 = require('../panjang/configs/database_panjang');
const mqtt_connect = require('../global_config/mqtt_config');
module.exports = {

    // MQTT HANDLING
    async mqtt_test(topic,message){

        // Handling data from topic 1 (data from raspberrypi)
        if (topic === process.env.TOPIC_PANJANG1){
            console.log("DATA INCOMING");
            var last100 = await dbase_mqtt2.query("SELECT * FROM mqtt_panjang ORDER BY datetime DESC LIMIT 1");
            data = last100.rows;
            count = last100.rowCount;
            const publish = {
                "count":count, "data":data
            }
            mqtt_connect.publish('mqtt_test', JSON.stringify(publish), {qos:2, retain:false});   
            console.log("Data published");
        }

    }
}