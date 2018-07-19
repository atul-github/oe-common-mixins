/**
 *
 * ©2018-2019 EdgeVerve Systems Limited (a fully owned Infosys subsidiary),
 * Bangalore, India. All Rights Reserved.
 *
 */

// Author : Atul
const loopback = require('loopback');
const DataSource = loopback.DataSource;
const DataAccessObject = DataSource.DataAccessObject;
const utils = require('./utils');


module.exports = function (app) {
  var _removeById = DataAccessObject.removeById;
  DataAccessObject.removeById =
    DataAccessObject.destroyById =
    DataAccessObject.deleteById =
    DataAccessObject.deleteById =
  DataAccessObject.deleteWithVersion = function (id, version, options, cb) {
    var self = this;
    if (!cb && typeof options === 'function') {
      cb = options;
      options = {};
    }
    utils.checkIfVersionMatched(self, id, version, function (err, realId) {
      if (err) {
        return cb(err);
      }
      if (realId) {
        id = realId;
      }
      return _removeById.call(self, id, options, cb);
    });
  };
};


