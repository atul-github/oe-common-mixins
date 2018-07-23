/**
 *
 * 2018-2019 EdgeVerve Systems Limited (a fully owned Infosys subsidiary),
 * Bangalore, India. All Rights Reserved.
 *
 */

// Author : Atul
var oecloud = require('oe-cloud');
var loopback = require('loopback');
var bootstrap = require('./bootstrap');
const uuidv4 = require('uuid/v4');
/*var oecloud = require('oe-cloud');
var loopback = require('loopback');

oecloud.observe('loaded', function (ctx, next) {
  oecloud.attachMixinsToBaseEntity("VersionMixin");
  return next();
})


oecloud.boot(__dirname, function (err) {
  if (err) {
    console.log(err);
    process.exit(1);
  }
  oecloud.start();
  oecloud.emit('test-start');
});
*/

var chalk = require('chalk');
var chai = require('chai');
var async = require('async');
chai.use(require('chai-things'));

var expect = chai.expect;

var app = oecloud;
var defaults = require('superagent-defaults');
var supertest = require('supertest');
var Customer;
var api = defaults(supertest(app));
var basePath = app.get('restApiRoot');
var url = basePath + '/Employees';

var models = oecloud.models;

function deleteAllUsers(done) {
  var userModel = loopback.findModel("User");
  userModel.destroyAll({}, { notify: false}, function (err) {
    if (err) {
      return done(err);
    }
    userModel.find({}, {}, function (err2, r2) {
      if (err2) {
        return done(err2);
      }
      if (r2 && r2.length > 0) {
        return done(new Error("Error : users were not deleted"));
      }
    });
    return done(err);
  });
}

var globalCtx = {
  ignoreAutoScope: true,
  ctx: { tenantId: '/default' }
};



describe(chalk.blue('Version Mixin Test Started'), function () {
  this.timeout(10000);

  var testDatasourceName = uuidv4();
  var modelName = 'TestModel';

  var TestModelSchema = {
    name: modelName,
    base : "BaseEntity",
    properties: {
      'name': {
        'type': 'string',
        'required': true,
        'unique': true
      }
    }
  };


  before('wait for boot scripts to complete', function (done) {
    debugger;
    models.ModelDefinition.create(TestModelSchema, globalCtx, function (err, res) {
      if (err) {
        debug('unable to create VersionMixinTest model');
        done(err);
      } else {
        model = loopback.getModel(modelName, globalCtx);
        done();
      }
    });
  });

  afterEach('destroy context', function (done) {
    done();
  });

  it('Should insert data to the TestModel and see if _isDelete is present and set to false ', function (done) {
    var postData = {
      'name': 'TestCaseOne',
      '_version': uuidv4()
    };
    models[modelName].create(postData, bootstrap.defaultContext, function (err, res) {
      if (err) {
        done(err);
      } else {
        expect(res.name).to.be.equal(postData.name);
        expect(res['_isDeleted']).to.be.false;
        done();
      }
    });
  });


});