const dbase_canti = require('./src/canti/configs/database_canti'); 
dbase_canti.query(`CREATE TABLE IF NOT EXISTS mqtt_canti (
  time TIME NOT NULL, 
  date DATE NOT NULL, 
  waterLevel FLOAT, 
  voltage FLOAT, 
  temperature FLOAT,
  forecast30 FLOAT, 
  forecast300 FLOAT,
  rms FLOAT,
  threshold FLOAT)
  `, function(err, result){
    console.log("Database Canti Connected");
  });

  dbase_canti.query(`CREATE TABLE IF NOT EXISTS mqtt_canti_stored (
    time TIME NOT NULL, 
    date DATE NOT NULL, 
    waterLevel FLOAT, 
    voltage FLOAT, 
    temperature FLOAT,
    forecast30 FLOAT, 
    forecast300 FLOAT,
    rms FLOAT,
    threshold FLOAT)
    `, function(err, result){
      console.log("Database Canti Connected");
    });
