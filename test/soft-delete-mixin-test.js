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
chai.use(require('chai-things'));

var expect = chai.expect;
var models = oecloud.models;


var globalCtx = {
  ignoreAutoScope: true,
  ctx: { tenantId: '/default' }
};



describe(chalk.blue('Soft Delete Mixin Test Started'), function () {
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

  it('t1 - (oecloud 1.x test) Should insert data to the TestModel and see if _isDelete is present and set to false ', function (done) {
    var postData = {
      'name': 'TestCaseOne',
      '_version': uuidv4()
    };
    models[modelName].create(postData, globalCtx, function (err, res) {
      if (err) {
        done(err);
      } else {
        expect(res.name).to.be.equal(postData.name);
        expect(res['_isDeleted']).to.be.false;
        done();
      }
    });
  });

  it('t2 - (oecloud 1.x test) Should delete record from TestModel using destroyById and find the same record ,should not return the record ', function (done) {
    var postData = {
      'name': 'TestCaseTwo',
      '_version': uuidv4()
    };
    models[modelName].create(postData, globalCtx, function (err, res) {
      if (err) {
        done(err);
      } else {
        models[modelName].destroyById(res.id, res._version, globalCtx, function (err) {
          if (err) {
            done(err);
          } else {
            models[modelName].findById(res.id, globalCtx, function (err, record) {
              if (err) {
                done(err);
              } else {
                expect(record).to.be.null;
                done();
              }
            });
          }
        });
      }
    });
  });
  it('t3 - (oecloud 1.x test) Should delete record from TestModel using destroyAll, on find nothing should be return ', function (done) {
    models[modelName].destroyAll({}, globalCtx, function (err) {
      if (err) {
        done(err);
      } else {
        models[modelName].find({}, globalCtx, function (err, record) {
          if (err) {
            done(err);
          } else {
            expect(record).to.be.empty;
            done();
          }
        });
      }
    });
  });

});