const dbase = require('../../global_config/config/database_config'); 

module.exports = {

    init_db_gebang(){
        dbase.query(`CREATE TABLE IF NOT EXISTS gebang_waterlevel_fast (
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
              console.log("FastStorage Database Gebang Petengoran Connected");
            })
            dbase.query(`CREATE TABLE IF NOT EXISTS gebang_waterlevel_storage(
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
                console.log("FullStorage Database Gebang Petengoran Connected");
              })
    }
}

