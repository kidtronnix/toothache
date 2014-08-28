var Lab = require("lab"),
	Hapi = require("hapi"),
	Joi = require("joi"),
	MongoDB = require('mongodb').Db,
	Server = require('mongodb').Server,
	ObjectId = require('mongodb').ObjectID;

var db = new MongoDB("hapi-dash", new Server("127.0.0.1", "27017", {auto_reconnect: true}), {w: 1});
db.open(function(e, d) {
    if (e) {
        console.log(e);
    } else{
        console.log('connected to database :: hapi-dash');

    }
});


// Internal config stuff
var internals = {
    // All config for mongo-crud
    CRUD: {
        bcrypt: 'password',
        create: Joi.object().keys({
            email: Joi.string().required()
        }),
        update: Joi.object().keys({
            email: Joi.string()
        }),
        defaults: {
            access: 'normal',
            guiToken: false,
            forgotToken: false,
            activated: false
        },
        validationOpts: {
            abortEarly: false
        }
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

	//var server = new Hapi.Server();
	//var MongoCrud = require('../')(internals.CRUD);
	

	before(function (done) {
		// server.route({
  //           method: 'GET', path: '/api/resource',
  //           config: {
  //               handler: MongoCrud.getAll
  //           }
  //       });

  //       server.route({
  //           method: 'POST', path: '/api/resource',
  //           config: {
  //               handler: MongoCrud.create
  //           }
  //       });

  //       server.route({
  //           method: 'GET', path: '/api/resource/{id}',
  //           config: {
  //               handler: MongoCrud.get
  //           }
  //       });

  //       server.route({
  //           method: 'PUT', path: '/api/resource/{id}',
  //           config: {
  //               handler: MongoCrud.update
  //           }
  //       });

  //       server.route({
  //           method: 'DELETE', path: '/api/resource/{id}',
  //           config: {
  //               handler: MongoCrud.del
  //           }
  //       });
        
    

        done();
        
    });



    it("lists all resources", function(done) {

        var collection = db
        .collection('users')
        .find({})
        .sort({ "_id" : 1})
        .toArray(function(err, docs) {
            // if (err) throw err;
            // next(docs).type('application/json');
            expect(docs).to.be.instanceof(Array);
            done();
        });

	   //  var options = {
	   //      method: "GET",
	   //      url: "/api/resource"
	   //  };

	    
	 
	   //  server.inject(options, function(response) {
	   //      var result = response.result;
	 		// console.log(result)
	   //      Lab.expect(response.statusCode).to.equal(200);
	   //      // //Lab.expect(result).to.be.instanceof(Array);
	   //      // // Lab.expect(result).to.have.length(5);
	 
	   //      return done();
	   //  });
	});
});