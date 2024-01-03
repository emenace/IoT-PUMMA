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
      