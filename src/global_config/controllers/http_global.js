const { Pool } = require('pg');
const moment = require('moment');
host = process.env.DB_HOST;
port= process.env.DB_PORT;
user= process.env.DB_USER;
password = process.env.DB_PASSWORD

const pool_canti = new Pool({
    host:host,
    port:port,
    user:user,
    password: password,
    database: process.env.DB_CANTI
});
const pool_petengoran = new Pool({
    host:host,
    port:port,
    user:"user_petengoran",
    password: "pwd123",
    database: process.env.DB_PETENGORAN
});
const pool_panjang = new Pool({
    host:host,
    port:port,
    user:"user_panjang",
    password: "pwd123",
    database: process.env.DB_PANJANG
});

require('dotenv').config();
pool_panjang.connect();
pool_petengoran.connect();
module.exports = {

    // HTTP HANDLING
    // This code is based on routes  ../src/canti/controllers/controller_mqtt_canti.js
    // If want to add new API, dont forget to add new routes

    // Get Device Status
    async deviceStatus(req, res){
        try {
            var data = [];
            // await pool_panjang.connect();
            // await pool_petengoran.connect();

            getDB_panjang = await pool_panjang.query('SELECT datetime, waterlevel, feedlatency FROM mqtt_panjang ORDER by datetime DESC LIMIT 1');
            getDB_petengoran = await pool_petengoran.query('SELECT datetime, waterlevel, feedlatency FROM mqtt_petengoran ORDER by datetime DESC LIMIT 1');

            status_panjang = {
                sensor : "Sonar",
                location : "Panjang, Krakatau",
                country : "Indonesia",
                provider : "Telkomsel",
                lastWater : getDB_panjang.rows[0].waterlevel,
                lastDateTime : getDB_panjang.rows[0].datetime,
                feedLatency : getDB_panjang.rows[0].feedlatency,
                lastDate : new Date(getDB_panjang.rows[0].datetime).toLocaleDateString("en-CA"),
                lastTime : new Date(getDB_panjang.rows[0].datetime).toLocaleTimeString("es-ES"),
                timestamp : (moment(getDB_panjang.rows[0].datetime).locale('id').format()),
            };

            data.push(status_panjang);

            status_petengoran = {
                sensor : "Sonar",
                location : "Mangrove Petengoran, Gebang",
                country : "Indonesia",
                provider : "Telkomsel",
                lastWater : getDB_petengoran.rows[0].waterlevel,
                lastDateTime : getDB_petengoran.rows[0].datetime,
                feedLatency : getDB_petengoran.rows[0].feedlatency,
                lastDate : new Date(getDB_petengoran.rows[0].datetime).toLocaleDateString("en-CA"),
                lastTime : new Date(getDB_petengoran.rows[0].datetime).toLocaleTimeString("es-ES"),
                timestamp : (moment(getDB_petengoran.rows[0].datetime).locale('id').format()),
            };
            
            data.push(status_petengoran);

            await res.json(data)
            console.log(`[REST-API GLOBAL] GET Status`);

        } catch (err){
            console.log(err);
        }
    },
}