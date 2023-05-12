date1 = "2023-03-28"
date2 = "2023-03-27"

console.log(Date.parse(date1));
console.log(Date.parse(date2));

const fs = require('fs')
const length = fs.readdirSync('src/panjang/image/').length
console.log(length);

let ts = new Date(Date.now());

let date_time = new Date(ts);
let date = date_time.getDate();
let month = date_time.getMonth();
let year = date_time.getFullYear();
let time = date_time.getTime();

// prints date & time in YYYY-MM-DD format
console.log(year + "-" + month + "-" + date+"-" + time);

var datetimes = (ts.getDate() +"-"+ (ts.getMonth()+1) +"-"+ ts.getFullYear() + "_" + ts.getHours() +":"+ ts.getMinutes() +":"+ ts.getSeconds());
console.log(datetimes);

