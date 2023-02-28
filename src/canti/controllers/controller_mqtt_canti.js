const dbase_mqtt = require('../configs/database_canti');

require('dotenv').config()

module.exports = {

    // MQTT HANDLING
    incomingData1(topic, message){

        // PATH name check on .env
        TS_PATH = process.env.PAYLOAD_CANTI_TS // Now using TSjsn;
        DATE_PATH = process.env.PAYLOAD_CANTI_DATE //Now using Datejsn;
        WATERLEVEL_PATH = process.env.PAYLOAD_CANTI_WATERLEVEL //Now using tinggijsn; //change path based on data from raspberrypi

        var { TS, DATE, WATERLEVEL, TEMP, VOLTAGE} = [];

        console.log(`Incoming Data From Topic ${topic}`);
        const payload = JSON.parse(message.toString());
        //console.log(payload);

        if ((payload.hasOwnProperty(TS_PATH)) 
            && (payload.hasOwnProperty(DATE_PATH)) 
            && (payload.hasOwnProperty(WATERLEVEL_PATH))){

            if ((payload[TS_PATH] != null) 
                && (payload[DATE_PATH] != null) 
                && (payload[WATERLEVEL_PATH] != null)) {

                TS = payload[TS_PATH]
                DATE = payload[DATE_PATH];
                WATERLEVEL = parseFloat(payload[WATERLEVEL_PATH]);
            }
            console.log(TS + DATE + WATERLEVEL);
        }
    }
}