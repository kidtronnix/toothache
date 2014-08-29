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

describe("MongoCrud", function() {

	var server = new Hapi.Server();

    before(function (done) {
        var MongoClient = require('mongodb').MongoClient
        MongoClient.connect('mongodb://127.0.0.1:27017/test', function(err, db) {
            expect(err).to.not.exist;
            
            // Construct MongoCrud
            CRUD.db = db;
            var MongoCrud = require('../')(CRUD);

            // Get All
            server.route({
                method: 'GET', path: '/api/resource',
                config: {
                    handler: MongoCrud.getAll
                }
            });

            // Create
            server.route({
                method: 'POST', path: '/api/resource',
                config: {
                    handler: MongoCrud.create
                }
            });

            // Get a resource
            server.route({
                method: 'GET', path: '/api/resource/{id}',
                config: {
                    handler: MongoCrud.get
                }
            });

            // Update
            server.route({
                method: 'PUT', path: '/api/resource/{id}',
                config: {
                    handler: MongoCrud.update
                }
            });

            // Delete
            server.route({
                method: 'DELETE', path: '/api/resource/{id}',
                config: {
                    handler: MongoCrud.del
                }
            });
            
            done();
            
        })
    }); // Done with before

    it("creates a resource", function(done) {
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

    it("lists all resources", function(done) {
        var options = {
            method: "GET",
            url: "/api/resource"
        };

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

    it("update a resource", function(done) {
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
});