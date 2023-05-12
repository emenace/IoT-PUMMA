const { Pool } = require('pg');
const moment = require('moment');
host = process.env.DB_HOST;
port= process.env.DB_PORT;
user= process.env.DB_USER;
password = process.env.DB_PASSWORD

const pool_canti = new Pool({
    host:host,
    posrt:port,
    user:user,
    password: password,
    database: process.env.DB_CANTI
});
const pool_petengoran = new Pool({
    host:host,
    posrt:port,
    user:user,
    password: password,
    database: process.env.DB_PETENGORAN
});
const pool_panjang = new Pool({
    host:host,
    posrt:port,
    user:user,
    password: password,
    database: process.env.DB_PANJANG
});

require('dotenv').config();

module.exports = {

    // HTTP HANDLING
    // This code is based on routes  ../src/canti/controllers/controller_mqtt_canti.js
    // If want to add new API, dont forget to add new routes

    // Get Device Status
    async deviceStatus(req, res){
        var data = [];
        pool_panjang.connect(async function (err, client, done){
            getDB_panjang = await pool_panjang.query('SELECT datetime, waterlevel FROM mqtt_panjang ORDER by datetime DESC LIMIT 1');
            waterlevel = getDB_panjang.rows[0].waterlevel;
            dateTimeDB1 = getDB_panjang.rows[0].datetime;
            const date2 = new Date(dateTimeDB1);
   
            const timestamp = (moment(dateTimeDB1).locale('id').format());
            
            var time1 = date2.toLocaleTimeString("es-ES");
            var date1 = date2.toLocaleDateString("en-CA");

            status_panjang = {
                sensor : "Sonar",
                location : "Panjang, Krakatau",
                country : "Indonesia",
                provider : "Telkomsel",
                lastWater : waterlevel,
                lastDateTime : dateTimeDB1,
                lastDate : date1,
                lastTime : time1,
                timestamp : timestamp,
                
            }
            pool_petengoran.connect(async function (err, client, done){
                getDB_petengoran = await pool_petengoran.query('SELECT datetime, waterlevel FROM mqtt_petengoran ORDER by datetime DESC LIMIT 1');
                waterlevel = getDB_petengoran.rows[0].waterlevel;
                dateTimeDB = getDB_petengoran.rows[0].datetime;
                const date2 = new Date(dateTimeDB);

                moment.locale('id');
                const timestamp = (moment(dateTimeDB).locale('id').format());
                
                
                var time = date2.toLocaleTimeString("es-ES");
                var date = date2.toLocaleDateString("en-CA");

                status_petengoran = {
                    sensor : "Sonar",
                    location : "Mangrove Petengoran, Gebang",
                    country : "Indonesia",
                    provider : "Telkomsel",
                    lastWater : waterlevel,
                    lastDateTime : dateTimeDB,
                    lastDate : date,
                    lastTime : time,
                    timestamp : timestamp,
                }           
                data.push(status_petengoran);
                
    
                // SEND DATA TO API
                res.json(data)
                done();
            });
            data.push(status_panjang);
            done();
        });
        
    },
}