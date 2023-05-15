const dbase = require('../petengoran/configs/database_petengoran');
require('dotenv').config()

async function main(){
    data = await dbase.query("select * from mqtt_petengoran limit 1");
    if (data.rowcount>0){
        console.log("Data available");
        console.log(data.rows);
    } else {
        console.log("Data NOT available");
    }
    
}
main()