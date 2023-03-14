const router = require('express').Router();
const petengoran_http = require('../controllers/controller_http_petengoran');

router.get('/petengoran/latest', petengoran_http.getDataPetengoran);// route request to respond lastest 100 data
router.get('/petengoran/count/:count', petengoran_http.getDataPetengoranByID); // route request to respond lastest data by count
router.get('/petengoran/day', petengoran_http.getDayPetengoran1); // route request to respond last day data
router.get('/petengoran/3days', petengoran_http.getDayPetengoran3); // route request to respond last 3 day data
router.get('/petengoran/7days', petengoran_http.getDayPetengoran7); // route request to respond last 7 day data

router.get('/petengoran/page/:page', petengoran_http.petengoranPagination); // route request to respond data using pagination
router.get('/petengoran/7days/:page', petengoran_http.getDayPetengoran7page); // route request to respond 7 days data using pagination
router.get('/petengoran/3days/:page', petengoran_http.getDayPetengoran3page ); // route request to respond 3 days data using pagination

router.get('/petengoran/latestPaged/:count', petengoran_http.latestPagedData); // route request to respond 3 days data using pagination

module.exports = router;

