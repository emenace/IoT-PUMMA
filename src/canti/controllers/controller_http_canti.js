const dbase_rest = require('../configs/database_canti');
require('dotenv').config()

module.exports = {

    // HTTP HANDLING
    // This code is based on routes  ../src/canti/controllers/controller_mqtt_canti.js
    // If want to add new API, dont forget to add new routes

    // Respond request to give latest 100 data
    getDataCanti(req,res){
        dbase_rest.connect(function (err, client, done){
            if (err) throw err;
            dbase_rest.query("SELECT * FROM mqtt_canti ORDER BY date DESC, time DESC LIMIT 100", function(err, result){
                if (err) throw (err);
                res.send({
                    count:result.rowCount,
                    result: result.rows.reverse()
                })
                console.log("Data has been send");
                done();
            });
        });
    },

    // Respond request to give latest data by count
    getDataCantiByID(req,res){
        let count = parseInt(req.params.count);
        dbase_rest.connect(function (err, client, done){
            if (err) throw err;
            dbase_rest.query(`SELECT * FROM mqtt_canti ORDER BY date DESC, time DESC LIMIT ${count}`, function(err, result){
                if (err) throw (err);
                res.json({
                    count:result.rowCount,
                    result: result.rows.reverse()
                })
                console.log("Data has been send");
                done();
            });
        });
    },

    // Respond request to give last 1 day data
    getDayCanti1(req, res){
        dbase_rest.connect(function (err, client, done){
            if (err) throw err;
            dbase_rest.query(`SELECT * FROM mqtt_canti WHERE date > now() - Interval '1' DAY ORDER BY date ASC, time ASC`, function(err, result){
                if (err) throw (err);
                res.json({
                    count:result.rowCount,
                    result: result.rows
                })
                console.log("Data has been send");
                done();
            });
        });
    },

    // Respond request to give last 3 day data
    getDayCanti3(req, res){
        dbase_rest.connect(function (err, client, done){
            if (err) throw err;
            dbase_rest.query(`SELECT * FROM mqtt_canti WHERE date > now() - Interval '3' DAY ORDER BY date ASC, time ASC`, function(err, result){
                if (err) throw (err);
                res.json({
                    count:result.rowCount,
                    result: result.rows
                })
                console.log("Data has been send");
                done();
            });
        });
    },
    
    // Respond request to give last 7 day data
    getDayCanti7(req, res){
        dbase_rest.connect(function (err, client, done){
            if (err) throw err;
            dbase_rest.query(`SELECT * FROM mqtt_canti WHERE date > now() - Interval '7' DAY ORDER BY date ASC, time ASC`, function(err, result){
                if (err) throw (err);
                res.json({
                    count:result.rowCount,
                    result: result.rows
                })
                console.log("Data has been send");
                done();
            });
        });
    },
}