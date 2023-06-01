const routers = require('express').Router();
const panjang_http = require('../controllers/controller_http_panjang');

//Record of data
routers.get('/panjang/latest', panjang_http.get_100Data);// route request to respond lastest 100 data
routers.get('/panjang/count/:count', panjang_http.get_countData); // route request to respond lastest data by count

//Record of data by request using pagination
routers.get('/panjang/pageAll/:page', panjang_http.get_pagination); // route request to respond data using pagination by input page
routers.get('/panjang/pageCount/:count', panjang_http.get_paginationCount); // route request to respond last requested count of data using pagination

//Record of data by time
routers.get('/panjang/time/:time', panjang_http.get_byTime_obj); // route request to respond last day data
routers.get('/panjang/list/:time', panjang_http.get_byTime_list);
routers.get('/panjang/all/:time', panjang_http.get_byTime_list_all);

//Record of data by date
routers.get('/panjang/interval', panjang_http.get_byDate_obj);

// Send image
routers.get('/panjang/image/', panjang_http.get_lastImage);
//routers.get('/panjang/image_test/', panjang_http.get_lastImages);

// Data as List


module.exports = routers;

