const router = require('express').Router();
const canti_http = require('../controllers/controller_http_canti');

router.get('/getDataCanti', canti_http.getDataCanti);
router.get('/dataCanti/:count', canti_http.getDataCantiByID);
router.get('/dayCanti', canti_http.getDayCanti1);
router.get('/3dayCanti', canti_http.getDayCanti3);
router.get('/7dayCanti', canti_http.getDayCanti7);

module.exports = router;

