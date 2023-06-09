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
            var fl_pjg;
            var fl_ptg;
            var feedLatency_pjg;
            var feedLatency_ptg;

            getDB_panjang = await pool_panjang.query('SELECT datetime, waterlevel, feedlatency FROM mqtt_panjang ORDER by datetime DESC LIMIT 1');
            getDB_petengoran = await pool_petengoran.query('SELECT datetime, waterlevel, feedlatency FROM mqtt_petengoran ORDER by datetime DESC LIMIT 1');

            feedLatency_pjg = getDB_panjang.rows[0].feedlatency;
            feedLatency_ptg = getDB_petengoran.rows[0].feedlatency;
            lastDate_pjg = getDB_panjang.rows[0].datetime;
            lastDate_ptg = getDB_petengoran.rows[0].datetime

            var now = new Date();
            
            const msBetweenDates_ptg = (Math.abs(lastDate_ptg.getTime() - now.getTime()));
            const hoursBetweenDates_ptg = msBetweenDates_ptg / (60 * 60 * 1000);
            console.log(hoursBetweenDates_ptg.toFixed(0));

            const msBetweenDates_pjg = (Math.abs(lastDate_pjg.getTime() - now.getTime()));
            const hoursBetweenDates_pjg = msBetweenDates_pjg / (60 * 60 * 1000);
            console.log(hoursBetweenDates_pjg.toFixed(0));

            if (hoursBetweenDates_ptg.toFixed(0) > 24){
                feedLatency_ptg = "INACTIVE";
            }
            if (hoursBetweenDates_pjg.toFixed(0) > 24){
                feedLatency_ptg = "INACTIVE";
            }
            

            // if (fl_pjg > 86400000 ) {feedLatency_pjg = 9999} else {feedLatency_pjg=fl_pjg}
            // if (fl_ptg > 86400000 ) {feedLatency_ptg = "Inactive"} else {feedLatency_pjg=fl_ptg}

            status_panjang = {
                sensor : "Sonar",
                location : "Panjang, Krakatau",
                country : "Indonesia",
                provider : "Telkomsel",
                lastWater : getDB_panjang.rows[0].waterlevel,
                lastDateTime : getDB_panjang.rows[0].datetime,
                feedLatency : feedLatency_pjg,
                lastDate : new Date(lastDate_pjg).toLocaleDateString("en-CA"),
                lastTime : new Date(lastDate_pjg).toLocaleTimeString("es-ES"),
                timestamp : (moment(lastDate_pjg).locale('id').format()),
            };

            data.push(status_panjang);

            status_petengoran = {
                sensor : "Sonar",
                location : "Mangrove Petengoran, Gebang",
                country : "Indonesia",
                provider : "Telkomsel",
                lastWater : getDB_petengoran.rows[0].waterlevel,
                lastDateTime : getDB_petengoran.rows[0].datetime,
                feedLatency : feedLatency_ptg,
                lastDate : new Date(lastDate_ptg).toLocaleDateString("en-CA"),
                lastTime : new Date(lastDate_ptg).toLocaleTimeString("es-ES"),
                timestamp : (moment(lastDate_ptg).locale('id').format()),
            };
            
            data.push(status_petengoran);

            await res.json(data)
            console.log(`[REST-API GLOBAL] GET Status`);

        } catch (err){
            console.log(err);
        }
    },
}