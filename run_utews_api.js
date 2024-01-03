"use strict";
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const http = require('http');
const https = require('https');
require('dotenv').config()

const privateKey = fs.readFileSync('/etc/letsencrypt/live/vps.isi-net.org/privkey.pem','utf8');
const certificate = fs.readFileSync('/etc/letsencrypt/live/vps.isi-net.org/cert.pem','utf8');
const ca = fs.readFileSync('/etc/letsencrypt/live/vps.isi-net.org/chain.pem','utf8');

const credentials = {
	key: privateKey,
	cert: certificate,
  ca: ca
};

const api = express();

api.use(bodyParser.urlencoded({ extended: false }))
api.use(bodyParser.json())
api.use(cors({
    origin:['http://localhost/3000','*','http://pumma.isi-net.org/api','http://pumma.isi-net.org','localhost','/'] 
}));     

// API HANLDING FOR GLOBAL
const global_appRoute = require('./src/global_config/API/route_global');
api.use('/', cors(), global_appRoute);

// API HANLDING FOR MARINAJ
const marinaj_appRoute = require('./src/marinaj/routes/routes_http_marinaj');
api.use('/', cors(), marinaj_appRoute);

api.use('/', cors(), (req, res) => {
    res.status(404);
    res.send('404 Not Found'); // respond 404 if not available
});    

// Starting both http & https servers
const httpServer = http.createServer(api);
const httpsServer = https.createServer(credentials, api);

httpServer.listen(process.env.API_PORT, () => {
	console.log(`HTTP REST-API running on port ${process.env.API_PORT}`);
});

httpsServer.listen(4443, () => {
	console.log('HTTPS REST-API running on port 4443');
});