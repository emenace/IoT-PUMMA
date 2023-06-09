const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');
const { testing } = require('googleapis/build/src/apis/testing');

const KEYPATH = (__dirname + '/user.json');
const SCOPES = ['https://www.googleapis.com/auth/drive'];

const auth = new google.auth.GoogleAuth({
    keyFile : KEYPATH,
    scopes : SCOPES
});

module.exports = {auth};