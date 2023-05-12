const moment = require('moment');
datetime = ('2023-04-29T14:00:54.000Z');


const date2 = new Date(datetime);

const timestamp = ((moment(datetime).locale('id').format('LLLL'))+" WIB");
console.log(timestamp);