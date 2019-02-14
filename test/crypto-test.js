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
var MongoClient = require('mongodb').MongoClient;

var mongoHost = process.env.MONGO_HOST || 'localhost';
var postgresHost = process.env.POSTGRES_HOST || 'localhost';
var oracleHost = process.env.ORACLE_HOST || 'localhost';
var oraclePort = process.env.ORACLE_PORT || 1521;
var oracleService = process.env.ORACLE_SID || 'orcle.ad.infosys.com' ;// 'orclpdb.ad.infosys.com';
var oracleUser = process.env.ORACLE_USERNAME || 'oeadmin';
var oraclePassword = process.env.ORACLE_PASSWORD || 'oeadmin';

var chalk = require('chalk');
var chai = require('chai');
chai.use(require('chai-things'));

var expect = chai.expect;

var app = oecloud;

var models = oecloud.models;
describe(chalk.blue('Crypto Mixin Test Started'), function (done) {
  var modelName = 'CryptoTest';
  var dsname = 'db';
  var dbname = process.env.DB_NAME || 'oe-common-mixins-test';
  var ccNo = '1234-5678-9012-3456';

  var TestModelSchema = {
    'creditCardNo': {
      'type': 'string',
      'encrypt': true,
      'required': true
    }
  };
  var opts = {
    strict: true,
    base: 'BaseEntity',
    plural: modelName + 's',
    mixins: {
      'CryptoMixin': true
    },
    dataSourceName: 'db',
    propsToEncrypt : ["creditCardNo"]
  };


  var TestModel = null;
  var result1; var result2 = null;
  var id;

  before('wait for boot scripts to complete', function (done) {
    var dataSource = app.datasources[dsname];
    proceed0(dataSource.connector.name, done);
  });

  function proceed0(dataSourceName, done) {
    // Create a TestModel
    TestModel = loopback.createModel(modelName, TestModelSchema, opts);
    app.model(TestModel, {
      dataSource: dsname
    });
    TestModel.destroyAll({}, bootstrap.defaultContext, function (err, info) {
      proceed(dataSourceName, done);
    });
  }


  // Create a record in TestModel with encryption enabled on a field, and
  // fetch the inserted record using standard framework API
  // and get the value of the encrypted field
  function proceed(dataSourceName, done) {
    // Add a record
    TestModel.create({
      creditCardNo: ccNo
    }, bootstrap.defaultContext, function (err, data) {
      if (err) {
        done();
      } else {
        id = data.id;
        console.log('id', id);
        TestModel.findById(id, bootstrap.defaultContext, function (err1, data1) {
          if (err1) {
            done(err1);
          } else {
            result1 = data1.creditCardNo;
            proceed2(dataSourceName, done);
          }
        });
      }
    });
  }

  // Fetch the inserted record directly from DB using MongoDB API
  // and get the value of the encrypted field
  function proceed2(dataSourceName, done) {
    if (dataSourceName === 'mongodb') {
      var url = 'mongodb://' + mongoHost + ':27017/' + dbname;
      MongoClient.connect(url, function (err, db) {
        if (err) {
          done(err);
        } else {
          if( db && db.db && db.db(dbname)){
            db = db.db(dbname);
          }
          var collection = db.collection(modelName);
          collection.findOne({
            _id :id
          }, function (err2, data2) {
            if (err2) {
              done(err2);
            } else {
              result2 = data2 && data2.creditCardNo;
              done();
            }
          });
        }
      });
    } else if (dataSourceName === 'oracle') {
      var oracledb = require('oracledb');
      oracledb.getConnection({
        'password': oraclePassword,
        'user': oracleUser,
        'connectString': oracleHost + ':' + oraclePort + '/' + oracleService
      }, function (err, connection) {
        if (err) {
          done(err);
        }
        connection.execute(
          'SELECT * from ' + modelName.toLowerCase(),
          function (error, result) {
            if (error) {
              done(error);
            }
            console.log('data2', result);
            result2 = result.rows && result.rows[0].creditcardno;
            //console.log('result2', result2);
            done();
          });
      });
    } else {
      var connectionString = 'postgres://postgres:postgres@' + postgresHost + ':5432/' + dbname;
      var pg = require('pg');
      var client = new pg.Client(connectionString);
      client.connect(function (err) {
        if (err) {
          done(err);
        } else {
          // console.log("Connected to Postgres server");
          client.query('SELECT * from ' + modelName.toLowerCase(), function (err2, data2) {
            if (err2) {
              done(err2);
            } else {
              //console.log('data2', data2);
              result2 = data2.rows && data2.rows[0].creditcardno;
              console.log('result2', result2);
              done();
            }
          });
        }
      });
    }
  }

  after('Cleanup', function (done) {
    TestModel.destroyAll({}, bootstrap.defaultContext, function (err, info) {
      if (err) {
        console.log(err, info);
      }
      done();
    });
  });

  afterEach('destroy context', function (done) {
    done();
  });

  it('Should encrypt the creditCardNo field in TestModel when "encrypt" is set to "true"', function (done) {
    expect(models[modelName]).not.to.be.null;
    expect(result1).not.to.be.null;
    expect(result2).not.to.be.null;
    expect(ccNo).to.equal(result1);
    expect(result1).to.not.equal(result2);
    done();
  });
});


