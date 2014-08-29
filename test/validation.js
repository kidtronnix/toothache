var Lab = require("lab"),
	Hapi = require("hapi"),
	Joi = require("joi"),
	MongoDB = require('mongodb').Db,
	Server = require('mongodb').Server,
	ObjectId = require('mongodb').ObjectID,
    Bcrypt = require('bcryptjs');

// Internal config stuff
var CRUD = {
    collection: 'resources',
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
            
            // Construct Resource CRUD
            CRUD.db = db;
            var Resource = require('../')(CRUD);

            // Get All
            server.route({
                method: 'GET', path: '/api/resource',
                config: {
                    handler: Resource.getAll
                }
            });

            // Create
            server.route({
                method: 'POST', path: '/api/resource',
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

            // Update
            server.route({
                method: 'PUT', path: '/api/resource/{id}',
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


    it("create route gives error if invalid payload", function(done) {

        var badPayload = {
            random: "junk@test.com"
        };

        var options = {
            method: "POST",
            url: "/api/resource",
            payload: JSON.stringify(badPayload)
        };
        server.inject(options, function(response) {
            var result = response.result;

            expect(response.statusCode).to.equal(400);
            expect(result).to.be.instanceof(Object);
            expect(result.error).to.equal('Bad Request');
            
            done();
        });
    });

     it("update route gives error if invalid payload", function(done) {

        var payload = {
            email: "test@test.com",
            password: "newpass"
        };

        var options = {
            method: "POST",
            url: "/api/resource",
            payload: JSON.stringify(payload)
        };
        // first create a resource
        server.inject(options, function(response) {
            var result = response.result;

            var badPayload = {
                random: "junk@test.com"
            };
            var options = {
                method: "PUT",
                url: "/api/resource/"+result._id,
                payload: JSON.stringify(badPayload)
            };

            server.inject(options, function(response) {
                var result = response.result;

                expect(response.statusCode).to.equal(400);
                expect(result).to.be.instanceof(Object);
                expect(result.error).to.equal('Bad Request');

                options.method = "DELETE";

                server.inject(options, function(response) {

                })

                
                done();
            });
        });

        

        
        
    });



    it("get route gives errors if invalid id", function(done) {


        var options = {
            method: "GET",
            url: "/api/resource/0000000000d0a1b87bfb0683"
        };
        server.inject(options, function(response) {
            var result = response.result;

            expect(response.statusCode).to.equal(400);
            expect(result).to.be.instanceof(Object);
            expect(result.error).to.equal('Bad Request');
            expect(result.message).to.equal('No doc found in resources');
            
            done();
        });
    });

    it("update route gives errors if invalid id", function(done) {
        var payload = {
            email: "junk@test.com"
        };
        var options = {
            method: "PUT",
            url: "/api/resource/0000000000d0a1b87bfb0683",
            payload: JSON.stringify(payload)
        };
        server.inject(options, function(response) {
            var result = response.result;

            expect(response.statusCode).to.equal(400);
            expect(result).to.be.instanceof(Object);
            expect(result.error).to.equal('Bad Request');
            expect(result.message).to.equal('No doc found in resources');
            
            done();
        });
    });

    it("delete route gives errors if invalid id", function(done) {
        var options = {
            method: "DELETE",
            url: "/api/resource/0000000000d0a1b87bfb0683"
        };
        server.inject(options, function(response) {
            var result = response.result;
            
            expect(response.statusCode).to.equal(400);
            expect(result).to.be.instanceof(Object);
            expect(result.error).to.equal('Bad Request');
            expect(result.message).to.equal('No doc found in resources');
            
            done();
        });
    });



});