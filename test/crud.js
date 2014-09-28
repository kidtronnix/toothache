var Lab = require("lab"),
	Hapi = require("hapi"),
	Joi = require("joi"),
	MongoDB = require('mongodb').Db,
	Server = require('mongodb').Server,
	ObjectId = require('mongodb').ObjectID,
    Bcrypt = require('bcryptjs'),
    qs = require("querystring");

// Internal config stuff
var CRUD = {
    collection: 'resources2',
    create: {
        bcrypt: 'password',
        date: 'created',
        payload: Joi.object().keys({
            email: Joi.string().required(),
            password: Joi.string().required()
        }),
        defaults: {
            access: 'normal',
            activated: false
        },
    },
    update: {
        bcrypt: 'password',
        date: 'updated',
        payload: Joi.object().keys({
            email: Joi.string(),
            password: Joi.string()
        })
    },    
    validationOpts: {
        abortEarly: false
    }
};


// Test shortcuts
var lab = exports.lab = Lab.script();
var before = lab.before;
var after = lab.after;
var describe = lab.describe;
var it = lab.it;
var expect = Lab.expect;

describe("Toothache", function() {

	var server = new Hapi.Server();

    before(function (done) {
        var MongoClient = require('mongodb').MongoClient
        MongoClient.connect('mongodb://127.0.0.1:27017/test', function(err, db) {
            expect(err).to.not.exist;
            
            // Construct Resource
            CRUD.db = db;
            var Resource = require('../')(CRUD);

            // Get All
            server.route({
                method: 'GET', path: '/api/resource',
                config: {
                    handler: Resource.find
                }
            });

            // Create
            server.route({
                method: 'POST', path: '/api/resource',
                config: {
                    handler: Resource.create
                }
            });

            server.route({
                method: 'GET', path: '/api/resource/create',
                config: {
                    handler: Resource.create
                }
            });

            // Get a resource
            server.route({
                method: 'GET', path: '/api/resource/{id}',
                config: {
                    handler: Resource.get
                }
            });

            // Find
            server.route({
                method: 'POST', path: '/api/resource/find',
                config: {
                    handler: Resource.find
                }
            });

            // Update
            server.route({
                method: 'PUT', path: '/api/resource/{id}',
                config: {
                    handler: Resource.update
                }
            });

            server.route({
                method: 'GET', path: '/api/resource/{id}/update',
                config: {
                    handler: Resource.update
                }
            });

            // Delete
            server.route({
                method: 'DELETE', path: '/api/resource/{id}',
                config: {
                    handler: Resource.del
                }
            });
            
            done();
            
        })
    }); // Done with before

    it("creates a resource from POST", function(done) {
        var payload = {
            email: "test@test.com",
            password: "newpass"
        };

        var options = {
            method: "POST",
            url: "/api/resource",
            payload: JSON.stringify(payload)
        };

        server.inject(options, function(response) {
            var result = response.result;
            
            expect(response.statusCode).to.equal(200);
            expect(result).to.be.instanceof(Object);
            expect(result.access).to.equal('normal');
            expect(result.activated).to.equal(false);
            expect(result.created).to.be.instanceof(Date);
            // Test password was bcrypted correctly
            var validPass = Bcrypt.compareSync(payload.password, result.password);
            expect(validPass).to.equal(true);

            done();
        });
    })

    it("creates a resource from GET", function(done) {
        var payload = {
            email: "test3@test.com",
            password: "newpass3"
        };

        var options = {
            method: "GET",
            url: "/api/resource/create?"+qs.stringify(payload),
            payload: JSON.stringify(payload)
        };

        server.inject(options, function(response) {
            var result = response.result;
            
            expect(response.statusCode).to.equal(200);
            expect(result).to.be.instanceof(Object);
            expect(result.access).to.equal('normal');
            expect(result.activated).to.equal(false);
            expect(result.created).to.be.instanceof(Date);
            // Test password was bcrypted correctly
            var validPass = Bcrypt.compareSync(payload.password, result.password);
            expect(validPass).to.equal(true);

            done();
        });
    })

    it("lists all resources", function(done) {

        server.inject("/api/resource", function(response) {
            var result = response.result;
            
            expect(response.statusCode).to.equal(200);
            expect(result).to.be.instanceof(Array);
            // expect(result).to.have.length(1);

            done();
        });
    });

    it("get a resource", function(done) {
        // Get all resources
        server.inject("/api/resource", function(response) {
            var result = response.result;
            server.inject("/api/resource/"+result[0]._id, function(response) {
                var result = response.result;
                expect(response.statusCode).to.equal(200);
                expect(result).to.be.instanceof(Object);
                // expect(result).to.have.length(1);

                done();
            });
        });
    });

    it("update a resource from POST", function(done) {
        // Get all resources
        server.inject("/api/resource", function(response) {
            var result = response.result;
            var payload = {
                email: "test2@test.com",
                password: "newpass2"
            };

            var options = {
                method: "PUT",
                url: "/api/resource/"+result[0]._id,
                payload: JSON.stringify(payload)
            };
            // Update resource
            server.inject(options, function(response) {
                var result = response.result;

                expect(response.statusCode).to.equal(200);
                expect(result).to.be.instanceof(Object);
                expect(result.message).to.equal('Updated successfully');

                // Get updated resource
                server.inject(options.url, function(response) {
                    var result = response.result;

                    expect(result.email).to.equal(payload.email);
                    expect(result.updated).to.be.instanceof(Date);
                    
                    // Test password was bcrypted correctly
                    var validPass = Bcrypt.compareSync(payload.password, result.password);
                    expect(validPass).to.equal(true);

                    done();
                })           
            });
        });
    });

    it("update a resource from GET", function(done) {
        // Get all resources
        server.inject("/api/resource", function(response) {
            var result = response.result;
            var payload = {
                email: "test2@test.com",
                password: "newpass2"
            };

            var options = {
                method: "GET",
                url: "/api/resource/"+result[0]._id+"/update?"+qs.stringify(payload),
                payload: JSON.stringify(payload)
            };
            // Update resource
            server.inject(options, function(response) {
                var result = response.result;

                expect(response.statusCode).to.equal(200);
                expect(result).to.be.instanceof(Object);
                expect(result.message).to.equal('Updated successfully');

                // Get updated resource
                server.inject(options.url, function(response) {
                    var result = response.result;

                    expect(result.email).to.equal(payload.email);
                    expect(result.updated).to.be.instanceof(Date);
                    
                    // Test password was bcrypted correctly
                    var validPass = Bcrypt.compareSync(payload.password, result.password);
                    expect(validPass).to.equal(true);

                    done();
                })           
            });
        });
    });

    it("delete a resource", function(done) {
        // Get all resources
        server.inject("/api/resource", function(response) {
            var result = response.result;
            var options = {
                method: "DELETE",
                url: "/api/resource/"+result[0]._id
            };
            server.inject(options, function(response) {
                var result = response.result;
                expect(response.statusCode).to.equal(200);
                expect(result).to.be.instanceof(Object);
                expect(result.message).to.equal('Deleted successfully');
                
                done();
            });
        });
    });

    it("finds a resource based on payload", function(done) {

        // Insert 2 resources
        for(var i = 1; i < 3; i++) {
            var payload = {
                email: "test"+i+"@acme.com",
                password: "newpass"
            };

            var options = {
                method: "POST",
                url: "/api/resource",
                payload: JSON.stringify(payload)
            };

            server.inject(options, function(response) {})
        }

        var payload = {
            email: "test1@acme.com"
        };

        var options = {
            method: "POST",
            url: "/api/resource/find",
            payload: JSON.stringify(payload)
        };

        server.inject(options, function(response) {
            var result = response.result;
            
            expect(response.statusCode).to.equal(200);
            expect(result).to.be.instanceof(Array);
            expect(result).to.have.length(1);

            done();
        });            
    });

    it("whitelist filters fields for multiple docs", function(done) {
        CRUD.read = {
            whitelist: ['_id','email']
        };

        var Resource = require('../')(CRUD);

        // Get All
        server.route({
            method: 'GET', path: '/api/resource/whitelist',
            config: {
                handler: Resource.find
            }
        });

        server.inject('/api/resource/whitelist', function(response) {
            var result = response.result;
            
            expect(response.statusCode).to.equal(200);
            expect(result[0]).to.be.instanceof(Object);
            expect(typeof result[0].email).to.equal('string');
            expect(result[0].password).to.not.exist;
            

            done();
        });
    })

    it("whitelist filters fields for multiple docs", function(done) {
        CRUD.read = {
            whitelist: ['_id','email','boom']
        };

        var Resource = require('../')(CRUD);

        // Get All
        server.route({
            method: 'GET', path: '/api/resource/whitelist2',
            config: {
                handler: Resource.find
            }
        });

        server.inject('/api/resource/whitelist2', function(response) {
            var result = response.result;
            
            expect(response.statusCode).to.equal(200);
            expect(result[0]).to.be.instanceof(Object);
            expect(typeof result[0].email).to.equal('string');
            expect(result[0].password).to.not.exist;
            expect(result[0].boom).to.not.exist;

            done();
        });
    })

    it("whitelist filters fields for ind doc", function(done) {
        CRUD.read = {
            whitelist: ['_id','email']
        };

        var Resource = require('../')(CRUD);

        // Get All
        server.route({
            method: 'GET', path: '/api/resource/{id}/whitelist',
            config: {
                handler: Resource.get
            }
        });

        server.inject('/api/resource', function(response) {
            var id = response.result[0]['_id'];
            
            server.inject('/api/resource/'+id+'/whitelist', function(response) {
                var result = response.result;
                
                expect(response.statusCode).to.equal(200);
                expect(result).to.be.instanceof(Object);
                expect(typeof result.email).to.equal('string');
                expect(result.password).to.not.exist;
                
                done();
            })
            
        });
    });

    it("whitelist doesn't add undefined fields for ind doc", function(done) {
        CRUD.read = {
            whitelist: ['_id','email','boom']
        };

        var Resource = require('../')(CRUD);

        // Get All
        server.route({
            method: 'GET', path: '/api/resource/{id}/wlist',
            config: {
                handler: Resource.get
            }
        });

        server.inject('/api/resource', function(response) {
            var id = response.result[0]['_id'];
            
            server.inject('/api/resource/'+id+'/wlist', function(response) {
                var result = response.result;
                
                expect(response.statusCode).to.equal(200);
                expect(result).to.be.instanceof(Object);
                expect(typeof result.email).to.equal('string');
                expect(result.password).to.not.exist;
                expect(result.boom).to.not.exist;

                done();
            })
            
        });
    })

    it("blacklist filters fields for multiple docs", function(done) {
        CRUD.read = {
            blacklist: ['password']
        };

        var Resource = require('../')(CRUD);

        // Get All
        server.route({
            method: 'GET', path: '/api/resource/blacklist',
            config: {
                handler: Resource.find
            }
        });

        server.inject('/api/resource/blacklist', function(response) {
            var result = response.result;
            
            expect(response.statusCode).to.equal(200);
            expect(result[0]).to.be.instanceof(Object);
            expect(typeof result[0].email).to.equal('string');
            expect(result[0].password).to.not.exist;
            

            done();
        });
    })

    it("blacklist filters fields for ind doc", function(done) {
        CRUD.read = {
            blacklist: ['password']
        };

        var Resource = require('../')(CRUD);

        // Get All
        server.route({
            method: 'GET', path: '/api/resource/{id}/blacklist',
            config: {
                handler: Resource.get
            }
        });

        server.inject('/api/resource', function(response) {
            var id = response.result[0]['_id'];
            
            server.inject('/api/resource/'+id+'/blacklist', function(response) {
                var result = response.result;

                expect(response.statusCode).to.equal(200);
                expect(result).to.be.instanceof(Object);
                expect(typeof result.email).to.equal('string');
                expect(result.password).to.not.exist;
                
                done();
            })
            
        });
    })

});