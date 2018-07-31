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
const uuidv4 = require('uuid/v4');


module.exports = function (app) {
  var _setup = DataSource.prototype.setup;
  var _updateAttributes = {};
  var _replaceById = {};
  var _upsert = {};
  var _generateContextData = {};

  function callWithVersion(fn, model, id, data, options, cb) {
    var Model = loopback.findModel(model);
    var flag = Model.settings.mixins.VersionMixin;
    if (flag) {
      if (Model.settings.overridingMixins && !Model.settings.overridingMixins.VersionMixin) {
        flag = false;
      }
    }
    if (flag) {
      var where = {and: []};

      var idField = oeutils.idName(Model);
      var o = {};
      o[idField] = id;
      where.and.push(o, {_version: data._version});
      data._version = data._newVersion || uuidv4();
      this.update(model, where, data, options, function (err, results) {
        if (err) {
          return cb(err);
        }
        if (typeof results === 'object' && results.count === 0) {
          var error = new Error();
          Object.assign(error, { name: 'Data Error', message: 'No record was updated due to invalid version. id ' + id + ' for model ' + model, code: 'DATA_ERROR_071', type: 'DataModifiedError', retriable: false, status: 423 });
          return cb(error);
        }
        return cb(err, data);
      });
    } else {
      fn.call(this, model, id, data, options, cb);
    }
  }

  DataSource.prototype.setup = function (name) {
    this.on('connected', () => {
      var connector = this.connector;
      if (this.name && !_updateAttributes[this.name]) {
        _updateAttributes[this.name] = connector.updateAttributes;
        connector.updateAttributes = function (model, id, data, options, cb) {
          var fn = _updateAttributes[this.dataSource.name];
          callWithVersion.call(this, fn, model, id, data, options, cb);
        };
      }

      if (this.name && !_replaceById[this.name]) {
        _replaceById[this.name] = connector.replaceById;
        connector.replaceById = function (model, id, data, options, cb) {
          var fn = _replaceById[this.dataSource.name];
          callWithVersion.call(this, fn, model, id, data, options, cb);
        };
      }

      if (this.name && !_generateContextData[this.name]) {
        _generateContextData[this.name] = connector.generateContextData = function (context, dbResponse) {
          context.data = dbResponse;
          return context;
        };
      }

      if (this.name && !_upsert[this.name]) {
        _upsert[this.name] = connector.updateOrCreate;
        connector.updateOrCreate = function (model, data, options, cb) {
          var fn = _upsert[this.dataSource.name];
          callWithVersion.call(this, fn, model, data.id, data, options, cb);
        };
      }
    });
    if (_setup) {
      _setup.apply(this, [].slice.call(arguments));
    }
    return;
  };


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


