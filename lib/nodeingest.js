
var csv  = require('csv-stream'),
    zlib = require('zlib')
    _    = require('underscore');

var default_url = 'https://reportingitc.apple.com/autoingestion.tft';

exports.create = function(options) {

  var request     = options.request || require ('request');
  var url         = options.url || default_url;
  var credentials = {
    username:  options.username,
    password:  options.password,
    vndnumber: options.vndnumber
  }

  return {
    fetch: function(options, callback) {

        var params = keysToUpperCase(_.extend({}, credentials, options));
		console.log(params);
        request.post(url).form(params)
          .on('error', function(error) {
            callback(error, null);
          })
          .on('response', function(response) {

            if (response.headers['errormsg']) {
              var error = new Error(response.headers['errormsg']);
              callback(error, null);
              return;
            }

            var result = [];
            var csv_options = {
              delimiter : '\t',
              endLine : '\n'
            }

            response
              .pipe(zlib.createGunzip())
              .pipe(csv.createStream(csv_options))
              .on('error', function(err){
                callback(error, null);
              })
              .on('data', function(data){
                result.push(data);
              })
              .on('end', function() {
                callback(null, result);
              });

          });
    }
  };

}

function keysToUpperCase(obj) {
  var new_obj = {};
  for (var key in obj) {
    new_obj[key.toUpperCase()] = obj[key];
  }
  return new_obj;
}
