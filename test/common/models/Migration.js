/**
 *
 * 2018-2019 EdgeVerve Systems Limited (a fully owned Infosys subsidiary),
 * Bangalore, India. All Rights Reserved.
 *
 */

module.exports = function MigrationFunction(Migration) {
    Migration.getzip = function (exportAllTables, tableList, cb) {
    };


    //   var methods = methods || [];
    //   Migration.sharedClass.methods().forEach(function (method) {
    //     method.shared = methods.indexOf(method.name) > -1;
    //   });
    debugger;

       Migration.disableRemoteMethodByName('create');
       Migration.disableRemoteMethodByName('upsert');
       Migration.disableRemoteMethodByName('updateAll');
       Migration.disableRemoteMethodByName('prototype.updateAttributes');

       Migration.disableRemoteMethodByName('find');
       Migration.disableRemoteMethodByName('findById');
       Migration.disableRemoteMethodByName('findOne');

       Migration.disableRemoteMethodByName('deleteById');

       Migration.disableRemoteMethodByName('confirm');
       Migration.disableRemoteMethodByName('count');
       Migration.disableRemoteMethodByName('exists');
       Migration.disableRemoteMethodByName('resetPassword');

       Migration.disableRemoteMethodByName('prototype.__count__accessTokens');
       Migration.disableRemoteMethodByName('prototype.__create__accessTokens');
       Migration.disableRemoteMethodByName('prototype.__delete__accessTokens');
       Migration.disableRemoteMethodByName('prototype.__destroyById__accessTokens');
       Migration.disableRemoteMethodByName('prototype.__findById__accessTokens');
       Migration.disableRemoteMethodByName('prototype.__get__accessTokens');
       Migration.disableRemoteMethodByName('prototype.__updateById__accessTokens');
  
    Migration.remoteMethod('getzip', {
        description: 'Gets a zip file of the exported data',
        accessType: 'READ',
        accepts: [{
            arg: 'exportAllTables',
            type: 'string'
        },
        {
            arg: 'tableList',
            type: 'string'
        }
        ],
        http: {
            verb: 'GET',
            path: '/getzip'
        },
        returns: [{
            arg: 'body',
            type: 'file',
            root: true
        },
        {
            arg: 'Content-Type',
            type: 'string',
            http: {
                target: 'header'
            }
        },
        {
            arg: 'Content-Disposition',
            type: 'string',
            http: {
                target: 'header'
            }
        }
        ]

    });
};

