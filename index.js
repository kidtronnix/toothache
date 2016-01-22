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

    var baseConfig = {
        create: {
            access: 'normal'
        },
        read: {
            access: 'normal'
        },
        update: {
            access: 'normal'
        },
        del: {
            access: 'normal'
        }
    };

    config = Extend({},baseConfig,config);


    // get db from config
    var db = config.db;
    // get mongo collection
    var coll = config.collection;

    var CRUD = {
        create: function(request, reply) {


            // add access control
            // We need to stop create if not allowed, only if:
            // route is authenticated, we are not admin, and we protect create
            if(request.auth.isAuthenticated && request.auth.credentials.access !== 'admin' && request.auth.credentials.access !== config.create.access) {
                var error = Boom.unauthorized('You do not have create access');
                return reply(error);
            }
            else {
                var validSchema = config.create.payload;

                if(request.method === 'get') {
                    var payload = request.query;
                } else {
                    var payload = request.payload;
                }

                // First validate schema
                // respond with errors
                Joi.validate(payload, validSchema, config.validationOpts, function (err, value) {
                    if(err) {
                        var error = Boom.badRequest(err);
                        return reply(error);
                    }
                    else {

                        // Add our defaults
                        var insert = Extend({},config.create.defaults, payload);

                        // If config has date option, add a timestamp
                        if(config.create.date) {
                            var ts = new Date();
                            insert[config.create.date] = ts;
                        }

                        if(config.create.bcrypt) {
                            // Hash password before insert
                            insert[config.create.bcrypt] = Bcrypt.hashSync(insert[config.create.bcrypt], salt);
                        }


                        // Add uId if set to anything in defaults
                        if(request.auth.isAuthenticated && config.create.defaults["uId"] !== undefined) {
                            insert.uId = request.auth.credentials.id;
                        }

                        // Connect to mongo
                        var collection = db.collection(coll);

                        // Perform Insert
                        collection.insert(insert, function(err, docs) {

                            return reply(docs[0]).type('application/json');
                        });
                    }
                });
            }
        },
        get: function(request, reply) {

            if(request.auth.isAuthenticated && request.auth.credentials.access !== 'admin' && request.auth.credentials.access !== config.read.access) {
                var error = Boom.unauthorized('You do not have read access');
                return reply(error);
            }
            else {
                var collection = db
                .collection(coll)
                .findOne({"_id": ObjectId(request.params.id)}, function(err, doc) {
                    if(doc === null) {
                        var error = Boom.badRequest('No doc found in '+coll);
                        return reply(error);
                    }
                    // access control
                    else if(request.auth.isAuthenticated && request.auth.credentials.access !== 'admin' && doc._id.toString() !== request.auth.credentials.id.toString()) {
                        var error = Boom.unauthorized('You are not permitted to see this');
                        return reply(error);
                    }
                    else {

                        if(config.read.whitelist || config.read.blacklist) {

                            if(config.read.whitelist) {
                                // Add whitelist fields
                                var _doc = {};
                                for(var i = 0; i < config.read.whitelist.length; i++) {
                                    var key = config.read.whitelist[i];
                                    if(doc[key] !== undefined) {
                                        _doc[key] = doc[key];
                                    }
                                }

                                doc = _doc;
                            }
                            if(config.read.blacklist) {
                                // Remove blacklist fields
                                for(var i = 0; i < config.read.blacklist.length; i++) {
                                    var key = config.read.blacklist[i];
                                    delete doc[key];
                                }
                            }
                        }
                        return reply(doc).type('application/json');
                    }
                });
            }


        },
        find: function(request, reply) {
            // console.log(config.read.access)
            if(request.auth.isAuthenticated && request.auth.credentials.access !== 'admin' && request.auth.credentials.access !== config.read.access) {
                var error = Boom.unauthorized('You do not have read access');
                return reply(error);
            }
            else {
                var find = {};

                if(request.method === 'get') {
                    var payload = request.query;
                } else {
                    var payload = request.payload;
                }

                // Add payload to find object
                if(request.payload) {
                    Extend(find, payload);
                }

                // Access Control
                if(request.auth.isAuthenticated && request.auth.credentials.access !== 'admin') {
                    var uId = request.auth.credentials.id;
                    find.uId = uId;
                }



                var collection = db
                .collection(coll)
                .find(find)
                .sort({ "_id" : 1})
                .toArray(function(err, docs) {

                    var _docs = [];
                    if(config.read.whitelist || config.read.blacklist) {

                        for(var i = 0; i < docs.length; i++) {
                            var doc = docs[i];

                            if(config.read.whitelist) {
                                // Add whitelist fields
                                var _doc = {};

                                for(var j = 0; j < config.read.whitelist.length; j++) {
                                    var key = config.read.whitelist[j];
                                    if(doc[key] !== undefined) {
                                        _doc[key] = doc[key];
                                    }


                                }
                                _docs.push(_doc);
                            }
                            if(config.read.blacklist) {
                                // Remove blacklist fields

                                //console.log(config.read.blacklist.length)
                                for(var j = 0; j < config.read.blacklist.length; j++) {
                                    var key = config.read.blacklist[j];

                                    delete doc[key];
                                }
                                _docs.push(doc);
                            }
                        }
                        docs = _docs;

                    }

                    return reply(docs).type('application/json');
                });
            }



        },
        update: function(request, reply) {
            // console.log(config.update.access)
            if(request.auth.isAuthenticated && request.auth.credentials.access !== 'admin' && request.auth.credentials.access !== config.update.access) {
                var error = Boom.unauthorized('You do not have update access');

                return reply(error);
            }
            else {
                // Resource ID from URL
                var resourceId = request.params.id;
                var validSchema = config.update.payload;

                if(request.method === 'get') {
                    var payload = request.query;
                } else {
                    var payload = request.payload;
                }

                Joi.validate(payload, validSchema, config.validationOpts, function (err, value) {
                    if(err !== null) {
                        var error = Boom.badRequest(err);
                        return reply(error);
                    }
                    else {
                        var update = payload;

                        if(config.update.bcrypt && update[config.update.bcrypt]) {
                            // Hash password before update
                            update[config.update.bcrypt] = Bcrypt.hashSync(update[config.update.bcrypt], salt);
                        }
                        if(config.update.date) {
                            var ts = new Date();
                            update[config.update.date] = ts;
                        }

                        // Update Resource with payload
                        var collection = db.collection(coll);

                        // Check doc exists & uId matches doc
                        collection.findOne({"_id": ObjectId(request.params.id)}, function(err, doc) {

                            // doc exists
                            if(doc === null) {
                                var error = Boom.badRequest('No doc found in '+coll);
                                return reply(error);
                            }
                            // access control
                            else if(request.auth.isAuthenticated && request.auth.credentials.access !== 'admin' && doc._id.toString() !== request.auth.credentials.id.toString()) {
                                var error = Boom.unauthorized('You are not permitted to update this');
                                return reply(error);
                            }
                            else {
                                collection.update({"_id": ObjectId(resourceId)}, {$set: update}, {}, function(err, doc) {

                                    return reply({error:null,message:'Updated successfully'});
                                });
                            }
                        });
                    }
                });
            }

        },
        del: function(request, reply) {
            if(request.auth.isAuthenticated && request.auth.credentials.access !== 'admin' && request.auth.credentials.access !== config.del.access) {
                var error = Boom.unauthorized('You do not have delete access');
                return reply(error);
            } else {
                var _del = {"_id": ObjectId(request.params.id)};

                var collection = db.collection(coll);
                collection.findOne({"_id": ObjectId(request.params.id)}, function(err, doc) {
                    if(doc === null) {
                        var error = Boom.badRequest('No doc found in '+coll);
                        return reply(error);
                    }
                    else if(request.auth.isAuthenticated && request.auth.credentials.access !== 'admin' && doc._id.toString() !== request.auth.credentials.id.toString()) {
                        var error = Boom.unauthorized('You are not permitted to delete this');
                        return reply(error);
                    }
                    else {
                        collection.remove( _del, function(err) {

                            return reply({error:null,message:'Deleted successfully'});
                        });
                    }
                });
            }
        }
    };
    return CRUD;
};
