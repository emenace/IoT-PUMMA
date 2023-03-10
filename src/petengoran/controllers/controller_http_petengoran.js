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
            dbase_rest.query("SELECT * FROM mqtt_petengoran ORDER BY datetime ASC LIMIT 100", function(err, result){
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
    getDataPetengoranByID(req,res){
        let count = parseInt(req.params.count);
        dbase_rest.connect(function (err, client, done){
            if (err) throw err;
            dbase_rest.query(`SELECT * FROM mqtt_petengoran ORDER BY datetime ASC LIMIT ${count}`, function(err, result){
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
    getDayPetengoran1(req, res){
        dbase_rest.connect(function (err, client, done){
            if (err) throw err;
            dbase_rest.query(`SELECT * FROM mqtt_petengoran WHERE date > now() - Interval '1' DAY ORDER BY datetime ASC`, function(err, result){
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
    getDayPetengoran3(req, res){
        dbase_rest.connect(function (err, client, done){
            if (err) throw err;
            dbase_rest.query(`SELECT date FROM mqtt_petengoran WHERE date > now() - Interval '3' DAY ORDER BY datetime ASC`, function(err, result){
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
            dbase_rest.query(`SELECT date FROM mqtt_petengoran WHERE date > now() - Interval '7' DAY ORDER BY datetime ASC`, function(err, result){
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
                    result:result.rows                    
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
            dbase_rest.query(`SELECT date FROM mqtt_petengoran WHERE date > now() - Interval '7' DAY ORDER BY datetime ASC`, function(err, result){
                if (err) throw (err);

                var perPage = 100;
                var page = req.params.page;
                var offset = (page -  1) * perPage;
                var totalRow = result.rowCount;
                var totalPage = Math.ceil(totalRow / perPage);
                var counts = result.rowCount;

                dbase_rest.query(`SELECT *  FROM mqtt_petengoran WHERE date > now() - Interval '7' DAY ORDER BY datetime ASC LIMIT ${perPage} OFFSET ${offset}`, function(err, result){
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

    getDayPetengoran3page(req, res){
        dbase_rest.connect(function (err, client, done){
            if (err) throw err;
            dbase_rest.query(`SELECT date FROM mqtt_petengoran WHERE date > now() - Interval '3' DAY ORDER BY datetime ASC`, function(err, result){
                if (err) throw (err);

                var perPage = 100;
                var page = req.params.page;
                var offset = (page -  1) * perPage;
                var totalRow = result.rowCount;
                var totalPage = Math.ceil(totalRow / perPage);
                var counts = result.rowCount;

                dbase_rest.query(`SELECT *  FROM mqtt_petengoran WHERE date > now() - Interval '3' DAY ORDER BY datetime ASC LIMIT ${perPage} OFFSET ${offset}`, function(err, result){
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

    latestPagedData(req, res){
        dbase_rest.connect(function (err, client, done){
            if (err) throw err;
            dbase_rest.query(`Select * from mqtt_petengoran 
            where id in (select id from mqtt_petengoran order by datetime desc limit ${req.params.count})
            order by datetime desc limit ${req.query.limit} offset ${req.query.offset}`, function(err, result){
                console.log(req.params.count);
                console.log(req.query.limit);
                console.log(req.query.offset);
                if (err) throw (err);
                res.send({
                    totalData:req.params.count,
                    count:result.rowCount,
                    result: result.rows
                })
                console.log("Data has been send");
                done();
            });
        });
    },
}