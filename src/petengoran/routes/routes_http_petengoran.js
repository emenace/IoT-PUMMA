const router = require('express').Router();
const petengoran_http = require('../controllers/controller_http_petengoran');

// Record of data
router.get('/petengoran/latest', petengoran_http.getDataPetengoran);// route request to respond lastest 100 data
router.get('/petengoran/count/:count', petengoran_http.getDataPetengoranByID); // route request to respond lastest data by count

//Record of data by request using pagination
router.get('/petengoran/page/:page', petengoran_http.petengoranPagination); // route request to respond data using pagination
router.get('/petengoran/latestPaged/:count', petengoran_http.latestPagedData); // route request to respond 3 days data using pagination

//Record of data by time
router.get('/petengoran/time/:time', petengoran_http.dataByHour); // route request to respond last day data
router.get('/petengoran/interval', petengoran_http.dataByInterval);

// Send image
router.get('/petengoran/image/', petengoran_http.sendImage)

// Status Device
router.get('/petengoran/status', petengoran_http.deviceStatus);

// Data as List
router.get('/petengoran/list/:time', petengoran_http.list);

module.exports = router;

