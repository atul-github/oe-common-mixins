# oe-common-mixins

- [Introduction](#introduction)
  * [dependency](#dependency)
  * [Getting Started](#getting-started)
    + [Testing and Code coverage](#testing-and-code-coverage)
    + [Installation](#installation)
- [Audit Field Mixin](#audit-field-mixin)
  * [Using AuditFieldMixin](#using-auditfieldmixin)
    + [Loading Mixin using model-config.json](#loading-mixin-using-model-configjson)
    + [Loading Mixin using app-list.json](#loading-mixin-using-app-listjson)
    + [Loading Mixin pragmatically](#loading-mixin-pragmatically)
- [Version Mixin](#version-mixin)
  * [Using VersionMixin](#using-versionmixin)
    + [Loading VersionMixin using model-config.json](#loading-versionmixin-using-model-configjson)
    + [Loading Mixin using app-list.json](#loading-mixin-using-app-listjson-1)
    + [Loading Mixin pragmatically](#loading-mixin-pragmatically-1)
  * [Developer Considerations](#developer-considerations)
- [Soft Delete Mixin](#soft-delete-mixin)
  * [Using SoftDeleteMixin](#using-softdeletemixin)
  * [Developer Considerations](#developer-considerations-1)
    + [Loading Mixin using model-config.json](#loading-mixin-using-model-configjson-1)
    + [Loading Mixin using app-list.json](#loading-mixin-using-app-listjson-2)
    + [Loading Mixin pragmatically](#loading-mixin-pragmatically-2)
  * [Developer Considerations](#developer-considerations-2)
   
# oe-common-mixins

# Introduction



oeCloud mixin is functionality which can be declaratively attached to Model as **mixins** property. This module implements most commonly used functionalities which can be attached to models. These functionalities are 

* Version Mixin
* Audit Field Mixin
* Soft Delete Mixin
* History Mixin


## dependency

* oe-cloud
* oe-logger


## Getting Started

In this section, we will see how we can use install this module in our project. To use any of mixins/functionality in project from this module, you must install this module.


### Testing and Code coverage

```sh
$ git clone http://evgit/oec-next/oe-common-mixins.git
$ cd oe-common-mixins
$ npm install --no-optional
$ npm run grunt-cover
```

you should see coverage report in coverage folder.


### Installation

To use **AuditFieldMixin** in your project, you must include this package into your package.json as shown below. So when you do **npm install** this package(oe-common-mixins) will be made available. Please ensure the source of this package is right and updated. For now we will be using **evgit** as source. Also, please note that, to use this mixin, you project must be **oeCloud** based project.


```javascript
"oe-common-mixins": "git+http://<gitpath>/oe-common-mixins.git#master"
```

You can also install this mixin on command line using npm install. 


```sh
$ npm install <git path oe-common-mixins> --no-optional
```

# Audit Field Mixin

When application creates records in Model or updates records in Model, as a developer, you may want to know who has originally created record. Or you may want to know who has last updated this record. You want to know when record was created or when record was modified. All these information we call it Auditing information. oeCloud has ability to maintain this information in same Model. All programmer has to do is to attach this **mixin** to model and oeCloud will maintain this information. This way, at any point of time, you will always know when record was crated, who created that record and when it was last updated by whom.


## Using AuditFieldMixin


To use **AuditFieldMixin** you must load this mixin into your application. Usually this happens during boot of the application. There are several ways to configure mixin paths for your application. You can do it declaratively or you can do it programatically.

**AuditFieldMixin** creates following properties to Model where it is attached to.

* _createdBy : who has created this record. This information is taken from context. If it is http request, it is usually logged in user id. If it is called by JavaScript API, you can explicitly assign userId to ctx.remoteUser in options. This field is touched only when record is created.
* _modifiedBy : this is very similar to _createdBy field except it is updated for update and create operation.
* _createdOn : When record is created. This is server's date time where application is running and not database time.
* _modifiedOn : Same as above exept it will be populated during update and create operations.


### Loading Mixin using model-config.json

In application's model-config.json, you can have entry for mixin directory as shown below. This way mixin will be loaded as part of boot script.


```javascript
"_meta": {
        "sources": [
          ...
            "../server/models",
            "../common/models",
            "./models",
          ...
        ],
        "mixins": [
        ...
            "../common/mixins",
            "./mixins"
            "oe-common-mixins/common/mixins"
        ...
        ]
    },
```

As shown above, oe-common-mixins's mixin path is declared in application. Once this is done, you can **assign** this mixin to the model you want as shown below.

```javascript
{
  "name": "Customer",
  "base": "BaseEntity",
  "properties": {
    "name": {
      "type": "string",
      "unique" : true
    }
    ...
  },
  "mixins" : {
      "AuditFieldMixin" : true
  }
}
```

This will add **AuditFieldMixin** functionality to Customer model. It means that, whenever a record is created or modified, audit fields are populated. 


### Loading Mixin using app-list.json

This is most ideal and preferred way of loading any oe cloud node module in application. This guarantees all functionality applies to application and programmer doesn't need to do any extra coding or declarations.

app-list.json is application's module file which is loaded as part of boot. oeCloud goes through this file and load modules in sequence as given in app-list.json. It also applies mixins in module, run boot scripts, loads middlewares and so on.

This feature applies mixins to **BaseEntity** model - which is usually **base** model for all the models in oeCloud based application. Thus mixin applies on BaseEntity is also available in your model.

Application developer should have following in app-list.json. This will attach all the mixins available in **oe-common-mixins** to BaseEntity.

```javascript
...
  {
    "path": "oe-common-mixins",
    "enabled": true
  },
...  
```

If you want only **AuditFieldMixin** to be enabled by default, then you can have app-list.json entry as below.

```javascript
...
  {
    "path": "oe-common-mixins",
	"AuditFieldMixin" : true,
	"VersionMixin" : false,
	"SoftDeleteMixin" : false,
	"HistoryMixin" : false,
    "enabled": true
  },
...  
```

### Loading Mixin pragmatically

Imagine that you are developing oe cloud node module. That has got some Model and you want only   **AuditFieldMixin** applied to your model. You don't want application developer to add app-list.json entry. In short, you don't want application developer even aware of oe-common-mixins module. In this scenario, you have responsibility to load the module. **oe-common-mixin** can be loaded programatically as shown below. Ensure that you have dependency added in your module's **package.json** file.

* In your index.js file of module (index.js should be first file loaded by oeCloud), write following code. And your model, ensure that "mixins" property has **AuditFieldMixin** value set to true.

```javascript
const commonMixins = require('oe-common-mixins');
commonMixin();
```

* Other way to load common mixins is in your index.js file, wait till all modules are loaded and then load commonMixins

```javascript
oecloud.observe('loaded', function (ctx, next) {
	const commonMixins = require('oe-common-mixins');
	commonMixin(ctx);
    return next();
})
```


# Version Mixin

Enterprise application should always handle concurrency gracefully. There will be always cases where more than one user is updating same record at same time. That cause data inconsistency. For example, let us consider case where there are two requests to increase account balance. One request needs to increase balance by 100 and other request would increase balance by 200. Ideally after both requests are **successfully** processed, Account balance should be increased by 300. Assume that initial balance in account was 500.

Consider following scenario
- Request1 reads balance as 500
- Request2 reads balance as 500
- Request1 update balance to 500+100 = 600 and sets balance to 600
- Request2 updates balance to 500+200 = 700 and sets balance to 700

Both requests are successfully executed but new balance is not right. 

To avoid this, VersionMixin plays important role. 
* Version mixin maintains the version of each record. 
* When record gets updated, _version field changes to new value
* Programmer / caller must always has to pass current version for update operation
* Since for every update version gets change, above issue is prevented. In that scenario, request2 would get error as version mismatch. 


## Using VersionMixin


To use **VersionMixin** you must load this mixin into your application. Usually this happens during boot of the application. There are several ways to configure mixin paths for your application. You can do it declaratively or you can do it pragmatically.

**VersionMixin** creates following properties to Model where it is attached to.

* _version : This property maintains current version of the record.
* _oldVersion : This property maintains previous version of record.
* _newVersion : This property is temporarily used to give newVersion value explicitly by caller


### Loading VersionMixin using model-config.json

Please refer to above section for *AuditFieldMixin** 

### Loading Mixin using app-list.json

Please refer to above section for *AuditFieldMixin** 


### Loading Mixin pragmatically

Please refer to above section for *AuditFieldMixin** 

## Developer Considerations

Version mixin ensures that _version value is given for any update and delete operation. It has changes deleteById http end point by adding version field to it. Therefore, http end point to delete a record would be



# Soft Delete Mixin

In typical Enterprise application, data never gets deleted. Data always invalidated or **soft deleted**. In oeCloud application, when you call model.deleteById or model.destroyAll, oeCloud would **hard** delete data permentantly from database. To avoid that, this mixin functionality comes into picture. If on model, if you have enabled this **SoftDeleteMixin=true**, data from that Model will never gets deleted permanently. Instead, SoftDeleteMixin would maintain a flag named **_isDeleted**. This flag is set to true for the record which is deleted. When user calls .destroyById() or .destroyAll(), this functionality ensures that records are not deleted but they are updated with _isDeleted is set to true for those records.

When application retrieves records using model.find() method, this mixin adds filter _isDeleted = false to ensure that deleted records are never fetched.

## Using SoftDeleteMixin

**SoftDeleteMixin** adds following field to the Model schema

_isDeleted : Default value of this field (or property) is false. When application deletes the record, this value is set to true


## Developer Considerations





### Loading Mixin using model-config.json

Please refer to above section for *AuditFieldMixin** 

### Loading Mixin using app-list.json

Please refer to above section for *AuditFieldMixin** 


### Loading Mixin pragmatically

Please refer to above section for *AuditFieldMixin** 


## Developer Considerations



