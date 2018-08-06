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
const oeutils = require('oe-cloud/lib/common/util.js');
const uuidv4 = require('uuid/v4');
const g = require('strong-globalize')();
const utils = require('./utils');

module.exports = function (app) {
  var _setup = DataSource.prototype.setup;
  var _updateAttributes = {};
  var _replaceById = {};
  var _upsert = {};
  var _generateContextData = {};
  var _destroyAll = {};

  function isMixinEnabled(model, mixin) {
    var Model;

    if (typeof model === 'string') {
      Model = loopback.findModel(model);
    } else {
      Model = model;
    }
    if (!Model.settings || !Model.settings.mixins) {
      return false;
    }
    var flag = Model.settings.mixins[mixin];
    if (!flag) {
      return false;
    }
    if (flag) {
      if (Model.settings.overridingMixins && !Model.settings.overridingMixins[mixin]) {
        return false;
      }
    }
    return flag;
  }

  function updateWithWhere(self, model, where, data, options, cb, throwError, caller) {
    self.update(model, where, data, options, function (err, results) {
      if (err) {
        return cb(err);
      }
      var id = oeutils.isInstanceQuery(model, where);
      if (id && typeof results === 'object' && results.count === 0 && throwError === true) {
        if (id) {
          var error = new Error(g.f('No instance with {{id}} %s found for %s', id, model));
          error.code = 'NOT_FOUND';
          error.statusCode = 404;
          return cb(error);
        }
      } else if (id && caller !== 'destroy') {
        return cb(err, data);
      }
      return cb(err, results);
    });
  }

  function convertDestroyToUpdate(fn, model, where, options, cb) {
    if (!isMixinEnabled(model, 'SoftDeleteMixin')) {
      return fn.call(this, model, where, options, cb);
    }
    var data = { _isDeleted: true };
    if (isMixinEnabled(model, 'VersionMixin')) {
      data._version = uuidv4();
    }
    return updateWithWhere(this, model, where, data, options, cb, data._version ? true : false, 'destroy');
  }

  function callWithVersion(fn, model, id, data, options, cb) {
    var Model = loopback.findModel(model);
    if (!isMixinEnabled(model, 'VersionMixin')) {
      return fn.call(this, model, id, data, options, cb);
    }
    var where = {and: []};

    var idField = oeutils.idName(Model);
    var o = {};
    o[idField] = id;
    where.and.push(o, {_version: data._version});
    data._version = data._newVersion || uuidv4();
    return updateWithWhere(this, model, where, data, options, cb, true, 'update');
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

      if (this.name && !_destroyAll[this.name]) {
        _destroyAll[this.name] = connector.destroyAll;
        connector.destroyAll = function (model, where, options, cb) {
          var fn = _destroyAll[this.dataSource.name];
          convertDestroyToUpdate.call(this, fn, model, where, options, cb);
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
          if (isMixinEnabled(context.Model, 'VersionMixin')) {
            context.data = dbResponse;
          }
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
    if (!isMixinEnabled(this, 'VersionMixin')) {
      return _removeById.apply(this, [].slice.call(arguments));
    }
    var Model = this;

    utils.checkIfVersionMatched(Model, id, version, function (err, instance) {
      if (err) {
        return cb(err);
      }
      var idField = oeutils.idName(Model);
      var id = instance[idField];
      var where = { and: [] };
      var o = {};
      o[idField] = id;
      where.and.push(o, { _version: version });
      return Model.destroyAll(where, options, cb);
    });
    return;


    // var numId = false;
    // if (typeof id === 'string') {
    //  if (!isNaN(id)) {
    //    numId = parseInt(id, 10);
    //  }
    // }
    // var idField = oeutils.idName(Model);
    // var where = {};
    // var idFieldClause = {};
    // idFieldClause[idField] = id;

    // if (numId) {
    //  var temp = {};
    //  temp[idField] = numId;
    //  idFieldClause = { or: [temp, idFieldClause] };
    // }
    // where = { where: { and: [idFieldClause, { _version: version }] } };

    // return Model.destroyAll(where, options, cb);
  };
};


