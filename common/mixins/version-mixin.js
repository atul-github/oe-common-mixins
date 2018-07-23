/**
 *
 * ©2016-2017 EdgeVerve Systems Limited (a fully owned Infosys subsidiary),
 * Bangalore, India. All Rights Reserved.
 *
 */
/**
 * This mixin is to support version control of a record/instance it adds a new
 * property called _version and auto populate it with uuidv4() which is a
 * unique number, new version for a record is generated, when a new instance is
 * created or updated.<br><br>
 * It also changes signaure of deleteById Remote call to include version id
 *
 * @mixin EV Version Mixin
 * @author Sivankar Jain/Atul Pandit
 */

const uuidv4 = require('uuid/v4');
const oecloudutil = require('oe-cloud/lib/common/util');
const utils = require('../../lib/utils');

module.exports = function VersionMixin(Model) {
  if (Model.modelName === 'BaseEntity') {
    return;
  }

  Model.defineProperty('_oldVersion', {
    type: String
  });

  Model.defineProperty('_version', {
    type: String,
    index: {
      unique: true
    },
    required: true
  });

  Model.defineProperty('_requestId', {
    type: String
  });

  Model.defineProperty('_newVersion', {
    type: String
  });

  // Model.settings._versioning = true;
  // Model.settings.updateOnLoad = true;

  Model.evObserve('after save', function afterSaveVersionMixin(ctx, next) {
    var data = ctx.data || ctx.instance;
    if (data && data.__data) {
      delete data.__data._newVersion;
    }
    next();
  });

  // lock current _version
  Model.evObserve('persist', function versionMixinPersistsFn(ctx, next) {
    delete ctx.data._newVersion;
    return next();
  });
  Model.remoteMethod('deleteWithVersion', {
    http: {
      path: '/:id/:version',
      verb: 'delete'
    },
    description: 'Delete a model instance by id and version number, from the data source.',
    accepts: [{
      arg: 'id',
      type: 'string',
      required: true,
      http: {
        source: 'path'
      }
    }, {
      arg: 'version',
      type: 'string',
      required: true,
      http: {
        source: 'path'
      }
    },
    {
      arg: 'options', type: 'object', http: 'optionsFromRequest'
    }],
    returns: {
      arg: 'response',
      type: 'object',
      root: true
    }
  });

  if (Model.sharedClass && Model.sharedClass.findMethodByName) {
    var remoteMethodOld = Model.sharedClass.findMethodByName('deleteById');
    var remoteMethodNew = Model.sharedClass.findMethodByName('deleteWithVersion');
    remoteMethodOld.accepts = remoteMethodNew.accepts;
    remoteMethodOld.http = remoteMethodNew.http;
  }


  Model.evObserve('before save', function (ctx, next) {
    var data = ctx.data || ctx.instance;
    if (ctx.currentInstance && ctx.data && ctx.data._isDeleted) {
      data._version = uuidv4();
      return next();
    }
    if (ctx.isNewInstance) {
      data._version = data._newVersion || data._version || uuidv4();
      delete data._oldVersion;
      delete data._newVersion;
      return next();
    }
    var id = oecloudutil.getIdValue(ctx.Model, data);
    var _version = data._version;
    utils.checkIfVersionMatched(ctx.Model, id, _version, function (err) {
      data._version = data._newVersion || uuidv4();
      return next(err);
    });
  });
};
