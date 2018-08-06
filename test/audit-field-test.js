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
describe(chalk.blue('Audit Field Mixin Test Started'), function (done) {
  this.timeout(15000);
  before('wait for boot scripts to complete', function (done) {
    Customer = loopback.findModel("Customer");
    deleteAllUsers(function () {
      return done();
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
    Customer.settings.mixins.SoftDeleteMixin = false;
    Customer.destroyAll({}, { notify: false }, function (err, results) {
      Customer.settings.mixins.SoftDeleteMixin = true;
      console.log(results);
      if (err)
        return done(err);
      var CustomerAddress = loopback.getModel('CustomerAddress', globalCtx);
      CustomerAddress.destroyAll({}, { notify: false}, function (err) {
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
      expect(r[0]._createdBy).to.be.equal("system");
      expect(r[0]._modifiedBy).to.be.equal("system");
      expect(r[0]._type).to.be.equal("Customer");
      return done();
    });
  });


  it('t4-1 fetch record and update without providing version and providing wrong version - it should fail', function (done) {
    var url = basePath + '/customers?access_token=' + adminToken;
    api.set('Accept', 'application/json')
      .post(url)
      .send({name : "Atul" , age : 30})
      .end(function (err, response) {
        var result = response.body;
        expect(response.status).to.be.equal(200);
        expect(result._createdBy).to.be.equal("admin");
        expect(result._modifiedBy).to.be.equal("admin");
        done();
      });

  });
});





