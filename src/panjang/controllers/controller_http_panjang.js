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
            dbase_rest.query("SELECT * FROM mqtt_panjang ORDER BY date DESC, time DESC LIMIT 100", function(err, result){
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
    getDataPanjangByID(req,res){
        let count = parseInt(req.params.count);
        dbase_rest.connect(function (err, client, done){
            if (err) throw err;
            dbase_rest.query(`SELECT * FROM mqtt_panjang ORDER BY date DESC, time DESC LIMIT ${count}`, function(err, result){
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
    getDayPanjang1(req, res){
        dbase_rest.connect(function (err, client, done){
            if (err) throw err;
            dbase_rest.query(`SELECT * FROM mqtt_panjang WHERE date > now() - Interval '1' DAY ORDER BY date DESC, time DESC`, function(err, result){
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
    getDayPanjang3(req, res){
        dbase_rest.connect(function (err, client, done){
            if (err) throw err;
            dbase_rest.query(`SELECT date FROM mqtt_panjang WHERE date > now() - Interval '3' DAY ORDER BY date DESC, time DESC`, function(err, result){
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

                console.log("Data has been send");
                done();
            });
        });
    },
    
    // Respond request to give last 7 day data
    getDayPanjang7(req, res){
        dbase_rest.connect(function (err, client, done){
            if (err) throw err;
            dbase_rest.query(`SELECT date FROM mqtt_panjang WHERE date > now() - Interval '7' DAY ORDER BY date DESC, time DESC`, function(err, result){
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
                console.log("Data has been send");
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
                console.log("Data has been send");
                done();
            });
        });
        });
   },

    getDayPanjang7page(req, res){
        dbase_rest.connect(function (err, client, done){
            if (err) throw err;
            dbase_rest.query(`SELECT date FROM mqtt_panjang WHERE date > now() - Interval '7' DAY ORDER BY date DESC, time DESC`, function(err, result){
                if (err) throw (err);

                var perPage = 100;
                var page = req.params.page;
                var offset = (page -  1) * perPage;
                var totalRow = result.rowCount;
                var totalPage = Math.ceil(totalRow / perPage);
                var counts = result.rowCount;

                dbase_rest.query(`SELECT *  FROM mqtt_panjang WHERE date > now() - Interval '7' DAY ORDER BY ORDER BY date DESC, time DESC LIMIT ${perPage} OFFSET ${offset}`, function(err, result){
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

    getDayPanjang3page(req, res){
        dbase_rest.connect(function (err, client, done){
            if (err) throw err;
            dbase_rest.query(`SELECT date FROM mqtt_panjang WHERE date > now() - Interval '3' DAY ORDER BY date DESC, time DESC`, function(err, result){
                if (err) throw (err);

                var perPage = 100;
                var page = req.params.page;
                var offset = (page -  1) * perPage;
                var totalRow = result.rowCount;
                var totalPage = Math.ceil(totalRow / perPage);
                var counts = result.rowCount;

                dbase_rest.query(`SELECT *  FROM mqtt_panjang WHERE date > now() - Interval '3' DAY ORDER BY date DESC, time DESC LIMIT ${perPage} OFFSET ${offset}`, function(err, result){
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
            dbase_rest.query(`Select * from mqtt_panjang 
            where id in (select id from mqtt_panjang order by date DESC, time DESC limit ${req.params.count})
            order by date DESC, time DESC limit ${req.query.limit} offset ${req.query.offset}`, function(err, result){
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

    receiveCA(req, res){
        dbase_rest.connect(function (err, client, done){
            if (err) throw err;
            res.sendFile('../../../cert/ca.crt', {root : __dirname})
        });
    },
}