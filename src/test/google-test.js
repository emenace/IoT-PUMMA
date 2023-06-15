const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');
const {auth} = require('../global_config/controllers/google_api')

const driveService = google.drive({
    version : 'v3', auth
});

const metadata = {
    'name' : 'test.png',
    'parents' : ['1EYd_pXGBKOrrlo29sU11Hlwj0CnSs4r0']
}

let media = {
    MimeType:  'image/png',
    body : fs.createReadStream('test.png')
}

async function createUpload(){

    let response = await driveService.files.create({
        resource : metadata, 
        media : media,
        fields : 'id'
    })

    switch(response.status){
        case 200 : 
            console.log('done ', response.data.id ) 
            break;
    }
}

createUpload().catch(console.error)

