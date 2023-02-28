const router = require('express').Router();
const canti_http = require('../controllers/controller_http_canti');

router.get('/getDataCanti', canti_http.getDataCanti);// route request to respond lastest 100 data
router.get('/dataCanti/:count', canti_http.getDataCantiByID); // route request to respond lastest data by count
router.get('/dayCanti', canti_http.getDayCanti1); // route request to respond last day data
router.get('/3dayCanti', canti_http.getDayCanti3); // route request to respond last 3 day data
router.get('/7dayCanti', canti_http.getDayCanti7); // route request to respond last 7 day data

module.exports = router;

