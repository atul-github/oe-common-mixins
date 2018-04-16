var app = require('oe-cloud');
app.observe('loaded', function(ctx, next){
  app.addSettingsToModelDefinition({properties : {HistoryMixin : {type : "boolean"}}});
  return next();
})

module.exports = function(){
  
}
