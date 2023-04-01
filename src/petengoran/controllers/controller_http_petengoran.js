const dbase_rest = require('../configs/database_petengoran');
require('dotenv').config();

module.exports = {

    // HTTP HANDLING
    // This code is based on routes  ../src/canti/controllers/controller_mqtt_canti.js
    // If want to add new API, dont forget to add new routes

    
    // Respond request to give latest 100 data
    getDataPetengoran(req,res){
        dbase_rest.connect(function (err, client, done){
            if (err) throw err;
            dbase_rest.query("SELECT * FROM mqtt_petengoran ORDER BY datetime DESC LIMIT 100", function(err, result){
                if (err) throw (err);
                res.send({
                    count:result.rowCount,
                    result: result.rows
                })
                console.log("Data has been send");
                done();
            });
        });
    },

    // Respond request to give latest data by count
    getDataPetengoranByID(req,res){
        let count = parseInt(req.params.count);
        dbase_rest.connect(function (err, client, done){
            if (err) throw err;
            dbase_rest.query(`SELECT * FROM mqtt_petengoran ORDER BY datetime DESC LIMIT ${count}`, function(err, result){
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

    // Respond request to give last 1 day data
    getDayPetengoran1(req, res){
        dbase_rest.connect(function (err, client, done){
            if (err) throw err;
            dbase_rest.query(`SELECT * FROM mqtt_petengoran WHERE date >= now() - Interval '1' DAY ORDER BY datetime DESC`, function(err, result){
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

    // Respond request to give last 3 day data
    getDayPetengoran3(req, res){
        dbase_rest.connect(function (err, client, done){
            if (err) throw err;
            dbase_rest.query(`SELECT date FROM mqtt_petengoran WHERE date >= now() - Interval '3' DAY ORDER BY datetime DESC`, function(err, result){
                if (err) throw (err);
                var perPage = 100;
                var totalRow = result.rowCount ;
                var totalPage = Math.ceil(totalRow / perPage);

                res.json({
                    count:result.rowCount,
                    totalPage:totalPage,
                    message:"Data too big. please use 3 days pagination endpoint",
                    endpoint: "/petengoran/3days/:page"
                })

                console.log("Data has been send");
                done();
            });
        });
    },
    
    // Respond request to give last 7 day data
    getDayPetengoran7(req, res){
        dbase_rest.connect(function (err, client, done){
            if (err) throw err;
            dbase_rest.query(`SELECT date FROM mqtt_petengoran WHERE date >= now() - Interval '7' DAY ORDER BY datetime DESC`, function(err, result){
                if (err) throw (err);
                var perPage = 100;
                var totalRow = result.rowCount ;
                var totalPage = Math.ceil(totalRow / perPage);

                res.json({
                    count:result.rowCount,
                    totalPage:totalPage,
                    message:"Data too big. please use 7 days pagination endpoint",
                    endpoint: "/petengoran/7days/:page"
                })
                console.log("Data has been send");
                done();
            });
        });
    },

    petengoranPagination(req, res){
        var perPage = 100;
        var page = req.params.page;
        var offset = (page -  1) * perPage;
    
        dbase_rest.connect(function (err, client, done){
        dbase_rest.query(`SELECT count(*) as total FROM mqtt_petengoran`, function(err, result){
            if (err) throw err;
            var totalRow = result.rows[0].total;
            var totalPage = Math.ceil(totalRow / perPage);            
            dbase_rest.query(`SELECT * from mqtt_petengoran LIMIT ${perPage} OFFSET ${offset}`, function(err, result){
                if (err) throw err;
                res.json({
                    totalData:totalRow,
                    page:page,
                    totalPage:totalPage,
                    result:result.rows.reverse()                    
                })
                console.log("Data has been send");
                done();
            });
        });
        });
   },

    getDayPetengoran7page(req, res){
        dbase_rest.connect(function (err, client, done){
            if (err) throw err;
            dbase_rest.query(`SELECT date FROM mqtt_petengoran WHERE datetime >= now() - Interval '7' DAY ORDER BY datetime DESC`, function(err, result){
                if (err) throw (err);

                var perPage = 100;
                var page = req.params.page;
                var offset = (page -  1) * perPage;
                var totalRow = result.rowCount;
                var totalPage = Math.ceil(totalRow / perPage);
                var counts = result.rowCount;

                dbase_rest.query(`SELECT *  FROM mqtt_petengoran WHERE datetime > now() - Interval '7' DAY ORDER BY datetime DESC LIMIT ${perPage} OFFSET ${offset}`, function(err, result){
                    res.json({
                        count:counts,
                        totalPage:totalPage,
                        page:page,
                        result:result.rows.reverse()
                    })
                });
                console.log("Data has been send");
                done();
            });
        });
    },

    getDayPetengoran3page(req, res){
        dbase_rest.connect(function (err, client, done){
            if (err) throw err;
            dbase_rest.query(`SELECT date FROM mqtt_petengoran WHERE datetime >= now() - Interval '3' DAY ORDER BY datetime DESC`, function(err, result){
                if (err) throw (err);

                var perPage = 100;
                var page = req.params.page;
                var offset = (page -  1) * perPage;
                var totalRow = result.rowCount;
                var totalPage = Math.ceil(totalRow / perPage);
                var counts = result.rowCount;

                dbase_rest.query(`SELECT *  FROM mqtt_petengoran WHERE datetime >= now() - Interval '3' DAY ORDER BY datetime DESC LIMIT ${perPage} OFFSET ${offset}`, function(err, result){
                    res.json({
                        count:counts,
                        totalPage:totalPage,
                        page:page,
                        result:result.rows.reverse()
                    })
                });
                console.log("Data has been send");
                done();
            });
        });
    },

    latestPagedData(req, res){
        dbase_rest.connect(function (err, client, done){
            if (err) throw err;
            dbase_rest.query(`Select * from mqtt_petengoran 
            where id in (select id from mqtt_petengoran order by datetime DESC limit ${req.params.count})
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
                console.log("Data has been send");
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
                FROM mqtt_petengoran WHERE datetime >= now() - Interval '${time}' ${req.query.timer} ORDER BY datetime DESC`, function(err, result){
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

    // Get data by Date Interval
    dataByInterval(req, res){
        dateStart = req.query.start;
        dateEnd = req.query.end;
        dataColumn = req.query.data;
        dbase_rest.connect(function (err, client, done){
            if (err) throw err;
            dbase_rest.query(`SELECT datetime as utc, ${dataColumn} as data
            FROM mqtt_petengoran WHERE datetime BETWEEN SYMMETRIC '${dateStart}' AND '${dateEnd} 23:59:59' ORDER BY datetime DESC`, function(err, result){
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
                    location : "Panjang, Krakatau",
                    country : "Indonesia",
                    provider : "Telkomsel",
                    lastWater : result.rows[0].waterlevel,
                    lastDate_utc : result.rows[0].datetime,
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
                FROM mqtt_petengoran WHERE datetime >= now() - Interval '${time}' ${req.query.timer} ORDER BY datetime DESC`, function(err, result){
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

    sendImage(req, res){
        res.status(200),
        res.sendfile("src/petengoran/image/petengoran.png")
    },
}