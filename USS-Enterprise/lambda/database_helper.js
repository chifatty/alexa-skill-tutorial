"use strict";

module.change_code = 1;

var METADATA_TABLE_NAME = "USS_Enterprise";
var dynasty = require("dynasty")({region: 'ap-northeast-1'});

function DatabaseHelper() {
}

var enterpriseTable = function() {
  return dynasty.table(METADATA_TABLE_NAME);
};

DatabaseHelper.prototype.storeMetaData = function(deviceId, metaData) {
  console.log("writing metadata to database for deivce " + deviceId);
  return enterpriseTable().insert({
    device_id: deviceId,
    data: JSON.stringify(metaData)
  }).catch(function(error) {
    console.log(error);
  });
};

DatabaseHelper.prototype.updateMetaData = function(deviceId, metaData) {
    console.log("writing metadata to database for deivce " + deviceId);
    return enterpriseTable().update(deviceId, {
      data: JSON.stringify(metaData)
    }).catch(function(error) {
      console.log(error);
    });
  };

DatabaseHelper.prototype.readMetaData = function(deviceId) {
  console.log("reading metaData with device id of : " + deviceId);
  return enterpriseTable().find(deviceId)
    .then(function(result) {
      var data = (result === undefined ? {} : JSON.parse(result["data"]));
      return data;
    }).catch(function(error) {
    console.log(error);
  });
};

DatabaseHelper.prototype.findLightsAtLocation = function(location) {
  console.log("finding lights in " + location);
  return enterpriseTable().scan()
    .then(function(results) {
      var lights = []
      console.log(results);
      for (var i = 0; i < results.length; i++) {
        var deviceId = results[i].device_id;
        var metaData = JSON.parse(results[i]["data"]);
        if (metaData.type == 'light' && metaData.location == location) {
          lights.push(deviceId);
        }
      }
      return lights;
    }).catch(function(error) {
    console.log(error);
  });
};

module.exports = DatabaseHelper;