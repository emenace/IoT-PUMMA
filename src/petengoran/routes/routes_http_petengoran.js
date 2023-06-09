const router = require('express').Router();
const petengoran_http = require('../controllers/controller_http_petengoran');

//Record of data
router.get('/petengoran/latest', petengoran_http.get_100Data);// route request to respond lastest 100 data
router.get('/petengoran/count/:count', petengoran_http.get_countData); // route request to respond lastest data by count

//Record of data by request using pagination
router.get('/petengoran/pageAll/:page', petengoran_http.get_pagination); // route request to respond data using pagination by input page
router.get('/petengoran/pageCount/:count', petengoran_http.get_paginationCount); // route request to respond last requested count of data using pagination

//Record of data by time
router.get('/petengoran/time/:time', petengoran_http.get_byTime_obj); // route request to respond last day data
router.get('/petengoran/list/:time', petengoran_http.get_byTime_list);
router.get('/petengoran/all/:time', petengoran_http.get_byTime_list_all);
router.get('/petengoran/interval/', petengoran_http.get_all_interval);

//Record of data by date
router.get('/petengoran/interval', petengoran_http.get_byDate_obj);

// Send image
router.get('/petengoran/image/', petengoran_http.get_lastImage)
//router.get('/petengoran/image_test/', petengoran_http.get_lastImages)

// Data as List


module.exports = router;

