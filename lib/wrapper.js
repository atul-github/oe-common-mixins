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
const oeutils = require('oe-cloud/lib/common/util.js');


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
    utils.checkIfVersionMatched(self, id, version, function (err, instance) {
      if (err) {
        return cb(err);
      }
      var idField = oeutils.idName(self);
      var id = instance[idField];

      if (self.settings.mixins.SoftDeleteMixin) {
        instance.updateAttributes({ _isDeleted: true }, options, function (err, result) {
          if (err) {
            return cb(err);
          }
          if (!err && !result) {
            return cb(undefined, { count: 0 });
          }
          return cb(undefined, { count: 1 });
        });
      } else {return _removeById.call(self, id, options, cb);}
    });
  };
};


