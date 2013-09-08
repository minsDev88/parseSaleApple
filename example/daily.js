var options = {
  username: 'khj873@uangel.com',
  password: 'Uangel2012',
  vndnumber: '80081919'
}

var ingest = require('../lib/nodeingest').create(options);

var tmpDate = new Date();
var yesterDay = new Date(new Date( tmpDate.getFullYear() + '-' + (tmpDate.getMonth() + 1 ) + '-' + ( tmpDate.getDate() ) + ' 00:00:00') - 1 - 1000*60*60*24);
var yesterDayStr = yesterDay.getFullYear();
yesterDayStr += '' + ( ( yesterDay.getMonth() + 1 < 10 ) ? '0' : '' ) + (yesterDay.getMonth() + 1);
yesterDayStr += '' + yesterDay.getDate();

console.log(yesterDayStr);

var fetch_options = {
  typeofreport: 'Sales',
  datetype: 'Daily',
  reporttype: 'Summary',
  reportdate: yesterDayStr
};

ingest.fetch(fetch_options, function(error, report) {
  if (error) {
    console.log(error);
  } else {
    console.log(report);
  }
});
