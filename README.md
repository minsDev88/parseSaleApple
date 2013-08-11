# nodeautoingest

## Getting started

```javascript
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
```

For a detalied explanation of the returned report, see [iTunes Connect Sales and Trends Guide][reporting-instructions].

For more examples, look into the "examples" folder.

## License

Copyright (c) 2013 Joakim Lodén  
Licensed under the MIT license.

[reporting-instructions]: http://www.apple.com/itunesnews/docs/AppStoreReportingInstructions.pdf "iTunes Connect Sales and Trends Guide"