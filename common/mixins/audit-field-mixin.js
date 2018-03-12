module.exports = function AuditFieldsMixin(Model) {
  console.log('attaching audit-field-mixin ->', Model.modelName)
  if (Model.definition.name === 'BaseEntity') {
    return;
  }

  Model.defineProperty('_type', {
    type: String,
    length: 50
  });
  Model.defineProperty('_createdBy', {
    type: String,
    length: 50
  });
  Model.defineProperty('_modifiedBy', {
    type: String,
    length: 50
  });

  Model.defineProperty('_createdOn', {
    type: 'timestamp'
  });

  Model.defineProperty('_modifiedOn', {
    type: 'timestamp'
  });

  if ((Model.settings.overridingMixins && !Model.settings.overridingMixins.AuditFieldsMixin) || !Model.settings.mixins.AuditFieldsMixin) {
    Model.observe('before save', injectAuditFields);
  } else {
    Model.observe('before save', injectAuditFields);
  }
};

/**
 * This is an before save observer hook to auto inject Audit properties to the
 * Posted data.<br><br>
 *
 * It checks if posted data is a new instance or an update. In case of new
 * Instance it populates all the audit fields, where as in case of update it
 * modifies _modifiedBy and _modifiedOn with the appropriate user and time stamp respectively.
 *
 * @param {object} ctx - ctx object, which is populated by DAO.
 * @param {function} next - move to the next function in the queue
 * @return {function} next - move to the next function in the queue
 * @memberof Audit Mixin
 */
function injectAuditFields(ctx, next) {
  var context = ctx.options;
  var cctx = context.ctx || {};

  var remoteUser = cctx.remoteUser || 'system';

  var currentDateTime = new Date();

  var protectedFields = ['_type', '_createdBy', '_modifiedBy', '_createdOn', '_modifiedOn'];
  var postData = ctx.instance || ctx.data;
  // var currentInstance = ctx.currentInstance;
  // if user provide data for any protectedField those data are removed, and
  // auto set.
  var isInstance = ctx.instance;
  protectedFields.forEach(function AuditFieldsMixinProtectedFieldsForEachCb(field) {
    if (isInstance) {
      postData.unsetAttribute(field);
    } else {
      delete postData[field];
    }
  });
  if (isInstance) {
    // full save.
    if (ctx.isNewInstance) {
      // Auto-populate entity type
      postData._type = ctx.Model.definition.name;

      // Auto-populate created by user id and timestamp
      postData._createdBy = remoteUser;
      postData._createdOn = currentDateTime;
    }
  }
  postData._modifiedBy = remoteUser;
  postData._modifiedOn = currentDateTime;
  return next();
}
