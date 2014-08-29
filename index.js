/**
 * Created by kidtronnix on 20/05/14.
 */
var Boom = require('boom');
var Joi = require('joi');
var MongoDB = require('mongodb').Db;
var Server = require('mongodb').Server;
var ObjectId = require('mongodb').ObjectID;
var Extend = require('extend');
var Bcrypt = require('bcryptjs');
var salt = Bcrypt.genSaltSync(10);



module.exports = function(config) {

    // get db from config
    var db = config.db;
    
    var CRUD = {
        conf: function(request, reply) {
            // Return our config
            return reply(JSON.stringify(config)).type('application/json');
        },
        getAll: function(request, reply) {
            var path = request.path.split('/');    
            var find = {};
           
            // Access Control
            if(request.auth.isAuthenticated && request.auth.credentials.access !== 'admin') {
                var uId = request.auth.artifacts.id;
                find.uId = uId;
            }
            
            
            var collection = db
            .collection(path[2]+'s')
            .find(find)
            .sort({ "_id" : 1})
            .toArray(function(err, docs) {
                if (err) throw err;
                return reply(docs).type('application/json');
            });

        },
        create: function(request, reply) {
            
            // Get our specific route config
            var path = request.path.split('/');
            var resource = path[2];

            
            // add access control
            // We need to stop create if not allowed, only if:
            // route is authenticated, we are not admin, and we protect create
            if(request.auth.isAuthenticated && request.auth.credentials.access !== 'admin' && request.auth.credentials.access !== config.accessControl.create) {
                var error = Boom.unauthorized('You are not permitted to create a '+resource);
                return reply(error);
            }
            else {
                var validSchema = config.create;

                // console.log(JSON.stringify(request.payload, null, 4))
                // First validate schema
                // respond with errors 
                Joi.validate(request.payload, validSchema, config.validationOpts, function (err, value) {
                    if(err) {
                        var error = Boom.badRequest(err);
                        return reply(error);   
                    }
                    else {
                        
                        // Add our defaults
                        var insert = Extend({},config.defaults, request.payload);

                        // If config has date option, add a timestamp
                        if(config.date) {
                            var ts = new Date();
                            insert[config.date] = ts;
                        }

                        if(config.bcrypt) {
                            // Hash password before insert
                            insert[config.bcrypt] = Bcrypt.hashSync(insert[config.bcrypt], salt);
                        }
                        

                        // Add uId if set to anything in defaults
                        if(request.auth.isAuthenticated && !(config.defaults === undefined || config.defaults["uId"] === undefined)) {
                            insert.uId = request.auth.artifacts.id;
                        }

                        // Connect to mongo
                        var collection = db.collection(resource+'s');

                        // Perform Insert
                        collection.insert(insert, function(err, docs) {
                            if(err) throw err;
                            return reply(docs[0]).type('application/json');           
                        });         
                    }
                }); 
            }   
        },
        get: function(request, reply) {
            var path = request.path.split('/');
            
                var collection = db
                .collection(path[2]+'s')
                .findOne({"_id": ObjectId(request.params.id)}, function(err, doc) {
                    if(err) throw err;
                    
                    if(doc == null) {
                        var error = Boom.badRequest('No '+path[2]+ ' found');
                        return reply(error);
                    }
                    // access control
                    else if(request.auth.isAuthenticated && request.auth.credentials.access !== 'admin' && doc.uId && doc.uId !== request.auth.artifacts.id) {
                        var error = Boom.unauthorized('You are not permitted to update this');
                        return reply(error);
                    }
                    else {
                        return reply(doc).type('application/json');
                    }                    
                });
            
        },
        update: function(request, reply) {
            // Get our specific route config
            var path = request.path.split('/');
            var resource = path[2];

            // Resource ID from URL
            var resourceId = request.params.id;
            var validSchema = config.update;

            Joi.validate(request.payload, validSchema, config.validationOpts, function (err, value) {
                if(err !== null) {
                    var error = Boom.badRequest(err);
                    return reply(error);
                }
                else {
                    var update = request.payload;

                    if(config.bcrypt && update[config.bcrypt]) {
                        // Hash password before update
                        update[config.bcrypt] = Bcrypt.hashSync(update[config.bcrypt], salt);
                    }

                    // Update Resource with payload
                    var collection = db.collection(resource+'s');

                    // Check doc exists & uId matches doc
                    collection.findOne({"_id": ObjectId(request.params.id)}, function(err, doc) {

                        // doc exists
                        if(doc === null) {
                            var error = Boom.badRequest('No '+path[2]+' found');
                            return reply(error);
                        } 
                        // access control
                        else if(request.auth.isAuthenticated && request.auth.credentials.access !== 'admin' && doc.uId && doc.uId !== request.auth.artifacts.id) {
                            var error = Boom.unauthorized('You are not permitted to update this');
                            return reply(error);
                        }
                        else {
                            collection.update({"_id": ObjectId(resourceId)}, {$set: update}, {}, function(err, doc) {
                                if(err) throw err;
                                return reply({error:null,message:'Updated successfully'});
                            });
                        }
                    })
                }   
            }); 
        },
        del: function(request, reply) {
            var path = request.path.split('/');
            var _del = {"_id": ObjectId(request.params.id)};

            var collection = db.collection(path[2]+'s');
            collection.findOne({"_id": ObjectId(request.params.id)}, function(err, doc) {
                if(doc === null) {
                    var error = Boom.badRequest('No '+path[2]+' found');
                    return reply(error);
                }
                else if(request.auth.isAuthenticated && request.auth.credentials.access !== 'admin' && doc.uId && doc.uId !== request.auth.artifacts.id) {
                    var error = Boom.unauthorized('You are not permitted to delete this');
                    return reply(error);
                }
                else {
                    collection.remove( _del, function(err) {
                        if(err) throw err;
                        return reply({error:null,message:'Deleted successfully'});          
                    });
                }
            });
        }
    };
    return CRUD;
}