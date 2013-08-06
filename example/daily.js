var options = {
  username: '# username #',
  password: '# password #',
  vndnumber: '# vnd number #'
}

var ingest = require('../lib/nodeingest').create(options);

var fetch_options = {
  typeofreport: 'Sales',
  datetype: 'Daily',
  reporttype: 'Summary',
  reportdate: '20130804'
};

ingest.fetch(fetch_options, function(error, report) {
  if (error) {
    console.log(error);
  } else {
    console.log(report);
  }
});