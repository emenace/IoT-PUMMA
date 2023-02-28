const dbase_rest = require('../configs/database_canti');
require('dotenv').config()

module.exports = {

    // HTTP HANDLING

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