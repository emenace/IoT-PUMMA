//const dbase_rest = require('../configs/database_panjang');

const { Pool } = require('pg');
const dbase_rest = new Pool({
    host:host,
    posrt:port,
    user:user,
    password: password,
    database: process.env.DB_PANJANG
})

require('dotenv').config();
require('fs');

module.exports = {

    // HTTP HANDLING
    // This code is based on routes  ../src/canti/controllers/controller_mqtt_canti.js
    // If want to add new API, dont forget to add new routes

    
    // Respond request to give latest 100 data
    getDataPanjang(req,res){
        
    },

    // Respond request to give latest data by count
    getDataPanjangByID(req,res){
        
    },

    panjangPagination(req, res){
        var perPage = 100;
        var page = req.params.page;
        var offset = (page -  1) * perPage;
    
        dbase_rest.connect(function (err, client, done){
            dbase_rest.query(`SELECT count(*) as total FROM mqtt_panjang`, function(err, result){
                if (err) throw err;
                var totalRow = result.rows[0].total;
                var totalPage = Math.ceil(totalRow / perPage);            
                dbase_rest.query(`SELECT * from mqtt_panjang LIMIT ${perPage} OFFSET ${offset}`, function(err, result){
                    if (err) throw err;
                    res.json({
                        totalData:totalRow,
                        page:page,
                        totalPage:totalPage,
                        result:result.rows.reverse()                    
                    })
                    console.log("[REST-API Panjang] Data Sent");
                    done();
                });
            });
        });
    },

    latestPagedData(req, res){
        dbase_rest.connect(function (err, client, done){
            if (err) throw err;
            dbase_rest.query(`Select * from mqtt_panjang 
            where id in (select id from mqtt_panjang order by datetime DESC limit ${req.params.count})
            order by datetime DESC limit ${req.query.limit} offset ${req.query.offset}`, function(err, result){
                console.log(req.params.count);
                console.log(req.query.limit);
                console.log(req.query.offset);
                if (err) throw (err);
                res.send({
                    totalData:req.params.count,
                    count:result.rowCount,
                    result: result.rows.reverse()
                })
                console.log("[REST-API Panjang] Data Sent");
                done();
            });
        });
    },

    // Get data by Hour
    dataByHour(req, res){
        time = req.params.time;
        timer = req.query.timer;
        dataColumn = req.query.data;
        dbase_rest.connect(function (err, client, done){
            if (err) throw err;
            if (timer == "second" || timer == "minute" || timer == "hour" || timer == "day"){
                dbase_rest.query(`SELECT datetime as utc, ${dataColumn} as data
                FROM mqtt_panjang WHERE datetime >= now() - Interval '${time}' ${req.query.timer} ORDER BY datetime DESC`, function(err, result){
                    if (err) {
                        console.log(err.message);
                        res.status(404);
                        res.json({msg: `Error no column ${dataColumn} or Error time format. use available column : waterlevel, voltage, temperature,forecast30, forecast300. use time format <time>?timer=interval. Example "/1?time=day&data=waterlevel"`});
                    } 
                    res.json({
                        count:result.rowCount,
                        result: result.rows
                    })
                    console.log("[REST-API Panjang] Data Sent");
                    done();
                });
            }else {
                res.status(404);
                res.json({
                    message:"Invalid Timer. Use second, minute, hour, day",
                })
                done();
            };
            
        });
    },

    // Get data by Date
    dataByInterval(req, res){
        dateStart = req.query.start;
        dateEnd = req.query.end;
        dataColumn = req.query.data;
        dbase_rest.connect(function (err, client, done){
            if (err) throw err;
            dbase_rest.query(`SELECT datetime as utc, ${dataColumn} as data
            FROM mqtt_panjang_stored WHERE datetime BETWEEN SYMMETRIC '${dateStart}' AND '${dateEnd} 23:59:59' ORDER BY datetime DESC`, function(err, result){
                if (err) {
                    console.log(err.message)
                    res.status(404);
                    res.json({msg: `Error no column ${dataColumn} or Error date format. use available column : waterlevel, voltage, temperature,forecast30, forecast300. use date format with YYYY-M-D. Example : 2023-3-28`});
                };
                if (result.rowCount===0) {
                    res.status(404);
                    res.send("Error date format. use YYYY-M-D Example : 2023-3-28")
                    res.json({msg: "Error date format. use YYYY-M-D Example : 2023-3-28"});
                };
                res.json({
                    count:result.rowCount,
                    result: result.rows
                })
                console.log("[REST-API Panjang] Data Sent");
                done();
            });          
        });
    },

    list(req, res){
        var data = [];
        time = req.params.time;
        timer = req.query.timer;
        dataColumn = req.query.data;
        dbase_rest.connect(function (err, client, done){
            if (err) throw err;
            if (timer == "second" || timer == "minute" || timer == "hour" || timer == "day"){
                dbase_rest.query(`SELECT datetime, ${dataColumn} as data
                FROM mqtt_panjang WHERE datetime >= now() - Interval '${time}' ${req.query.timer} ORDER BY datetime DESC`, function(err, result){
                    if (err) {
                        console.log(err.message);
                        res.status(404);
                        res.json({msg: `Error no column ${dataColumn} or Error time format. use available column : waterlevel, voltage, temperature,forecast30, forecast300. use time format <time>?timer=interval. Example "/1?time=day&data=waterlevel"`});
                    }
                    for (i = 0; i<result.rowCount; i++){
                        data.push([result.rows[i].datetime, result.rows[i].data])
                    }
                    res.json({
                        count:result.rowCount,
                        result: data
                    })
                    console.log("[REST-API Panjang] Data Sent");
                    done();
                });
            }else {
                res.status(404);
                res.json({
                    message:"Invalid Timer. Use second, minute, hour, day",
                })
                done();
            };
            
        });
    },


    /// SEND ALL DATA BY PARAMETER
    
    // Get data by Hour
    dataTime(req, res){
        time = req.params.time;
        timer = req.query.timer;
        dataColumn = req.query.data;
        dbase_rest.connect(function (err, client, done){
            if (err) throw err;
            if (timer == "second" || timer == "minute" || timer == "hour" || timer == "day"){
                dbase_rest.query(`SELECT datetime as utc, waterlevel, forecast30, forecast300, rms, threshold
                FROM mqtt_panjang WHERE datetime >= now() - Interval '${time}' ${req.query.timer} ORDER BY datetime DESC`, function(err, result){
                    if (err) {
                        console.log(err.message);
                        res.status(404);
                        res.json({msg: `Error no column ${dataColumn} or Error time format. use available column : waterlevel, voltage, temperature,forecast30, forecast300. use time format <time>?timer=interval. Example "/1?time=day&data=waterlevel"`});
                    } 
                    res.json({
                        count:result.rowCount,
                        result: result.rows
                    })
                    console.log("[REST-API Panjang] Data Sent");
                    done();
                });
            }else {
                res.status(404);
                res.json({
                    message:"Invalid Timer. Use second, minute, hour, day",
                })
                done();
            };
            
        });
    },

    // Get data by Date
    dataDate(req, res){
        dateStart = req.query.start;
        dateEnd = req.query.end;
        dataColumn = req.query.data;
        dbase_rest.connect(function (err, client, done){
            if (err) throw err;
            dbase_rest.query(`SELECT datetime as utc, waterlevel, forecast30, forecast300, rms, threshold
            FROM mqtt_panjang_stored WHERE datetime BETWEEN SYMMETRIC '${dateStart}' AND '${dateEnd} 23:59:59' ORDER BY datetime DESC`, function(err, result){
                if (err) {
                    console.log(err.message)
                    res.status(404);
                    res.json({msg: `Error no column ${dataColumn} or Error date format. use available column : waterlevel, voltage, temperature,forecast30, forecast300. use date format with YYYY-M-D. Example : 2023-3-28`});
                };
                if (result.rowCount===0) {
                    res.status(404);
                    res.send("Error date format. use YYYY-M-D Example : 2023-3-28")
                    res.json({msg: "Error date format. use YYYY-M-D Example : 2023-3-28"});
                };
                res.json({
                    count:result.rowCount,
                    result: result.rows
                })
                console.log("[REST-API Panjang] Data Sent");
                done();
            });          
        });
    },

    sendImage(req, res){
        res.status(200),
        res.sendfile("src/panjang/image/panjang.png")
    },
}