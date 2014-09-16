Toothache
---------

A Hapi plugin that removes the toothache from creating CRUD endpoints for MongoDB.

Current version: **1.0.x** [![Build Status](https://travis-ci.org/smaxwellstewart/toothache.svg?branch=master)](https://travis-ci.org/smaxwellstewart/toothache) [![Coverage Status](https://coveralls.io/repos/smaxwellstewart/toothache/badge.png)](https://coveralls.io/r/smaxwellstewart/toothache)

### What is this plugin?

This plugin instantly adds the following functionality to any mongo db...

* Plug 'n' play CRUD Routes
* Set custom fields to bcrypt and/or timestamp at doc creation, if required
* Access control of resources.

### Usage

The below is intended to be added into a hapi plugin. In our example case, we will make a `User` endpoint for a Hapi server.

##### Configure

Configure toothache with desired behaviour... 

```js
// User model
var CRUD = {
    db: db,                 // MongoDB connection
    collection: 'users',    // MongoDB connection
    // Create options
    create: {
        bcrypt: 'password', // Sets 'password' field to be bcrypted at doc creation
        date: 'created',    // Sets 'created' field to be dated at doc creation
        payload: Joi.object().keys({ 
            email: Joi.string().required(),
            password: Joi.string().required()
        }),                 // Valid create payload 
        defaults: {         // Default values that will be added at doc creation
            access: 'normal',
            activated: false,
            uId: true       // Field used for access control. This is a special field that when set to true will default to user's id 
                            // The value comes from, 'request.auth.artifacts.id' ie the id the user authenticates with
        },
        access: "admin"     // Sets which role can create 
    },
    // Read options for get and find
    read: {
        whitelist: ['email'],   // Array of fields that will be returned, all other fields will be excluded 
        blacklist: ['password'] // Array of fields that will be removed, all other fields will be included
    }
    // Update options
    update: {
        bcrypt: 'password', // Sets 'password' field to be bcrypted at doc update
        date: 'updated',    // Sets 'updated' field to be dated at doc update
        payload: Joi.object().keys({
            email: Joi.string(),
            password: Joi.string()
        }) // Valid update payload 
    },
    // Joi options when validating payloads    
    validationOpts: {
        abortEarly: false
    }
    
};

var User = require('toothache')(CRUD);
```

##### Add Routes

Once we have configured toothache, we have the following CRUD request handlers will be exposed:

* User.create
* User.get
* User.find
* User.update
* User.del

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
    method: 'GET', path: '/api/user/{id}',
    config: {
        handler: User.get
    }
});

// Get All
plugin.route({
    method: 'GET', path: '/api/user',
    config: {
        handler: User.find
    }
});

// Find, will search collection using payload for criteria
plugin.route({
    method: 'POST', path: '/api/user/find',
    config: {
        handler: User.find
    }
});

// Update, must use 'id' parameter to refer to mongo's '_id' field
plugin.route({
    method: 'PUT', path: '/api/user/{id}',
    config: {
        handler: User.update
    }
});

// Delete, must use 'id' parameter to refer to mongo's '_id' field
plugin.route({
    method: 'DELETE', path: '/api/user/{id}',
    config: {
        handler: User.del
    }
});
```

### Access Control

Access control is only added if a route is authenticated. An `access` field must be added to user's credentials at authentication. For example:

```js
getCredentialsFunc: function (id, callback) {
    // Core creds
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

