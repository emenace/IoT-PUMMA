const router = require('express').Router();
const canti_http = require('../controllers/controller_http_canti');

router.get('/getDataCanti', canti_http.getDataCanti);// route request to respond lastest 100 data
router.get('/dataCanti/:count', canti_http.getDataCantiByID); // route request to respond lastest data by count
router.get('/dayCanti', canti_http.getDayCanti1); // route request to respond last day data
router.get('/3dayCanti', canti_http.getDayCanti3); // route request to respond last 3 day data
router.get('/7dayCanti', canti_http.getDayCanti7); // route request to respond last 7 day data


router.get('/canti/latest', canti_http.getDataCanti);// route request to respond lastest 100 data
router.get('/canti/count/:count', canti_http.getDataCantiByID); // route request to respond lastest data by count
router.get('/canti/day', canti_http.getDayCanti1); // route request to respond last day data
router.get('/canti/3days', canti_http.getDayCanti3); // route request to respond last 3 day data
router.get('/canti/7days', canti_http.getDayCanti7); // route request to respond last 7 day data

router.get('/canti/page/:page', canti_http.cantiPagination); // route request to respond data using pagination
router.get('/canti/7days/:page', canti_http.getDayCanti7page); // route request to respond 7 days data using pagination
router.get('/canti/3days/:page', canti_http.getDayCanti3page); // route request to respond 3 days data using pagination

module.exports = router;

