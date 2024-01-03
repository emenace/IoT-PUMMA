 
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
