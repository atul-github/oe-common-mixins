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
  oecloud.attachMixinsToBaseEntity("AuditFieldsMixin");
  oecloud.attachMixinsToBaseEntity("HistoryMixin");
  oecloud.attachMixinsToBaseEntity("SoftDeleteMixin");
  
  
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

describe('Common Mixins Test Started', function () {
  this.timeout(15000);
  it('Waiting for application to start', function (done) {
    oecloud.on('test-start', function () {
      done();
    });
  });
});



