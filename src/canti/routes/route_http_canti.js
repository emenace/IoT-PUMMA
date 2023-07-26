const routers = require('express').Router();
const canti_http = require('../controllers/controller_http_canti');

//Record of data
routers.get('/canti/latest', canti_http.get_100Data);// route request to respond lastest 100 data
routers.get('/canti/count/:count', canti_http.get_countData); // route request to respond lastest data by count

//Record of data by request using pagination
routers.get('/canti/pageAll/:page', canti_http.get_pagination); // route request to respond data using pagination by input page
routers.get('/canti/pageCount/:count', canti_http.get_paginationCount); // route request to respond last requested count of data using pagination

//Record of data by time
routers.get('/canti/time/:time', canti_http.get_byTime_obj); // route request to respond last day data
routers.get('/canti/list/:time', canti_http.get_byTime_list);
routers.get('/canti/all/:time', canti_http.get_byTime_list_all);
routers.get('/canti/interval/', canti_http.get_all_interval);

//Record of data by date
routers.get('/canti/interval-date', canti_http.get_byDate_obj);
routers.get('/canti/intervalDate/', canti_http.get_all_interval_date);

// Send image
routers.get('/canti/image/', canti_http.get_lastImage);
//routers.get('/canti/image_test/', canti_http.get_lastImages);

// Data as List


module.exports = routers;

