const router = require('express').Router();
const marinaj_http = require('../controllers/controller_http_marinaj');

//Record of data
router.get('/marinaj/latest', marinaj_http.get_100Data);// route request to respond lastest 100 data
router.get('/marinaj/count/:count', marinaj_http.get_countData); // route request to respond lastest data by count

//Record of data by request using pagination
router.get('/marinaj/pageAll/:page', marinaj_http.get_pagination); // route request to respond data using pagination by input page
router.get('/marinaj/pageCount/:count', marinaj_http.get_paginationCount); // route request to respond last requested count of data using pagination

//Record of data by time
router.get('/marinaj/time/:time', marinaj_http.get_byTime_obj); // route request to respond last day data
router.get('/marinaj/list/:time', marinaj_http.get_byTime_list);
router.get('/marinaj/all/:time', marinaj_http.get_byTime_list_all);
router.get('/marinaj/interval/', marinaj_http.get_all_interval);

//Record of data by date
router.get('/marinaj/interval-date', marinaj_http.get_byDate_obj);
router.get('/marinaj/intervalDate/', marinaj_http.get_all_interval_date);

// Send image
router.get('/marinaj/image/', marinaj_http.get_lastImage)
//router.get('/marinaj/image_test/', marinaj_http.get_lastImages)

// Data as List


module.exports = router;

