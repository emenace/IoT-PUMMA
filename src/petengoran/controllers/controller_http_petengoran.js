const path = require('path');
const moment = require('moment');
const { Pool } = require('pg');
const { off } = require('process');
const dbase_rest = new Pool({
    host:process.env.DB_HOST,
    port:process.env.DB_PORT,
    user:"user_petengoran",
    password: "pwd123",
    database: process.env.DB_PETENGORAN
})
dbase_rest.connect();

require('dotenv').config();
require('fs');

module.exports = {

    //////////////////////// RAW DATA ///////////////////////////

    async get_100Data(req,res){
        data = await dbase_rest.query(`SELECT datetime, waterlevel, voltage, temperature, 
            forecast30, forecast300, rms, threshold, alertlevel, feedlatency 
            FROM mqtt_petengoran ORDER BY datetime DESC LIMIT 100`);
        
        res.status(200);
        res.send({
            count:data.rowCount,
            result:data.rows.reverse(),
        })

        console.log("[REST-API Petengoran] GET 100 Data");
    },

    async get_countData(req,res){
        var count = parseInt(req.params.count);
        data = await dbase_rest.query(`SELECT datetime, time, date, waterlevel, voltage, temperature, 
            forecast30, forecast300, rms, threshold, alertlevel, feedlatency 
            FROM mqtt_petengoran ORDER BY datetime DESC LIMIT ${count}`);
        res.status(200);
        res.send({
            count:data.rowCount,
            result:data.rows.reverse(),
        })

        console.log(`[REST-API Petengoran] GET ${count} Data`);
        
    },

    //////////////////////// PAGINATED  ///////////////////////////

    async get_pagination(req, res){
        var perPage = 100;
        var page = req.params.page;
        var offset = (page -  1) * perPage;
    
        countData = await dbase_rest.query(`SELECT count(*) as total FROM mqtt_petengoran`);
        var totalRow = countData.rows[0].total;
        var totalPage = Math.ceil(totalRow/perPage);

        data = await dbase_rest.query(`SELECT datetime, waterlevel, voltage, temperature, 
        forecast30, forecast300, rms, threshold, alertlevel, feedlatency
        FROM mqtt_petengoran LIMIT ${perPage} OFFSET ${offset}`)

        res.json({
            totalData:totalRow,
            page:page,
            totalPage:totalPage,
            result:data.rows.reverse()                    
        })
        console.log(`[REST-API Petengoran] GET ALL DATA BY PAGE. PAGE ${page} OF ${totalPage}`);
    },

    async get_paginationCount(req, res){
        data = await dbase_rest.query(`SELECT datetime, waterlevel, voltage, temperature, 
        forecast30, forecast300, rms, threshold, alertlevel, feedlatency 
        FROM mqtt_petengoran 
        WHERE id IN (SELECT id FROM mqtt_petengoran ORDER BY datetime DESC LIMIT ${req.params.count})
        ORDER BY datetime DESC LIMIT ${req.query.limit} OFFSET ${req.query.offset}`)
        res.send({
            totalData:req.params.count,
            count:data.rowCount,
            result: data.rows.reverse()
        })
        console.log(`[REST-API Petengoran] GET DATA BY PAGE. ${req.params.count} DATA WITH LIMIT ${req.query.limit} OFFSET ${req.query.offset} `);
    },

    //////////////////////// BY TIME ///////////////////////////

    async get_byTime_obj(req, res){
        time = req.params.time;
        timer = req.query.timer;
        dataColumn = req.query.data;
        if (timer == "second" || timer == "minute" || timer == "hour" || timer == "day"){
            dbase_rest.query(`SELECT datetime, ${dataColumn} as data
            FROM mqtt_petengoran WHERE datetime >= now() - Interval '${time}' ${req.query.timer} ORDER BY datetime DESC`, function(err, result){
                if (err) {
                    console.log(err.message);
                    res.status(404);
                    res.json({msg: `Error no column ${dataColumn} or Error time format. use available column : waterlevel, voltage, temperature,forecast30, forecast300. use time format <time>?timer=interval. Example "/1?time=day&data=waterlevel"`});
                } 
                res.json({
                    count:result.rowCount,
                    result: result.rows.reverse(),
                })
                console.log(`[REST-API Petengoran] GET ${dataColumn} FOR ${time} ${timer} AS OBJECT`);
            });
        }else {
            res.status(404);
            res.json({
                message:"Invalid Timer. Use second, minute, hour, day",
            })
        };
    },

    async get_byTime_list(req, res){
        var data = [];
        time = req.params.time;
        timer = req.query.timer;
        dataColumn = req.query.data;
        // dbase_rest.connect(function (err, client){
        //     if (err) throw err;
            if (timer == "second" || timer == "minute" || timer == "hour" || timer == "day"){
                dbase_rest.query(`SELECT datetime, ${dataColumn} as data
                FROM mqtt_petengoran WHERE datetime >= now() - Interval '${time}' ${req.query.timer} ORDER BY datetime DESC`, function(err, result){
                    if (err) {
                        console.log(err.message);
                        res.status(404);
                        res.json({msg: `Error no column ${dataColumn} or Error time format. use available column : waterlevel, voltage, temperature,forecast30, forecast300. use time format <time>?timer=interval. Example "/1?time=day&data=waterlevel"`});
                    }
                    for (i = 0; i<result.rowCount; i++){
                        const timeGMT7 = (moment(result.rows[i].datetime).locale('id').format());
                        data.push([timeGMT7, result.rows[i].data])
                    }
                    res.json({
                        count:result.rowCount,
                        result: data.reverse(),
                    })
                    console.log(`[REST-API Petengoran] GET ${dataColumn} FOR ${time} ${timer} AS LIST`);
                });
            }else {
                res.status(404);
                res.json({
                    message:"Invalid Timer. Use second, minute, hour, day",
                })
            };
            
        // });
    },

    //////////////////////// BY DATE ///////////////////////////

    async get_byDate_obj(req, res){
        dateStart = req.query.start;
        dateEnd = req.query.end;  
        dataColumn = req.query.data;
        dbase_rest.connect(function (err, client){
            if (err) throw err;
            dbase_rest.query(`SELECT datetime as utc, ${dataColumn} as data
            FROM mqtt_petengoran_stored WHERE datetime BETWEEN SYMMETRIC '${dateStart}' AND '${dateEnd} 23:59:59' ORDER BY datetime DESC`, function(err, result){
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
                    result: result.rows.reverse(),
                })
                console.log(`[REST-API Petengoran] GET ${dataColumn} DATA FROM ${dateStart} TO ${dateEnd} AS OBJECT`);
            });          
        });
    },

    //////////////////////// IMAGE ///////////////////////////
    
    async get_lastImage(req, res){
        res.status(200),
        res.sendFile('petengoran.png', {root : path.join(__dirname, '../image')})
        console.log(`[REST-API Petengoran] GET DATA IMAGE`);
    },

    //////////////////////// UNDER DEVELOPMENT ///////////////////////////

    async get_byTime_list_all(req, res){
        var data = [];
        time = req.params.time;
        timer = req.query.timer;
        //dataColumn = req.query.data;
        // dbase_rest.connect(function (err, client){
        //     if (err) throw err;
            if (timer == "second" || timer == "minute" || timer == "hour" || timer == "day"){
                dbase_rest.query(`SELECT datetime, waterlevel, voltage, temperature, forecast30, forecast300, rms, threshold, alertlevel
                FROM mqtt_petengoran WHERE datetime >= now() - Interval '${time}' ${req.query.timer} ORDER BY datetime DESC`, function(err, result){
                    if (err) {
                        console.log(err.message);
                        res.status(404);
                        res.json({msg: `Error Use time format <time>?timer=interval. Example "/1?time=day&data=waterlevel"`});
                    }
                    for (i = 0; i<result.rowCount; i++){
                        const timeGMT7 = (moment(result.rows[i].datetime).locale('id').format());
                        data.push([timeGMT7, result.rows[i].waterlevel, result.rows[i].voltage, result.rows[i].temperature, 
                            result.rows[i].forecast30, result.rows[i].forecast300, 
                            result.rows[i].rms, result.rows[i].threshold, result.rows[i].alertlevel  ])
                    }
                    res.json({
                        info:"array info = 0:datetime, 1:waterlevel, 2:voltage, 3:temperature, 4:forecast30, 5:forecast300, 6:rms, 7:threshold, 8:alertlevel",
                        count:result.rowCount,
                        result: data.reverse(),
                    })
                    console.log(`[REST-API Petengoran] GET ALL DATA FOR ${time} ${timer} AS LIST`);
                });
            }else {
                res.status(404);
                res.json({
                    message:"Invalid Timer. Use second, minute, hour, day",
                })
            };
            
        // });
    },

    async get_all_interval(req, res){
        var data = [];
        time = req.query.time; 

                // with dateRange as(
                //     SELECT min(datetime) as first_date, max(datetime) as last_date
                //     FROM mqtt_petengoran
                //     WHERE datetime >= now() - Interval '${time}'
                // )
                    
                // select datetime, waterlevel, voltage, temperature, forecast30, forecast300, rms, threshold, alertlevel from mqtt_petengoran
                // where datetime in(
                //     select generate_series(first_date, last_date, '1 minute'::interval)::timestamp as date_hour
                //     from dateRange
                // )
                // order by datetime desc
            
                var interval = 120 //seconds (2 minute)
                dbase_rest.query(`

                SELECT  
                to_timestamp(floor((extract('epoch' from datetime) / ${interval} )) * ${interval}) 
                AT TIME ZONE 'UTC' as datetime,
                COUNT(DISTINCT waterlevel),
                    ROUND(AVG(waterlevel)::numeric, 0 ) as waterlevel,
                    ROUND(AVG(voltage)::numeric, 0 ) as voltage,
                    ROUND(AVG(temperature)::numeric, 0 ) as temperature,
                    ROUND(AVG(forecast30)::numeric, 0 ) as forecast30,
                    ROUND(AVG(forecast300)::numeric, 0 ) as forecast300,
                    ROUND(AVG(rms)::numeric, 0 ) as rms,
                    ROUND(AVG(threshold)::numeric, 0 ) as threshold,
                    ROUND(AVG(alertlevel)::numeric, 0 ) as alertlevel	
                FROM mqtt_petengoran 
                where datetime >= now() - Interval '${time}'
                GROUP BY 1 
                order by 1 desc

                `, function(err, result){
                    if (err) {
                        console.log(err.message);
                        res.status(404);
                        res.json({msg: err.message});
                    }
                    for (i = 0; i<result.rowCount; i++){
                        const timeGMT7 = (moment(result.rows[i].datetime).locale('id').format());
                        data.push([timeGMT7, result.rows[i].waterlevel, result.rows[i].voltage, result.rows[i].temperature, 
                            result.rows[i].forecast30, result.rows[i].forecast300, 
                            result.rows[i].rms, result.rows[i].threshold, result.rows[i].alertlevel  ])
                    }
                    res.json({
                        info:"array info = 0:datetime, 1:waterlevel, 2:voltage, 3:temperature, 4:forecast30, 5:forecast300, 6:rms, 7:threshold, 8:alertlevel",
                        count:result.rowCount,
                        result: data.reverse(),
                    })
                    console.log(`[REST-API Petengoran] GET ALL DATA WITH TIME ${time} AND INTERVAL 1 Minute AS LIST`);
                });
    },

    async get_all_interval_date(req, res){
        var data = [];
        starts = req.query.start;
        end = req.query.end;

                // with dateRange as(
                //     SELECT min(datetime) as first_date, max(datetime) as last_date
                //     FROM mqtt_petengoran_stored
                //     WHERE datetime BETWEEN SYMMETRIC '${starts}' AND '${end} 23:59:59'
                // )
                    
                // select datetime, waterlevel, voltage, temperature, forecast30, forecast300, rms, threshold, alertlevel from mqtt_petengoran_stored
                // where datetime in(
                //     select generate_series(first_date, last_date, '1 minute'::interval)::timestamp as date_hour
                //     from dateRange
                // )
                // order by datetime desc
                
                var interval = 120 //seconds (2 minute)
                dbase_rest.query(`

                SELECT  
                to_timestamp(floor((extract('epoch' from datetime) / ${interval} )) * ${interval}) 
                AT TIME ZONE 'UTC' as datetime,
                COUNT(DISTINCT waterlevel),
                    ROUND(AVG(waterlevel)::numeric, 0 ) as waterlevel,
                    ROUND(AVG(voltage)::numeric, 0 ) as voltage,
                    ROUND(AVG(temperature)::numeric, 0 ) as temperature,
                    ROUND(AVG(forecast30)::numeric, 0 ) as forecast30,
                    ROUND(AVG(forecast300)::numeric, 0 ) as forecast300,
                    ROUND(AVG(rms)::numeric, 0 ) as rms,
                    ROUND(AVG(threshold)::numeric, 0 ) as threshold,
                    ROUND(AVG(alertlevel)::numeric, 0 ) as alertlevel	
                FROM mqtt_petengoran_stored
                where WHERE datetime BETWEEN SYMMETRIC '${starts}' AND '${end} 23:59:59'
                GROUP BY 1 
                order by 1 desc

                `, function(err, result){
                    if (err) {
                        console.log(err.message);
                        res.status(404);
                        res.json({msg: err.message});
                    }
                    for (i = 0; i<result.rowCount; i++){
                        const timeGMT7 = (moment(result.rows[i].datetime).locale('id').format());
                        data.push([timeGMT7, result.rows[i].waterlevel, result.rows[i].voltage, result.rows[i].temperature, 
                            result.rows[i].forecast30, result.rows[i].forecast300, 
                            result.rows[i].rms, result.rows[i].threshold, result.rows[i].alertlevel  ])
                    }
                    res.json({
                        info:"array info = 0:datetime, 1:waterlevel, 2:voltage, 3:temperature, 4:forecast30, 5:forecast300, 6:rms, 7:threshold, 8:alertlevel",
                        count:result.rowCount,
                        result: data.reverse(),
                    })
                    console.log(`[REST-API Petengoran] GET ALL DATA BETWEEN ${starts} AND ${end}`);
                });
    },
}