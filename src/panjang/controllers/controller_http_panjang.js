const { Pool } = require('pg');
const { off } = require('process');
const dbase_rest = new Pool({
    host:process.env.DB_HOST,
    port:process.env.DB_PORT,
    user:"user_panjang",
    password: "pwd123",
    database: process.env.DB_PANJANG
})
dbase_rest.connect();

require('dotenv').config();
require('fs');

module.exports = {

    //////////////////////// RAW DATA ///////////////////////////

    async get_100Data(req,res){
        data = await dbase_rest.query(`SELECT datetime, waterlevel, voltage, temperature, 
            forecast30, forecast300, rms, threshold, alertlevel, feedlatency 
            FROM mqtt_panjang ORDER BY datetime DESC LIMIT 100`);
        
        res.status(200);
        res.send({
            count:data.rowCount,
            result:data.rows
        })

        console.log("[REST-API Panjang] GET 100 Data");
    },

    async get_countData(req,res){
        var count = parseInt(req.params.count);
        data = await dbase_rest.query(`SELECT datetime, waterlevel, voltage, temperature, 
            forecast30, forecast300, rms, threshold, alertlevel, feedlatency 
            FROM mqtt_panjang ORDER BY datetime DESC LIMIT ${count}`);
        res.status(200);
        res.send({
            count:data.rowCount,
            result:data.rows
        })

        console.log(`[REST-API Panjang] GET ${count} Data`);
        
    },

    //////////////////////// PAGINATED  ///////////////////////////

    async get_pagination(req, res){
        var perPage = 100;
        var page = req.params.page;
        var offset = (page -  1) * perPage;
    
        countData = await dbase_rest.query(`SELECT count(*) as total FROM mqtt_panjang`);
        var totalRow = countData.rows[0].total;
        var totalPage = Math.ceil(totalRow/perPage);

        data = await dbase_rest.query(`SELECT datetime, waterlevel, voltage, temperature, 
        forecast30, forecast300, rms, threshold, alertlevel, feedlatency
        FROM mqtt_panjang LIMIT ${perPage} OFFSET ${offset}`)

        res.json({
            totalData:totalRow,
            page:page,
            totalPage:totalPage,
            result:data.rows.reverse()                    
        })
        console.log(`[REST-API Panjang] GET ALL DATA BY PAGE. PAGE ${page} OF ${totalPage}`);
    },

    async get_paginationCount(req, res){
        data = await dbase_rest.query(`SELECT datetime, waterlevel, voltage, temperature, 
        forecast30, forecast300, rms, threshold, alertlevel, feedlatency 
        FROM mqtt_panjang 
        WHERE id IN (SELECT id FROM mqtt_panjang ORDER BY datetime DESC LIMIT ${req.params.count})
        ORDER BY datetime DESC LIMIT ${req.query.limit} OFFSET ${req.query.offset}`)
        res.send({
            totalData:req.params.count,
            count:data.rowCount,
            result: data.rows.reverse()
        })
        console.log(`[REST-API Panjang] GET DATA BY PAGE. ${req.params.count} DATA WITH LIMIT ${req.query.limit} OFFSET ${req.query.offset} `);
    },

    //////////////////////// BY TIME ///////////////////////////

    async get_byTime_obj(req, res){
        time = req.params.time;
        timer = req.query.timer;
        dataColumn = req.query.data;
        if (timer == "second" || timer == "minute" || timer == "hour" || timer == "day"){
            dbase_rest.query(`SELECT datetime, ${dataColumn} as data
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
                console.log(`[REST-API Panjang] GET ${dataColumn} FOR ${time} ${timer} AS OBJECT`);
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
                    console.log(`[REST-API Panjang] GET ${dataColumn} FOR ${time} ${timer} AS LIST`);
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

    //////////////////////// BY DATE ///////////////////////////

    async get_byDate_obj(req, res){
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
                console.log(`[REST-API Panjang] GET ${dataColumn} DATA FROM ${dateStart} TO ${dateEnd} AS OBJECT`);
            });          
        });
    },

    //////////////////////// IMAGE ///////////////////////////
    
    async get_lastImage(req, res){
        res.status(200),
        res.sendfile("src/panjang/image/panjang.png")
    },
}