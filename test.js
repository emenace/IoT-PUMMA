// Dependencies
const fs = require('fs');
const http = require('http');
const https = require('https');
const express = require('express');

const app = express();

// Certificate
const privateKey = fs.readFileSync('/etc/letsencrypt/live/vps.isi-net.org/privkey.pem', 'utf8');
const certificate = fs.readFileSync('/etc/letsencrypt/live/vps.isi-net.org/cert.pem', 'utf8');
const ca = fs.readFileSync('/etc/letsencrypt/live/vps.isi-net.org/chain.pem', 'utf8');

const credentials = {
    key: privateKey,
    cert: certificate,
    ca: ca
};

app.use((req, res) => {
    res.send('Hello there !');
});

// Starting both http & https servers
const httpServer = http.createServer(app);
const httpsServer = https.createServer(credentials, app);

httpServer.listen(8082, () => {
    console.log('HTTP Server running on port 80');
});

httpsServer.listen(4443, () => {
    console.log('HTTPS Server running on port 443');
});