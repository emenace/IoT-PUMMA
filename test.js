const os = require('os-utils');

os.cpuUsage(function(cpu){
    console.log( 'CPU Usage : ' + cpu.toFixed(2) +' %' );
});
console.log( 'MEM Usage : ' + (100 - ((os.freememPercentage()).toFixed(3) * 100)) + " %" );