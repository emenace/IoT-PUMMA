const router_ = require('express').Router();
const global_http = require('../controllers/http_global');

// Status Device 
router_.get('/status', global_http.deviceStatus);

module.exports = router_;

