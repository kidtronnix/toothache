Toothache
---------

A Hapi plugin that removes the toothache from creating CRUD endpoints for MongoDB.

Current version: **1.0.x** [![Build Status](https://travis-ci.org/smaxwellstewart/toothache.svg?branch=master)](https://travis-ci.org/smaxwellstewart/toothache) [![Coverage Status](https://img.shields.io/coveralls/smaxwellstewart/toothache.svg)](https://coveralls.io/r/smaxwellstewart/toothache?branch=master)

## What is this plugin?

This plugin instantly adds the following functionality to any mongo db...

* Plug 'n' play CRUD Routes
* Set custom fields to bcrypt and/or timestamp at doc creation, if required
* Access control of resources.

## Usage

The below is intended to be added into a hapi plugin. In our example case, we will make a `User` endpoint for a Hapi server.

### Configure

Configure toothache with desired behaviour... 

```js
// User model
var CRUD = {
    db: db,                 // MongoDB connection
    collection: 'users',    // MongoDB collection
    // Create options
    create: {
        // Valid create payload 
        payload: Joi.object().keys({ 
            email: Joi.string().required(),
            password: Joi.string().required()
        }),                 
        defaults: {         // Default values that will be added at doc creation
            access: 'normal',
            activated: false,
            uId: true       // Field used for access control. This is a special field that when set to true will default to user's id 
                            // The value comes from, 'request.auth.artifacts.id' ie the id the user authenticates with
        },
        bcrypt: 'password', // Sets 'password' field to be bcrypted at doc creation
        date: 'created',    // Sets 'created' field to be dated at doc creation
        access: "admin"     // Sets which role can create 
    },
    // Read options for get and find
    read: {
        whitelist: ['email'],   // Array of fields that will be returned, all other fields will be excluded 
        blacklist: ['password'], // Array of fields that will be removed, all other fields will be included
        access: 'normal'        // Sets which role can read 
    }
    // Update options
    update: {
        // Valid update payload
        payload: Joi.object().keys({
            email: Joi.string(),
            password: Joi.string()
        }), 
        bcrypt: 'password', // Sets 'password' field to be bcrypted at doc update
        date: 'updated',    // Sets 'updated' field to be dated at doc update
        access: 'normal' // Sets which role can update  
    },
    // Delete options
    delete: {
        access: 'normal' // Sets which role can update 
    },
    // Joi options when validating payloads    
    validationOpts: {
        abortEarly: false
    }
    
};

var User = require('toothache')(CRUD);
```

### Request Handlers

Once we have configured toothache, the following request handlers will be exposed:

#### `User.create`
 - This handler will insert any supplied `payload` into MongoDB.
 - Accepted methods: `GET` with `payload` in URL or, `POST` or `PUT` with `payload` in request body.
 - The following toothache `options` will affect this handler:
  - `db` - MongoDB connection object, connection [example](https://gist.github.com/smaxwellstewart/9cf26df20cb58a3f5d02). 
  - 'collection' - the MongoDB collection to create, read, update and delete from.
  - `create.payload` - [Joi](https://github.com/hapijs/joi) object payload is validated against.
  - `create.defaults` - Object of default fields, the payload will extend this object before insertion, 
  e.g. supplied payload will join and override this default object.
  - `create.bcrypt` - Field name of `payload` field to be bcrypted before doc creation.
  - `create.date` - Will add a javasctipt `new Date()` timestamp to field name at doc creation.
  - `create.access` - If set to `admin` only admin users will be able to create a doc. If set to normal, both admin and normal users have create access.

#### `User.get`
 - This handler will return an individual MongoDB document.
 - Accepted methods: `GET` with an `id` parameter set in route's `path` field.
 - The following toothache `options` will affect this handler:
  - `read.whitelist` - Array of fields that will be returned when doc is fetched.
  - `read.blacklist` - Array of fields that will be excluded when doc is fetched. Not recommened to be set with `read.whitelist`.
  - `read.access` - If set to `admin` only admin users will be able to read a doc. If set to normal, both admin and normal users have read access.
#### `User.find`
 - This handler will return an array of MongoDB documents. The search will query with a supplied `payload`, if none is supplied will return all docs. For normal users
 - Accepted methods: `GET` with `payload` in URL or, `POST` or `PUT` with `payload` in request body.
 - The following toothache `options` will affect this handler:
  - `read.whitelist` - Array of fields that will be returned when docs are fetched.
  - `read.blacklist` - Array of fields that will be excluded when docs are fetched. Not recommened to be set with `read.whitelist`.
  - `read.access` - If set to `admin` only admin users will be able to read a doc. If set to normal, both admin and normal users have read
#### `User.update`
 - This route will update a doc with any supplied `payload`. The handler expects an `id` parameter to be set in route's `path` field.
 - Accepted methods: `GET` with `payload` in URL or, `POST` or `PUT` with `payload` in request body.
 - The following toothache `options` will affect this handler:
  - `update.payload` - [Joi](https://github.com/hapijs/joi) object payload is validated against.
  e.g. supplied payload will join and override this default object.
  - `update.bcrypt` - Field name of `payload` field to be bcrypted when doc is updated.
  - `update.date` - Will add a javasctipt `new Date()` timestamp to field name when doc is updated.
  - `update.access` - If set to `admin` only admin users will be able to update a doc. If set to normal, both admin and normal users have update access. 

#### `User.del`
 - This route will delete a doc with any supplied `payload`.
 - Accepted methods: `GET` with an `id` parameter set in route's `path` field.
 - The following toothache `options` will affect this handler:
  - `delete.access` - If set to `admin` only admin users will be able to delete a doc. If set to normal, both admin and normal users have delete access. 

*Example*

These can be used in a Hapi plugin like this...

```js
// Create
plugin.route({
    method: 'POST', path: '/api/user',
    config: {
        handler: User.create
    }
});

// Get a resource, must use 'id' parameter to refer to mongo's '_id' field
plugin.route({
    method: 'GET', path: '/user/{id}',
    config: {
        handler: User.get
    }
});

// Get All
plugin.route({
    method: 'GET', path: '/user',
    config: {
        handler: User.find
    }
});

// Find, will search collection using payload for criteria
plugin.route({
    method: 'POST', path: '/user/find',
    config: {
        handler: User.find
    }
});

// Update, must use 'id' parameter to refer to mongo's '_id' field
plugin.route({
    method: 'PUT', path: '/user/{id}',
    config: {
        handler: User.update
    }
});

// Delete, must use 'id' parameter to refer to mongo's '_id' field
plugin.route({
    method: 'DELETE', path: '/user/{id}',
    config: {
        handler: User.del
    }
});
```

### Access Control

#### Roles
 - `admin`
 - `normal`


Access control is only added if a route is authenticated. An `access` field must be added to user's credentials at authentication. For example:

```js
// Example: Hawk Auth Lookup
getCredentialsFunc: function (id, callback) {
    var credentials = {
        user1: {
            key: 'pass1',
            access: 'admin',
            algorithm: 'sha256'
        },
        user2: {
            key: 'pass2',
            access: 'normal',
            algorithm: 'sha256'
        }
    }
    return callback(null, credentials[id]);
}
```

 - Admin users get access to all resources, they can create, read, update and delete.
 - Normal users only have access to their own resources, they can only CRUD documents that have a `uId` equal to user's authenitcation id (`request.auth.artifacts.id`)

