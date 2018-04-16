var app = require('oe-cloud');
app.observe('loaded', function(ctx, next){
  app.addSettingsToModelDefinition({properties : {HistoryMixin : {type : "boolean"}}});
  app.addSettingsToModelDefinition({properties : {_versioning : {type : "boolean", default : false}}});
  return next();
})

module.exports = function(){
  
}
