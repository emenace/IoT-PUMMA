const moment = require('moment-timezone');

date = "2023-03-13";
time = "22:38:19";

dateTime = date + "T" +time;
console.log(dateTime);

momentDate = moment(dateTime).format('MMMM Do YYYY, h:mm:ss a');
console.log(momentDate);

parseDate = Date.parse(dateTime);
console.log(parseDate);