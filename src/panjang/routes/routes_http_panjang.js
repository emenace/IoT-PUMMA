const routers = require('express').Router();
const panjang_http = require('../controllers/controller_http_panjang');

routers.get('/panjang/latest', panjang_http.getDataPanjang);// route request to respond lastest 100 data
routers.get('/panjang/count/:count', panjang_http.getDataPanjangByID); // route request to respond lastest data by count
routers.get('/panjang/day', panjang_http.getDayPanjang1); // route request to respond last day data
routers.get('/panjang/3days', panjang_http.getDayPanjang3); // route request to respond last 3 day data
routers.get('/panjang/7days', panjang_http.getDayPanjang7); // route request to respond last 7 day data

routers.get('/panjang/page/:page', panjang_http.panjangPagination); // route request to respond data using pagination
routers.get('/panjang/7days/:page', panjang_http.getDayPanjang7page); // route request to respond 7 days data using pagination
routers.get('/panjang/3days/:page', panjang_http.getDayPanjang3page ); // route request to respond 3 days data using pagination

routers.get('/panjang/latestPaged/:count', panjang_http.latestPagedData); // route request to respond 3 days data using pagination

module.exports = routers;

