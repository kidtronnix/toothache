var Lab = require("lab"),
    Hapi = require("hapi"),
    Joi = require("joi"),
    Hawk = require("hawk"),
    MongoDB = require('mongodb').Db,
    Server = require('mongodb').Server,
    ObjectId = require('mongodb').ObjectID,
    Bcrypt = require('bcryptjs');


// Test shortcuts
var lab = exports.lab = Lab.script();
var before = lab.before;
var beforeEach = lab.beforeEach;
var after = lab.after;
var describe = lab.describe;
var it = lab.it;
var expect = Lab.expect;

var credentials = {
    admin: {
        id: "user1",
        key: "pass1",
        algorithm: 'sha256'
    },
    normal: {
        id: "user2",
        key: "pass2",
        algorithm: 'sha256'
    }
}

var CRUD = {
    collection: 'resources',
    create: {
        payload: Joi.object().keys({
            field: Joi.string().required(),
        }),
        defaults: {
            uId: true
        },
        access: 'admin'
    },
    update: {
        payload: Joi.object().keys({
            field: Joi.string()
        })
    },    
    validationOpts: {
        abortEarly: false
    }
};

describe("Toothache", function() {

    var server;

    beforeEach(function (done) {
        server = new Hapi.Server();
        var MongoClient = require('mongodb').MongoClient
        MongoClient.connect('mongodb://127.0.0.1:27017/test', function(err, db) {
            expect(err).to.not.exist;
            
            // User config stuff
            CRUD.db = db;
            // Construct User CRUD
            var Resource = require('../')(CRUD);


            server.pack.register([
                {
                    name: 'hawk-auth',
                    plugin: require('hapi-auth-hawk')
                }
            ], function(err) {
                if (err) throw err;
                server.auth.strategy('web', 'hawk',
                {
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
                });


                // Get all resources
                server.route({
                    method: 'GET', path: '/api/resource',
                    config: {
                        auth: 'web',
                        handler: Resource.getAll
                    }
                });

                // Get a resource
                server.route({
                    method: 'GET', path: '/api/resource/{id}',
                    config: {
                        auth: 'web',
                        handler: Resource.get
                    }
                });

                // Update
                server.route({
                    method: 'PUT', path: '/api/resource/{id}',
                    config: {
                        auth: 'web',
                        handler: Resource.update
                    }
                });

                // Delete
                server.route({
                    method: 'DELETE', path: '/api/resource/{id}',
                    config: {
                        auth: 'web',
                        handler: Resource.del
                    }
                });

                done();
            });  
        })
    }); // Done with before

    
    it("admin can create admin protected resource", function(done) {
        var Resource = require('../')(CRUD);
         // Create
        server.route({
            method: 'POST', path: '/api/resource',
            config: {
                auth: 'web',
                handler: Resource.create
            }
        });

        var payload = {
            field: "some value"
        };

        var options = {
            method: "POST",
            url: "http://localhost.com/api/resource",
            payload: JSON.stringify(payload),
            headers: {}
        };

        var counter = 0;
        
        // Add auth
        var header = Hawk.client.header(options.url, options.method, { credentials: credentials.admin });
        options.headers.Authorization = header.field;

        server.inject(options, function(response) {
            var result = response.result;
            
            expect(response.statusCode).to.equal(200);
            expect(result).to.be.instanceof(Object);
            expect(result.uId).to.equal(credentials.admin.id);
            
            done()
        });

        server.inject(options, function(response) {});
        server.inject(options, function(response) {});
    });

    it("non-admin can't create admin protected resource", function(done) {
        var Resource = require('../')(CRUD);
         // Create
        server.route({
            method: 'POST', path: '/api/resource',
            config: {
                auth: 'web',
                handler: Resource.create
            }
        });

        var payload = {
            field: "some value"
        };

        var options = {
            method: "POST",
            url: "http://localhost.com/api/resource",
            payload: JSON.stringify(payload),
            headers: {}
        };

        var counter = 0;
        
        // Add auth
        var header = Hawk.client.header(options.url, options.method, { credentials: credentials.normal });
        options.headers.Authorization = header.field;

        server.inject(options, function(response) {
            var result = response.result;
            
            expect(response.statusCode).to.equal(401);
            expect(result).to.be.instanceof(Object);
            expect(result.message).to.equal("You are not permitted to insert into resources");
            
            done();
        });
    })

    it("normal user can create normal protected resource", function(done) {

        CRUD.create.access = 'normal';
        var Resource = require('../')(CRUD);
         // Create
        server.route({
            method: 'POST', path: '/api/resource',
            config: {
                auth: 'web',
                handler: Resource.create
            }
        });

        var payload = {
            field: "some value"
        };

        var options = {
            method: "POST",
            url: "http://localhost.com/api/resource",
            payload: JSON.stringify(payload),
            headers: {}
        };

        var counter = 0;
        
        // Add auth
        var header = Hawk.client.header(options.url, options.method, { credentials: credentials.normal });
        options.headers.Authorization = header.field;

        server.inject(options, function(response) {
            var result = response.result;
            
            expect(response.statusCode).to.equal(200);
            expect(result).to.be.instanceof(Object);
            expect(result.uId).to.equal(credentials.normal.id);
            
            done()
        });

        server.inject(options, function(response) {})
    })
    
    it("admin user gets all resources", function(done) {
        var options = {
            method: "GET",
            url: "http://localhost.com/api/resource",
            headers: {}
        };
        // Add auth
        var header = Hawk.client.header(options.url, options.method, { credentials: credentials.admin });
        options.headers.Authorization = header.field;

        server.inject(options, function(response) {
            var result = response.result;
            
            expect(response.statusCode).to.equal(200);
            expect(result).to.be.instanceof(Array);
            expect(result).to.have.length(5);
            
            done()
        });
    });

    it("normal user gets some but not all resources", function(done) {
        var options = {
            method: "GET",
            url: "http://localhost.com/api/resource",
            headers: {}
        };
        // Add auth
        var header = Hawk.client.header(options.url, options.method, { credentials: credentials.normal });
        options.headers.Authorization = header.field;

        server.inject(options, function(response) {
            var result = response.result;
            
            expect(response.statusCode).to.equal(200);
            expect(result).to.be.instanceof(Array);
            expect(result).to.have.length(2);
            
            done()
        });
    });

    it("normal user can't access other user's resource", function(done) {
        var options = {
            method: "GET",
            url: "http://localhost.com/api/resource",
            headers: {}
        };
        // Add auth
        var header = Hawk.client.header(options.url, options.method, { credentials: credentials.admin });
        options.headers.Authorization = header.field;

        server.inject(options, function(response) {
            var result = response.result;
            var options = {
                method: "GET",
                url: "http://localhost.com/api/resource/"+result[0]._id,
                headers: {}
            };
            // Add auth
            var header = Hawk.client.header(options.url, options.method, { credentials: credentials.normal });
            options.headers.Authorization = header.field;

            server.inject(options, function(response) {
                var result = response.result;

                expect(response.statusCode).to.equal(401);
                expect(result).to.be.instanceof(Object);
                expect(result.message).to.equal("You are not permitted to see this");
                
                done();
            })  
        });
    });

    it("normal user can't update other user's resource", function(done) {
        var options = {
            method: "GET",
            url: "http://localhost.com/api/resource",
            headers: {}
        };
        // Add auth
        var header = Hawk.client.header(options.url, options.method, { credentials: credentials.admin });
        options.headers.Authorization = header.field;

        server.inject(options, function(response) {
            var result = response.result;
            var payload = {
                field: "some value"
            };

            var options = {
                method: "PUT",
                url: "http://localhost.com/api/resource/"+result[0]._id,
                payload: JSON.stringify(payload),
                headers: {}
            };
            // Add auth
            var header = Hawk.client.header(options.url, options.method, { credentials: credentials.normal });
            options.headers.Authorization = header.field;

            server.inject(options, function(response) {
                var result = response.result;

                expect(response.statusCode).to.equal(401);
                expect(result).to.be.instanceof(Object);
                expect(result.message).to.equal("You are not permitted to update this");
                
                done();
            })  
        });
    });

    it("normal user can't delete other user's resource", function(done) {
        var options = {
            method: "GET",
            url: "http://localhost.com/api/resource",
            headers: {}
        };
        // Add auth
        var header = Hawk.client.header(options.url, options.method, { credentials: credentials.admin });
        options.headers.Authorization = header.field;

        server.inject(options, function(response) {
            var result = response.result;
            var options = {
                method: "DELETE",
                url: "http://localhost.com/api/resource/"+result[0]._id,
                headers: {}
            };
            // Add auth
            var header = Hawk.client.header(options.url, options.method, { credentials: credentials.normal });
            options.headers.Authorization = header.field;

            server.inject(options, function(response) {
                var result = response.result;

                expect(response.statusCode).to.equal(401);
                expect(result).to.be.instanceof(Object);
                expect(result.message).to.equal("You are not permitted to delete this");
                
                done();
            })  
        });
    });

    

});