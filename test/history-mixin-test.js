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
var debug = require('debug')('history-mixin-test');
/* var oecloud = require('oe-cloud');
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
var api = defaults(supertest(app));

var basePath = app.get('restApiRoot');

var models = oecloud.models;


var globalCtx = {
  ignoreAutoScope: true,
  ctx: { tenantId: '/default' }
};

describe(chalk.blue('History Mixin Test Started'), function (done) {

  var modelName = 'MixinTest';
  var modelDetails = {
    name: modelName,
    base: 'BaseEntity',
    properties: {
      'name': {
        'type': 'string',
        'required': true,
        'unique': true
      }
    },
    strict: false,
    plural: modelName
  };


  this.timeout(10000);
  var model;

  before('Starting history mixin tests', function (done) {
    models.ModelDefinition.create(modelDetails, globalCtx, function (err, res) {
      if (err) {
        debug('unable to create historyMixinTest model');
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



  it('t1 (oecloud 1.x tests) should create a history model for Test model', function (done) {
    var mainModel = loopback.getModel(modelName, globalCtx);
    var model = loopback.getModel(mainModel.modelName + 'History', globalCtx);
    expect(model).not.to.be.null;
    expect(model).not.to.be.undefined;
    done();
  });


  it('t2 (oecloud 1.x tests) should insert data to TestModel, check if version is set and history model is empty ---programmatically',
    function (done) {
      this.timeout(50000);
      var postData = {
        'name': 'TestCaseOne'
      };
      model.create(postData, globalCtx, function (err, res) {
        if (err) {
          done(err);
        } else {
          model.history({}, globalCtx, function (err, historyRes) {
            if (err) {
              done(err);
            } else {
              expect(historyRes).to.be.empty;
              done();
            }
          });
        }
      });
    });

  it('t3 (oecloud 1.x tests) should insert data to TestModel model, update the same record multiple times and retrive its history.' +
    ' --programmatically',
    function (done) {

      this.timeout(15000);
      var postData = {
        'name': 'TestCaseTwo'
      };
      var dataId;
      model.create(postData, globalCtx, function (err, res) {
        if (err) {
          done(err);
        } else {
          postData.id = res.id;
          postData.name = 'update1';
          postData._version = res._version;
          model.upsert(postData, globalCtx, function (err, upsertRes) {
            if (err) {
              done(err);
            } else {
              postData.name = 'update2';
              postData.id = upsertRes.id;
              postData._version = upsertRes._version;
              model.upsert(postData, globalCtx, function (err, upsertRes) {
                if (err) {
                  done(err);
                } else {
                  model.history({
                    where: {
                      _modelId: dataId
                    }
                  },
                    globalCtx, function (err, historyRes) {
                      if (err) {
                        done(err);
                      } else {
                        expect(historyRes).not.to.be.empty;
                        expect(historyRes).to.have.length(2);
                        done();
                      }
                    });
                }
              });
            }
          });
        }
      });
    });

  it('t4 (oecloud 1.x tests) should insert data to TestModel model, destroy the same record retrive its history ', function (done) {
    this.timeout(10000);

    var postData = {
      'name': 'TestCaseFour'
    };
    var dataId;
    model.create(postData, globalCtx, function (err, res) {
      if (err) {
        done(err);
      } else {
        dataId = res.id;
        model.deleteById(dataId, res._version, globalCtx, function (err, upsertRes) {
          if (err) {
            done(err);
          } else {
            model.history({
              where: {
                _modelId: dataId
              }
            }, globalCtx, function (err, historyRes) {
              if (err) {
                done(err);
              } else {
                expect(historyRes).to.have.length(1);
                done();
              }
            });
          }
        });
      }
    });
  });

  it('t5 (oecloud 1.x tests) should insert new record, using upsert if id is not defined.', function (done) {

    var postData = {
      'name': 'TestCaseFive',
      '_version': uuidv4()
    };
    model.upsert(postData, globalCtx, function (err, res) {
      if (err) {
        done(err);
      } else {
        expect(res.name).to.be.equal('TestCaseFive');
        expect(res.id).not.to.be.null;
        expect(res.id).not.to.be.undefined;
        done();
      }
    });
  });

  it('t6 (oecloud 1.x tests) should insert data to TestModel model,update the same record multiple times and retrive its history--REST api',
    function (done) {
      this.timeout(10000);

      var postData = {
        'name': 'TestCaseThree'
      };
      var url = basePath + '/' + modelName + '/history';
      var dataId;
      var version;
      model.create(postData, globalCtx, function (err, res) {
        if (err) {
          done(err);
        } else {
          postData.id = res.id;
          postData._version = res._version;
          postData.name = 'newName';
          model.upsert(postData, globalCtx, function (err, upsertRes) {
            if (err) {
              done(err);
            } else {
              api
                .get(url)
                .send()
                .expect(200).end(function (err, historyRes) {
                  debug('response body : ' + JSON.stringify(historyRes.body, null, 4));
                  if (err) {
                    done(err);
                  } else {
                    expect(historyRes.body).not.to.be.empty;
                    expect(historyRes.body).to.have.length(4);
                    done();
                  }
                });
            }
          });
        }
      });
    });


  it('t6 (oecloud 2.x test) create record and then update using replacebyid', function (done) {
    this.timeout(50000);
    var postData = {
      id: 123,
      name: "Atul",
      age: 30
    };
    var customerModel = loopback.findModel('Customer');
    customerModel.create(postData, globalCtx, function (err, customer) {
      if (err) {
        return done(err);
      } else {
        customerModel.replaceById(customer.id, { name: "Atul111", age: 31, _version: customer._version }, globalCtx, function (err, customer2) {
          if (err) {
            return done(err);
          }
          var newData = customer2.toObject();
          newData.name = 'Atul222';
          customerModel.replaceOrCreate(newData, globalCtx, function (err, customer3) {
            if (err) {
              return done(err);
            }
            customer3.updateAttributes({ name: "Atul3333", age: 35, id: customer3.id, _version: customer3._version }, globalCtx, function (err, customer4) {
              if (err) {
                return done(err);
              }
              if (customer4.name !== 'Atul3333' || customer4.age !== 35) {
                return done(new Error("data not matching. expetcing name change"));
              }
              var url = basePath + '/Customers/history?filter={"where" : { "_modelId" : 123 } }';

              api
                .get(url)
                .send()
                .expect(200).end(function (err, historyRes) {
                  if (err) {
                    return done(err);
                  } else {
                    expect(historyRes.body).not.to.be.empty;
                    expect(historyRes.body).to.have.length(3);
                    return done();
                  }
                });
            })
          })
        })
      }
    });
  });
});

