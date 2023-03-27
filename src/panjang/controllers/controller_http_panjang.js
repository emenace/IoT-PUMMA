const dbase_rest = require('../configs/database_panjang');
require('dotenv').config();
require('fs');

module.exports = {

    // HTTP HANDLING
    // This code is based on routes  ../src/canti/controllers/controller_mqtt_canti.js
    // If want to add new API, dont forget to add new routes

    
    // Respond request to give latest 100 data
    getDataPanjang(req,res){
        dbase_rest.connect(function (err, client, done){
            if (err) throw err;
            dbase_rest.query("SELECT * FROM mqtt_panjang ORDER BY datetime DESC LIMIT 100", function(err, result){
                if (err) throw (err);
                res.send({
                    count:result.rowCount,
                    result: result.rows
                })
                console.log("[REST-API Panjang] Data Sent");
                done();
            });
        });
    },

    // Respond request to give latest data by count
    getDataPanjangByID(req,res){
        let count = parseInt(req.params.count);
        dbase_rest.connect(function (err, client, done){
            if (err) throw err;
            dbase_rest.query(`SELECT * FROM mqtt_panjang ORDER BY datetime DESC LIMIT ${count}`, function(err, result){
                if (err) throw (err);
                res.json({
                    count:result.rowCount,
                    result: result.rows
                })
                console.log("[REST-API Panjang] Data Sent");
                done();
            });
        });
    },

    // Respond request to give last 1 day data
    getDayPanjang1(req, res){
        dbase_rest.connect(function (err, client, done){
            if (err) throw err;
            dbase_rest.query(`SELECT * FROM mqtt_panjang WHERE datetime >= now() - Interval '1' DAY ORDER BY date DESC, time DESC`, function(err, result){
                if (err) throw (err);
                res.json({
                    count:result.rowCount,
                    result: result.rows.reverse()
                })
                console.log("[REST-API Panjang] Data Sent");
                done();
            });
        });
    },

    // Respond request to give last 3 day data
    getDayPanjang3(req, res){
        dbase_rest.connect(function (err, client, done){
            if (err) throw err;
            dbase_rest.query(`SELECT date FROM mqtt_panjang WHERE datetime >= now() - Interval '3' DAY ORDER BY date DESC, time DESC`, function(err, result){
                if (err) throw (err);
                var perPage = 100;
                var totalRow = result.rowCount ;
                var totalPage = Math.ceil(totalRow / perPage);

                res.json({
                    count:result.rowCount,
                    totalPage:totalPage,
                    message:"Data too big. please use 3 days pagination endpoint",
                    endpoint: "/panjang/3days/:page"
                })

                console.log("[REST-API Panjang] Data Sent");
                done();
            });
        });
    },
    
    // Respond request to give last 7 day data
    getDayPanjang7(req, res){
        dbase_rest.connect(function (err, client, done){
            if (err) throw err;
            dbase_rest.query(`SELECT date FROM mqtt_panjang WHERE datetime >= now() - Interval '7' DAY ORDER BY date DESC, time DESC`, function(err, result){
                if (err) throw (err);
                var perPage = 100;
                var totalRow = result.rowCount ;
                var totalPage = Math.ceil(totalRow / perPage);

                res.json({
                    count:result.rowCount,
                    totalPage:totalPage,
                    message:"Data too big. please use 7 days pagination endpoint",
                    endpoint: "/panjang/7days/:page"
                })
                console.log("[REST-API Panjang] Data Sent");
                done();
            });
        });
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

    getDayPanjang7page(req, res){
        dbase_rest.connect(function (err, client, done){
            if (err) throw err;
            dbase_rest.query(`SELECT date FROM mqtt_panjang WHERE datetime >= now() - Interval '7' DAY ORDER BY datetime DESC`, function(err, result){
                if (err) throw (err);

                var perPage = 100;
                var page = req.params.page;
                var offset = (page -  1) * perPage;
                var totalRow = result.rowCount;
                var totalPage = Math.ceil(totalRow / perPage);
                var counts = result.rowCount;

                dbase_rest.query(`SELECT *  FROM mqtt_panjang WHERE datetime >= now() - Interval '7' DAY ORDER BY datetime DESC LIMIT ${perPage} OFFSET ${offset}`, function(err, result){
                    res.json({
                        count:counts,
                        totalPage:totalPage,
                        page:page,
                        result:result.rows.reverse()
                    })
                });
                console.log("[REST-API Panjang] Data Sent");
                done();
            });
        });
    },

    getDayPanjang3page(req, res){
        dbase_rest.connect(function (err, client, done){
            if (err) throw err;
            dbase_rest.query(`SELECT date FROM mqtt_panjang WHERE datetime > now() - Interval '3' DAY ORDER BY datetime DESC`, function(err, result){
                if (err) throw (err);

                var perPage = 100;
                var page = req.params.page;
                var offset = (page -  1) * perPage;
                var totalRow = result.rowCount;
                var totalPage = Math.ceil(totalRow / perPage);
                var counts = result.rowCount;

                dbase_rest.query(`SELECT *  FROM mqtt_panjang WHERE datetime > now() - Interval '3' DAY ORDER BY datetime DESC LIMIT ${perPage} OFFSET ${offset}`, function(err, result){
                    res.json({
                        count:counts,
                        totalPage:totalPage,
                        page:page,
                        result:result.rows.reverse()
                    })
                });
                console.log("[REST-API Panjang] Data Sent");
                done();
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
        dbase_rest.connect(function (err, client, done){
            if (err) throw err;
            if (timer == "second" || timer == "minute" || timer == "hour" || timer == "day"){
                dbase_rest.query(`SELECT id, datetime, waterlevel, voltage, temperature, forecast30, forecast300 FROM mqtt_panjang WHERE datetime >= now() - Interval '${time}' ${req.query.timer} ORDER BY datetime DESC`, function(err, result){
                    if (err) console.log(err.message);
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

    // Get data by Date Interval
    dataByInterval(req, res){
        dateStart = req.query.start;
        dateEnd = req.query.end;
        dbase_rest.connect(function (err, client, done){
            if (err) throw err;
            dbase_rest.query(`SELECT id, datetime as datetime_utc, waterlevel, voltage, temperature, forecast30, forecast300 
            FROM mqtt_panjang WHERE datetime BETWEEN SYMMETRIC '${dateStart}' AND '${dateEnd} 23:59:59' ORDER BY datetime DESC`, function(err, result){
                if (err) {
                    console.log(err.message)
                    res.status(404);
                    res.json({msg: "Error date format. use YYYY-M-D Example : 2023-3-28"});
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

    // Get Device Status
    deviceStatus(req, res){
        dbase_rest.connect(function (err, client, done){
            if (err) throw err;
            dbase_rest.query(`SELECT datetime waterlevel FROM mqtt_panjang LIMIT 1`, function(err, result){
                if (err) {
                    console.log(err.message);
                };
                res.json({
                    sensor : "Sonar",
                    location : "Gebang, Pesawaran",
                    country : "Indonesia",
                    provider : "Telkomsel",
                    lastWater : result.rows[0].waterlevel,
                    lastDate : result.rows[0].datetime,
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