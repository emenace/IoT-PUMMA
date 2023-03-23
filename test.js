const dbase_mqtt = require('./src/panjang/configs/database_panjang');

async function main(){
    var getLastTempVolt = await dbase_mqtt.query(`SELECT waterlevel FROM mqtt_panjang ORDER BY datetime DESC LIMIT 29;`);
    console.log(getLastTempVolt.rows);
}

main();
