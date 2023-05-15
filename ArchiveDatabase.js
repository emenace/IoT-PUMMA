const { Pool } = require('pg');
require('dotenv').config()

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
  
  


initialize_db(); //Call first function to initialize database

/* 
This code is used for archiving data from main table (mqtt_canti) to (archive_mqtt_canti), so main table is only used to store 1 hour of data.
This program is run once every 1 hour.
1 hour is set from PM2 with cron-restart (check pm2 on server).
*/

async function initialize_db(){//Function to initializing database. check and create table if not exist
    pool_canti.connect(function (err, client, done){
        if (err) throw err;
        console.log("Database Canti Connected");

        pool_canti.query(`CREATE TABLE IF NOT EXISTS archive_mqtt_canti (
            time TIME NOT NULL, 
            date DATE NOT NULL, 
            waterLevel FLOAT, 
            voltage FLOAT, 
            temperature FLOAT,
            forecast30 FLOAT, 
            forecast300 FLOAT,
            rms FLOAT,
            threshold FLOAT)
            `, function (err, result) {
            console.log("Database Archive Canti Created");
            });

        pool_canti.query(`INSERT INTO archive_mqtt_canti SELECT * FROM mqtt_canti`,function(err, result){
            if (err) throw (err);
            console.log("Archiving....");
            // pool_canti.query('TRUNCATE TABLE mqtt_canti', function(err, result){
            //     if (err) throw (err);
                console.log(`${new Date().toLocaleString()} |`+" Database Canti Archived Successfully");
            // })
        });
    });
    
    pool_petengoran.connect(function (err, client, done){
        if (err) throw err;
        console.log("Database Petengoran Connected");
        pool_petengoran.query(`CREATE TABLE IF NOT EXISTS mqtt_petengoran (
            id BIGINT NOT NULL PRIMARY KEY,
            datetime TIMESTAMP NOT NULL,
            time TIME NOT NULL, 
            date DATE NOT NULL, 
            waterLevel FLOAT, 
            voltage FLOAT, 
            temperature FLOAT,
            forecast30 FLOAT, 
            forecast300 FLOAT,
            rms FLOAT,
            threshold FLOAT,
            alertlevel FLOAT,
            feedlatency INT)
            `, function(err, result){
              console.log("Database Archive Petengoran Connected");
            });
        pool_petengoran.query(`INSERT INTO archive_mqtt_petengoran (SELECT * FROM mqtt_petengoran WHERE id NOT IN (select id from archive_mqtt_petengoran))`, function (err, result) {
            if (err)
                throw (err);
            console.log("Archiving....");
            // pool_petengoran.query('TRUNCATE TABLE mqtt_petengoran', function (err, result) {
            //     if (err)
            //         throw (err);
                console.log(`${new Date().toLocaleString()} |`+" Database Petengoran Archived Successfully");
            // });
        });
      
    });
    pool_panjang.connect(function (err, client, done){
        if (err) throw err;
        console.log("Database Panjang Connected");
        pool_panjang.query(`CREATE TABLE IF NOT EXISTS mqtt_panjang (
            id BIGINT NOT NULL PRIMARY KEY,
            datetime TIMESTAMP NOT NULL,
            time TIME NOT NULL, 
            date DATE NOT NULL, 
            waterLevel FLOAT, 
            voltage FLOAT, 
            temperature FLOAT,
            forecast30 FLOAT, 
            forecast300 FLOAT,
            rms FLOAT,
            threshold FLOAT,
            alertlevel FLOAT,
            feedlatency INT)
            `, function(err, result){
              console.log("Database Archive Petengoran Connected");
            });
        pool_panjang.query(`INSERT INTO archive_mqtt_panjang (SELECT * FROM mqtt_panjang WHERE id NOT IN (select id from archive_mqtt_panjang))`,function(err, result){
            if (err) throw (err);
            console.log("Archiving....");
            // pool_panjang.query('TRUNCATE TABLE mqtt_panjang', function(err, result){
            //     if (err) throw (err);
                console.log(`${new Date().toLocaleString()} |`+" Database Panjang Archived Successfully");
            // })
        });
    });
}

process.on('SIGTERM', () => {
    console.info('SIGTERM signal received.');
    console.log('Closing Archiving program.');
    process.exit(0);
});
