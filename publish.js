var zipFolder = require('zip-folder');
var path = require('path');
var fs = require('fs');
var request = require('request');

var rootFolder = path.resolve('.');
var zipPath = path.resolve(rootFolder, '../testm-bfcc.zip');
var kuduApi = 'https://testm-bfcc.scm.azurewebsites.net/api/zip/site/wwwroot';
var userName = '$testm-bfcc';
var password = 'kELpo5wj5ZbfyhWap0iBCcbNeTl6AXyf7EDeoc1LgQ9a1mvjwjx5eYNsK5Cw';

function uploadZip(callback) {
  fs.createReadStream(zipPath).pipe(request.put(kuduApi, {
    auth: {
      username: userName,
      password: password,
      sendImmediately: true
    },
    headers: {
      "Content-Type": "applicaton/zip"
    }
  }))
  .on('response', function(resp){
    if (resp.statusCode >= 200 && resp.statusCode < 300) {
      fs.unlink(zipPath);
      callback(null);
    } else if (resp.statusCode >= 400) {
      callback(resp);
    }
  })
  .on('error', function(err) {
    callback(err)
  });
}

function publish(callback) {
  zipFolder(rootFolder, zipPath, function(err) {
    if (!err) {
      uploadZip(callback);
    } else {
      callback(err);
    }
  })
}

publish(function(err) {
  if (!err) {
    console.log('testm-bfcc publish');
  } else {
    console.error('failed to publish testm-bfcc', err);
  }
});