/**
 *
 * 2018-2019 EdgeVerve Systems Limited (a fully owned Infosys subsidiary),
 * Bangalore, India. All Rights Reserved.
 *
 */

// Author : Atul
var oecloud = require('oe-cloud');
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
  userModel.destroyAll({}, {}, function (err) {
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

describe(chalk.blue('Common Mixins Test Started'), function (done) {
  this.timeout(10000);
  before('wait for boot scripts to complete', function (done) {
    app.on('test-start', function () {
      Customer = loopback.findModel("Customer");
      deleteAllUsers(function () {
        return done();
      });
    });
  });

  afterEach('destroy context', function (done) {
    done();
  });

  it('t1-0 create user admin/admin with /default tenant', function (done) {
    var url = basePath + '/users';
    api.set('Accept', 'application/json')
    .post(url)
    .send([{ username: "admin", password: "admin", email: "admin@admin.com" },
    { username: "evuser", password: "evuser", email: "evuser@evuser.com" },
    { username: "infyuser", password: "infyuser", email: "infyuser@infyuser.com" },
    { username: "bpouser", password: "bpouser", email: "bpouser@bpouser.com" }
    ])
    .end(function (err, response) {

      var result = response.body;
      expect(result[0].id).to.be.defined;
      expect(result[1].id).to.be.defined;
      expect(result[2].id).to.be.defined;
      expect(result[3].id).to.be.defined;
      done();
    });
  });

  var adminToken;
  it('t2 Login with admin credentials', function (done) {
    var url = basePath + '/users/login';
    api.set('Accept', 'application/json')
    .post(url)
    .send({ username: "admin", password: "admin" })
    .end(function (err, response) {
      var result = response.body;
      adminToken = result.id;
      expect(adminToken).to.be.defined;
      done();
    });
  });

  it('t3-1 clean up Customer models', function (done) {
    Customer.destroyAll({}, {}, function (err) {
      if (err)
        return done(err);
      var CustomerAddress = loopback.getModel('CustomerAddress', globalCtx);
      CustomerAddress.destroyAll({}, {}, function (err) {
        return done(err);
      });
    });
  });

  it('t3-2 create records in Customer models', function (done) {
    Customer.create([{name: "Smith", age: 30, id: 1 }, {name: "Atul", age: 30, id: 2 }, {name: "John", age: 30, id: 3 }], globalCtx, function (err, r) {
      if (err) {
        return done(err);
      }
      expect(r.length).to.be.equal(3);
      expect(r[0]._version).not.to.be.undefined;
      return done();
    });
  });


  it('t4-1 fetch record and update without providing version and providing wrong version - it should fail', function (done) {
    Customer.find({}, globalCtx, function (err, r) {
      if (err) {
        return done(err);
      }
      expect(r.length).to.be.equal(3);
      expect(r[0]._version).not.to.be.undefined;

      var instance = r[0];
      instance.updateAttributes({ name: "Changed", id: 1, age: 50 }, globalCtx, function (err, r) {
        if (!err) {
          return done(new Error("Expcted test case to throw error"));
        }
        instance.updateAttributes({ name: "Changed", id: 1, age: 50, _version : "ABCDEF" }, globalCtx, function (err, r) {
          if (err) {
            return done();
          }
          return done(new Error("Expcted test case to throw error"));
        });
      });
    });
  });

  it('t4-2 fetch record and update by providing right version - it should succeed', function (done) {
    Customer.find({}, globalCtx, function (err, r) {
      if (err) {
        return done(err);
      }
      expect(r.length).to.be.equal(3);
      expect(r[0]._version).not.to.be.undefined;

      var instance = r[0];
      instance.updateAttributes({ name: "Changed", id: 1, age: 50, _version: instance._version }, globalCtx, function (err, r) {
        if (err) {
          return done(err);
        }
        return done();
      });
    });
  });


  it('t5-1 fetch record and update without providing version - it should fail - using replacebyid', function (done) {
    Customer.find({}, globalCtx, function (err, r) {
      if (err) {
        return done(err);
      }
      expect(r.length).to.be.equal(3);
      expect(r[0]._version).not.to.be.undefined;

      var instance = r[0];
      Customer.replaceById(1, { name: "Changed Again", age: 55 }, globalCtx, function (err, r) {
        if (err) {
          return done();
        }
        return done(new Error("Error"));
      });
    });
  });

  it('t5-2 fetch record and update by providing right version - it should succeed - using replacebyid', function (done) {
    Customer.find({}, globalCtx, function (err, r) {
      if (err) {
        return done(err);
      }
      expect(r.length).to.be.equal(3);
      expect(r[0]._version).not.to.be.undefined;
      var instance = r[0];
      Customer.replaceById(1, { name: "Changed Again", age: 55, _version: instance._version }, globalCtx, function (err, r) {
        if (err) {
          return done(err);
        }
        return done();
      });
    });
  });

  it('t6-1 fetch record and update without providing version or passing wrong version - it should fail - using HTTP REST', function (done) {

    var url = basePath + '/customers?access_token=' + adminToken;
    api.set('Accept', 'application/json')
      .get(url)
      .end(function (err, response) {
        var result = response.body;
        expect(response.status).to.be.equal(200);
        expect(result.length).to.be.equal(3);
        var instance = result[0];

        api.set('Accept', 'application/json')
          .put(url)
          .send({ name: "Customer AA", age: 100, id : 1 })
          .end(function (err, response) {
            var result = response.body;
            expect(response.status).not.to.be.equal(200);

            api.set('Accept', 'application/json')
              .put(url)
              .send({ name: "Customer AA", age: 100, id: 1, _version : "ABCDDD" })
              .end(function (err, response) {
                var result = response.body;
                expect(response.status).not.to.be.equal(200);
                done();
              });
          });
      });
  });


  it('t6-2 fetch record and update by providing right version - it should succeed - using HTTP REST', function (done) {

    var url = basePath + '/customers?access_token=' + adminToken;
    api.set('Accept', 'application/json')
      .get(url)
      .end(function (err, response) {
        var result = response.body;
        expect(response.status).to.be.equal(200);
        expect(result.length).to.be.equal(3);
        var instance = result[0];
        api.set('Accept', 'application/json')
          .put(url)
          .send({ name: "Customer BB", age: 100, id: 1, _version : instance._version })
          .end(function (err, response) {
            var result = response.body;
            expect(response.status).to.be.equal(200);
            return done(err);
          });
      });
  });

  it('t6-3 fetch record and ensure that update was right - using HTTP REST', function (done) {

    var url = basePath + '/customers?access_token=' + adminToken;
    api.set('Accept', 'application/json')
      .get(url)
      .end(function (err, response) {
        var result = response.body;
        expect(response.status).to.be.equal(200);
        expect(result.length).to.be.equal(3);
        expect(result.find(function (item) { return (item.name === "Customer BB" && item.age === 100); }).name).to.be.equal("Customer BB");
        return done();
      });
  });

  it('t7-1 deleting record without providing version or providing wrong version - it should fail - using HTTP REST', function (done) {

    var url = basePath + '/customers?access_token=' + adminToken;
    api.set('Accept', 'application/json')
      .get(url)
      .end(function (err, response) {
        var result = response.body;
        expect(response.status).to.be.equal(200);
        expect(result.length).to.be.equal(3);
        var instance = result[0];
        var url2 = basePath + '/customers/' + instance.id + '?access_token=' + adminToken;
        api.set('Accept', 'application/json')
          .delete(url2)
          .send({})
          .end(function (err, response) {
            var result = response.body;
            expect(response.status).not.to.be.equal(200);
            var url2 = basePath + '/customers/' + instance.id + '/xyz?access_token=' + adminToken;
            api.set('Accept', 'application/json')
              .delete(url2)
              .send({})
              .end(function (err, response) {
                var result = response.body;
                expect(response.status).not.to.be.equal(200);
                done();
              });
          });
      });
  });

  it('t7-2 deleting record by providing right version - it should succeed - using HTTP REST', function (done) {

    var url = basePath + '/customers?access_token=' + adminToken;
    api.set('Accept', 'application/json')
      .get(url)
      .end(function (err, response) {
        var result = response.body;
        expect(response.status).to.be.equal(200);
        expect(result.length).to.be.equal(3);
        var instance = result[0];
        var url2 = basePath + '/customers/' + instance.id + '/' + instance._version +'?access_token=' + adminToken;
        api.set('Accept', 'application/json')
          .delete(url2)
          .send({})
          .end(function (err, response) {
            var result = response.body;
            expect(response.status).to.be.equal(200);
            expect(response.body.count).to.be.equal(1);
            return done(err);
          });
      });
  });

});





