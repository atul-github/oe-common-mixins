/**
 *
 * ©2018-2019 EdgeVerve Systems Limited (a fully owned Infosys subsidiary),
 * Bangalore, India. All Rights Reserved.
 *
 */

/**
 * This mixin is to support eventual consistency. This mixin support patterns of
 * Idempotent behavior or replay behavior, which will enable framework to perform actions
 * multiple times and preserve the same outcome. The system maintains this
 * behavior in CRUD operations.
 *
 * Idempotent behavior – The ability to perform the same operation multiple time
 * and always receive the same results
 *
 * @mixin Idempotent mixin
 * @author Praveen
 */

var mergeQuery = require('loopback-datasource-juggler/lib/utils').mergeQuery;

function fromCreateCallback(){
  var err = new Error();
  var m = err.stack.split('\n');
  if(m[3].indexOf('    at createCallback') === 0 && m[3].indexOf('loopback-datasource-juggler/lib/dao.js') > 0){
    return true;
  }
}

module.exports = function IdempotencyMixin(Model) {
  console.log('idempotent mixin attached to ', Model.modelName);
  function overrideCreate(nModel){
    var _create = nModel.create;
    nModel.create = function (data, options, cb) {
      var self = this;
      if(typeof options === 'function' && !cb){
          cb = options;
          options = {};
      }

      _create.call(self, data, options, function(err, result){
        if(err && err.message === 'STOP'){
          return cb(undefined, err.instance);
        }
        if(err && fromCreateCallback()) {
          var context = {
            Model: Model,
            data: result,
            isNewInstance: true,
            options: options,
          };
          Model.checkIdempotencyAfter(err, context, function(e, rinst){
            if(e){
              return cb(e);
            }
            return cb(undefined, rinst);
          });
        }
        else {
          return cb(err, result);
        }
      });
    }

    var _updateAttributes = nModel.prototype.updateAttributes;
    nModel.prototype.updateAttributes = function(data, options, cb){
      var self=this;

      _updateAttributes.call(self, data, options, function(err, result){
        if(err && err.message === 'STOP'){
          return cb(undefined, err.instance);
        }
        return cb(err, result);
      });
    }
  }

  overrideCreate(Model);

  Model.findInHistory = function findInHistory(ctx, cb) {
    var data = ctx.data || ctx.instance;
    if (!Model._historyModel || !data._newVersion) {
      process.nextTick(function() { 
        cb(); 
      });
      return;
    }
    var whereClause = {
      '_version': data._newVersion
    };
    Model._historyModel.find({
      where: whereClause
    }, ctx.options, function historyModelFindcb(err, result) {
      if (err) {
        return cb(err);
      }
      if (result && result.length) {
        if (ctx.currentInstant) {
          return cb(null, ctx.currentInstant);
        }
        var hinst = result[0];
        Model.findById(hinst._modelId, ctx.options, function modelFindByIdcb(err, latestInst) {
          return cb(err, latestInst);
        });
      } else {
        return cb();
      }
    });
  };

  Model.checkIdempotencyAfter = function modelCheckIdempotencyAfter(err, ctx, cb) {
    var data = ctx.data || ctx.instance;
    if (ctx.isNewInstance && err && data._version) {
      var whereClause = {
        '_version': data._version
      };
      Model.find({
        where: whereClause
      }, ctx.options, function modelFindcb(error, result) {
        if (error) {
          return cb(err);
        } else if (result && result.length) {
          return cb(null, result[0]);
        }
        return cb(err);
      });
    } else if (!ctx.isNewInstance) {
      Model.findInHistory(ctx, function (err, res) {
        if (res === null) {
          return cb(err);
        }
        return cb(null, res);
      });
    } else {
      return cb(err);
    }
  };

  Model.evObserve('loaded', function (ctx, cb) {
    if(!ctx.data || ctx.data.count===0){
      Model.checkIdempotencyAfter('dummy error', ctx,  function(e, r) {
        if(e){
          return cb(e);
        }
        if(r){
          return cb({message : 'STOP', instance: r});
        }
        return cb();
      });
    }
    return cb();
  });


  Model.evObserve('before save', function (ctx, cb) {
    var data = ctx.data || ctx.instance;
    if (ctx.currentInstance && data) {
      if (ctx.currentInstance._version === data._newVersion) {
        return cb(null, ctx.currentInstance);
      }
    }
    function commonCallback(err, rinstance) {
      if (err) {
        return cb(err);
      }
      if (rinstance) {
        return cb({message : 'STOP', instance : rinstance});
      }
      if(ctx.Model.settings._versioning){
        return ctx.Model.switchVersion(ctx, cb);
      }
      return cb();
    }

    if (ctx.isNewInstance) {
      data._newVersion = data._newVersion || data._version;
    }

    if (data._newVersion && ctx.isNewInstance) {
      // create case
      return Model.findInHistory(ctx, commonCallback);
    } else if (data._newVersion) {
      // update case by id
      if (ctx.currentInstance && ctx.currentInstance._version === data._newVersion) {
        return commonCallback();
      }
      return Model.findInHistory(ctx, commonCallback);
    }
    return commonCallback();
  })

};



