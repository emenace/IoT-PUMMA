"use strict";
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const http = require('http');
const https = require('https');
require('dotenv').config()

// CHECK for database. create if database not exist
const dbase_canti = require('./src/canti/configs/database_canti'); 
dbase_canti.query(`CREATE TABLE IF NOT EXISTS mqtt_canti (
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
    console.log("Database Canti Connected");
  });

  dbase_canti.query(`CREATE TABLE IF NOT EXISTS mqtt_canti_stored (
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
      console.log("Database Canti Connected");
    });

const dbase_petengoran = require('./src/petengoran/configs/database_petengoran'); 
dbase_petengoran.query(`CREATE TABLE IF NOT EXISTS mqtt_petengoran (
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
    console.log("Database Petengoran Connected");
  });
  dbase_petengoran.query(`CREATE TABLE IF NOT EXISTS mqtt_petengoran_stored (
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
      console.log("Database Petengoran Connected");
    });
       
  const dbase_panjang = require('./src/panjang/configs/database_panjang'); 
  dbase_panjang.query(`CREATE TABLE IF NOT EXISTS mqtt_panjang (
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
      console.log("Database Petengoran Connected");
    });
    dbase_panjang.query(`CREATE TABLE IF NOT EXISTS mqtt_panjang_stored (
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
        console.log("Database Petengoran Connected");
      });

//// MQTT HANDLING 
const mqtt_connect = require('./src/global_config/mqtt_config')
const { incomingData_canti } = require('./src/canti/controllers/controller_mqtt_canti');
const { incomingData_petengoran } = require('./src/petengoran/controllers/controller_mqtt_petengoran');
const { incomingData_panjang } = require('./src/panjang/controllers/controller_mqtt_panjang');

// List of all subscribed topics
var topic = [
  process.env.TOPIC_CANTI1,
  process.env.TOPIC_CANTI_IMAGE,
  process.env.TOPIC_PETENGORAN1,
  process.env.TOPIC_PETENGORAN_IMAGE,
  process.env.TOPIC_PANJANG1,
  process.env.TOPIC_PANJANG_IMAGE,
 ];

// Subscribe topic to receive data from raspberryPi
// Data From Canti
mqtt_connect.subscribe(topic, (err) => {
  if (!err) {
    topic.forEach(function(value){
      console.log("Subscribed to topic : " + value); 
    });
  } else throw (err);
});

// Handle message from mqtt
mqtt_connect.on("message", incomingData_canti);
mqtt_connect.on("message", incomingData_petengoran);
mqtt_connect.on("message", incomingData_panjang);



