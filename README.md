Toothache
---------

A Hapi plugin that removes the toothache from creating CRUD endpoints for MongoDB.

Current version: **0.1.x** [![Build Status](https://travis-ci.org/smaxwellstewart/toothache.svg?branch=master)](https://travis-ci.org/smaxwellstewart/toothache)

### What is this plugin?

This plugin instantly adds the following functionality to any mongo db...

* Plug 'n' play CRUD Routes
* Set custom fields to bcrypt and/or timestamp at doc creation, if required
* Access control of resources. (beta feature)

### Usage

The below is intended to be added into a hapi plugin. In our example case, we will make a `User` endpoint for a Hapi server.

##### Configure

Configure toothache with desired behaviour... 

```js
var CRUD = {
    // Mongo collection
    collection: 'resources',
    // Create options
    create: {
        // Sets 'password' field to be bcrypted at doc creation
        bcrypt: 'password',
        // Sets 'created' field to be dated at doc creation
        date: 'created',
        // Valid create payload 
        payload: Joi.object().keys({
            email: Joi.string().required(),
            password: Joi.string().required()
        }),
        // Default values that will be added at doc creation
        defaults: {
            access: 'normal',
            activated: false
        },
        // Sets which role can create 
        access: "admin"
    },
    // Update options
    update: {
        // Sets 'password' field to be bcrypted at doc creation
        bcrypt: 'password',
        // Sets 'updated' field to be dated at doc creation
        date: 'updated',
        // Valid create payload 
        payload: Joi.object().keys({
            email: Joi.string(),
            password: Joi.string()
        })
    },
    // Joi options when validating payloads    
    validationOpts: {
        abortEarly: false
    },
    // MongoDB connection
    db: db
};

var User = require('toothache')(CRUD);
```

##### Add Routes

Once we have configured toothache, we have the following CRUD functions exposed:

* User.create
* User.get
* User.getAll
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

// Get a resource
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
        handler: User.getAll
    }
});

// Update
plugin.route({
    method: 'PUT', path: '/api/user/{id}',
    config: {
        handler: User.update
    }
});

// Delete
plugin.route({
    method: 'DELETE', path: '/api/user/{id}',
    config: {
        handler: User.del
    }
});
```


