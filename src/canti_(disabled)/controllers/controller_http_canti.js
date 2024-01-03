const dbase_rest = require('../configs/database_canti');
require('dotenv').config();

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
                    result: result.rows
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
            dbase_rest.query(`SELECT date FROM mqtt_canti WHERE date > now() - Interval '3' DAY ORDER BY date ASC, time ASC`, function(err, result){
                if (err) throw (err);
                var perPage = 100;
                var totalRow = result.rowCount ;
                var totalPage = Math.ceil(totalRow / perPage);

                res.json({
                    count:result.rowCount,
                    totalPage:totalPage,
                    message:"Data too big. please use 3 days pagination endpoint",
                    endpoint: "/canti/3days/:page"
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
            dbase_rest.query(`SELECT date FROM mqtt_canti WHERE date > now() - Interval '7' DAY ORDER BY date ASC, time ASC`, function(err, result){
                if (err) throw (err);
                var perPage = 100;
                var totalRow = result.rowCount ;
                var totalPage = Math.ceil(totalRow / perPage);

                res.json({
                    count:result.rowCount,
                    totalPage:totalPage,
                    message:"Data too big. please use 7 days pagination endpoint",
                    endpoint: "/canti/7days/:page"
                })
                console.log("Data has been send");
                done();
            });
        });
    },

    cantiPagination(req, res){
        var perPage = 100;
        var page = req.params.page;
        var offset = (page -  1) * perPage;
    
        dbase_rest.connect(function (err, client, done){
        dbase_rest.query(`SELECT count(*) as total FROM mqtt_canti`, function(err, result){
            if (err) throw err;
            var totalRow = result.rows[0].total;
            var totalPage = Math.ceil(totalRow / perPage);            
            dbase_rest.query(`SELECT * from mqtt_canti LIMIT ${perPage} OFFSET ${offset}`, function(err, result){
                if (err) throw err;
                res.json({
                    totalData:totalRow,
                    page:page,
                    totalPage:totalPage,
                    result:result.rows                    
                })
                console.log("Data has been send");
                done();
            });
        });
        });
   },

    getDayCanti7page(req, res){
        dbase_rest.connect(function (err, client, done){
            if (err) throw err;
            dbase_rest.query(`SELECT date FROM mqtt_canti WHERE date > now() - Interval '7' DAY ORDER BY date ASC, time ASC`, function(err, result){
                if (err) throw (err);

                var perPage = 100;
                var page = req.params.page;
                var offset = (page -  1) * perPage;
                var totalRow = result.rowCount;
                var totalPage = Math.ceil(totalRow / perPage);
                var counts = result.rowCount;

                dbase_rest.query(`SELECT *  FROM mqtt_canti WHERE date > now() - Interval '7' DAY ORDER BY date ASC, time ASC LIMIT ${perPage} OFFSET ${offset}`, function(err, result){
                    res.json({
                        count:counts,
                        totalPage:totalPage,
                        page:page,
                        result:result.rows
                    })
                });
                console.log("Data has been send");
                done();
            });
        });
    },

    getDayCanti3page(req, res){
        dbase_rest.connect(function (err, client, done){
            if (err) throw err;
            dbase_rest.query(`SELECT date FROM mqtt_canti WHERE date > now() - Interval '3' DAY ORDER BY date ASC, time ASC`, function(err, result){
                if (err) throw (err);

                var perPage = 100;
                var page = req.params.page;
                var offset = (page -  1) * perPage;
                var totalRow = result.rowCount;
                var totalPage = Math.ceil(totalRow / perPage);
                var counts = result.rowCount;

                dbase_rest.query(`SELECT *  FROM mqtt_canti WHERE date > now() - Interval '3' DAY ORDER BY date ASC, time ASC LIMIT ${perPage} OFFSET ${offset}`, function(err, result){
                    res.json({
                        count:counts,
                        totalPage:totalPage,
                        page:page,
                        result:result.rows
                    })
                });
                console.log("Data has been send");
                done();
            });
        });
    },
}