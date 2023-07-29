const moment = require('moment');

times = moment(new Date()).locale('id').format('h:mm:ss.SSS');

console.log(times);
