Toothache
---------

A Hapi plugin that removes the toothache from creating CRUD endpoints for MongoDB.

Current version: **0.0.x** [![Build Status](https://travis-ci.org/smaxwellstewart/toothache.svg?branch=master)](https://travis-ci.org/smaxwellstewart/toothache)

### What is this plugin?

This plugin instantly adds the following functionality to any mongo db...

* Plug 'n' play CRUD Routes
* Set custom fields to bcrypt and/or timestamp at doc creation, if required
* Access control of resources. (beta feature)

### Usage

The below is intended to be added into a hapi plugin. In our example case, we will make a User endpoint for hapi

##### Configure

Configure toothache with desired behaviour... 

```js
var CRUD: {
	// Sets 'password' field to be bcrypted
    bcrypt: 'password',
    // Valid create payload 
    create: Joi.object().keys({ 
        email: Joi.string().required(),
        password: Joi.string().required()
    }),
    // Valid update payload
    update: Joi.object().keys({
        email: Joi.string(),
        password: Joi.string()
    }),
    // Default values that will be added at doc creation
    defaults: {
        access: 'normal',
        activated: false
    },
    // Joi options when validating payloads
    validationOpts: {
        abortEarly: false
    },
    // MongoDB connection
	db: db
}
var Toothache = require('toothache')(CRUD);
```

##### Add Routes

Once we have configured Toothache, we have the following CRUD functions exposed:

* Toothache.create
* Toothache.get
* Toothache.getAll
* Toothache.update
* Toothache.del

These can be used in a Hapi plugin like this...

```js
// Get All
plugin.route({
    method: 'GET', path: '/api/resource',
    config: {
        handler: Toothache.getAll
    }
});

// Create
plugin.route({
    method: 'POST', path: '/api/resource',
    config: {
        handler: Toothache.create
    }
});

// Get a resource
plugin.route({
    method: 'GET', path: '/api/resource/{id}',
    config: {
        handler: Toothache.get
    }
});

// Update
plugin.route({
    method: 'PUT', path: '/api/resource/{id}',
    config: {
        handler: Toothache.update
    }
});

// Delete
plugin.route({
    method: 'DELETE', path: '/api/resource/{id}',
    config: {
        handler: Toothache.del
    }
});
```


