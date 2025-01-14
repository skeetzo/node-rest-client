var server =require("../server/mock-server"),
Client=require("../../lib/node-rest-client").Client;

describe('IO Facade', function () {

  this.timeout(150000);
  
  before(function () {
    server.listen(4444);
    console.log("server started on port 4444");
  });

  after(function () {
	server.close();  
  });

  describe("#Parsers", function() {

	var testParser = {
	  	"name": "test-parser",
		"isDefault": false,
		"match": function(response) {
			return response.headers["test-header"] === "test";			  
		},
		"parse": function(byteBuffer, nrcEventEmitter, parsedCallback) {
			var message = JSON.parse(byteBuffer.toString());
			message.parsed = true;
			parsedCallback(message);
		}
	},
	defaultTestParser = {
		"name": "default-test-parser",
		"isDefault": true,
		"parse": function (byteBuffer, nrcEventEmitter, parsedCallback) {
			var message = JSON.parse(byteBuffer.toString());
			message.defaultParsed = true;
			parsedCallback(message);
		}
	};
	  
    it("add invalid parser to client", function(done) {
      var client = new Client();
      client.on('error', function(err) {
        err.should.startWith("parser cannot be added: invalid parser definition");
        done();
      });
      client.parsers.add({"invalid":123, "parser":456}).should.throw();
    });

    it("add parser to client", function(done) {
        var client = new Client();     
        client.parsers.add(testParser);
        var parser = client.parsers.find("test-parser");        
        parser.should.not.equal(null);
        parser.should.type("object");
        done();
    });
    
    it("remove parser from client", function(done) {
        var client = new Client();
        client.on('error', function(err) {
            err.should.startWith("cannot find parser: test-parser doesn't exists");
            done();
        });
        client.parsers.add(testParser);
        var parser = client.parsers.find("test-parser");        
        parser.should.not.equal(null);
        parser.should.type("object");
        client.parsers.remove("test-parser");        
        client.parsers.find("test-parser");
      });
    
    it("response match parser", function(done) {
        var client = new Client();
        client.parsers.clean();
        client.parsers.add(testParser);
        client.get(server.baseURL + "/json", function(data, response) {
            data.should.not.equal(null);
            data.should.type("object");
            data.should.have.property("parsed");
            data.parsed.should.be.a.Boolean;
            data.parsed.should.be.true;
            done();
        });       
    });
    
    it("add and use default parser", function(done) {
        var client = new Client();
        client.parsers.clean();
        client.parsers.add(testParser);
        client.parsers.add(defaultTestParser);
        // no parsers defined, default must be used
        client.get(server.baseURL + "/json/path?default-test", function(data, response) {
            data.should.not.equal(null);
            data.should.type("object"); 
            data.should.have.property("defaultParsed");
            data.defaultParsed.should.be.a.Boolean;
            data.defaultParsed.should.be.true;
            done();
        });       
    });
    
    it("add custom types to args in JSON parser", function(done){
    	var options = {
    		// customize mime types for json or xml connections 
    		mimetypes: {
    		    json: ["test/json"]    		        
    		}
    	};
        var client = new Client(options);
        client.get(server.baseURL + "/json/test/content/type", function(data, response) {
            data.should.not.equal(null);
            data.should.type("object");
            done();
        });        
    });
    
    it("add custom types to args in XML parser", function(done){
    	var options = {
    		// customize mime types for json or xml connections 
    		mimetypes: {
    			xml: ["test/xml"]
    		}
    	};
        var client = new Client(options);
        client.get(server.baseURL + "/xml/test/content/type", function(data, response) {
            data.should.not.equal(null);
            data.should.type("object");
            done();
        });        
    });

    it("get all regular parsers", function(done){
        var client = new Client();
 		var parsers = client.parsers.getAll();
 		parsers.should.have.length(2);
 		done();        
    });

	it("emit custom event from parser to client", function(done) {
	    var client = new Client();
	    client.on('customEvent', function(event) {
	        event.should.be.equal("my custom event");
	        done();
	    });
	    client.parsers.clean();
	    client.parsers.add({
			"name":"example-parser",
			"isDefault":false,
			"match":function(request){return true; },							
			"parse":function(byteBuffer,nrcEventEmitter,parsedCallback) {							
				nrcEventEmitter('customEvent', 'my custom event');
				// pass serialized data to client to be sent to remote API
				parsedCallback(byteBuffer.toString());
			}
		});
	    var args = {data:"test data"}
        client.post(server.baseURL + "/json/path/post/query",args, function(data, response) {});
	});

});

  describe("#Serializers", function() {

    var testSerializer = {
    	"name": "test-serializer",
		"isDefault": false,
		"match": function(request) {
			return request.headers["test-header"] === "test";			  
		},
		"serialize": function(data,nrcEventEmitter,serializedCallback) {
			if (typeof data === 'object') {
				data.serialized = true;
				data = JSON.stringify(data);
			}
			serializedCallback(data);
		}
	},
	defaultTestSerializer = {
		"name": "default-test-serializer",
		"isDefault": true,
		"serialize": function(data,nrcEventEmitter,serializedCallback) {
			if (typeof data === 'object')
				data.defaultParsed = true;						  
			serializedCallback(data);
		}
	};  

    it("add invalid serializer to client", function(done) {
      var client = new Client();
      client.on('error', function(err) {
        err.should.startWith("serializer cannot be added: invalid serializer definition");
        done();
      });
      client.serializers.add({"invalid":123, "serializer":456}).should.throw();
    });

    it("add serializer to client", function(done) {
        var client = new Client();     
        client.serializers.add(testSerializer);
        var serializer = client.serializers.find("test-serializer");        
        serializer.should.not.equal(null);
        serializer.should.type("object");
        done();
    });
    
    it("remove serializer from client", function(done) {
        var client = new Client();
        client.on('error', function(err) {
            err.should.startWith("cannot find serializer: test-serializer doesn't exists");
            done();
        });
        client.serializers.add(testSerializer);
        var serializer = client.serializers.find("test-serializer");        
        serializer.should.not.equal(null);
        serializer.should.type("object");
        client.serializers.remove("test-serializer");        
        client.serializers.find("test-serializer");
    });
    
    it("request match serializer", function(done) {
        var client = new Client(),
	        args = {
	        	headers: {"test-header":"test"},
	        	data: {"testNumber":123, "testString":"abc"}	        
	        };
        client.serializers.clean();
        client.serializers.add(testSerializer);
        var request = client.post(server.baseURL + "/json/path/post", args, function(data, response) {
        	data.postData = JSON.parse(data.postData);
            data.postData.should.not.equal(null);
            data.postData.should.type("object");
            data.postData.should.have.property("serialized");
            data.postData.serialized.should.be.a.Boolean;
            data.postData.serialized.should.be.true;	            
          });       
        done();
    });

    it("get all regular serializers", function(done){
    	var client = new Client();
		var serializers = client.serializers.getAll();
		serializers.should.have.length(3);
		done();        
    });

    it("emit custom event from serializer to client", function(done){
        var client = new Client();
        client.on('customEvent',function(event){
        	event.should.be.equal("my custom event");
        	done();
        });
        client.serializers.clean();
        client.serializers.add({
			"name":"example-serializer",
			"isDefault":false,
			"match": function(request){return true; },							
			"serialize": function(data,nrcEventEmitter,serializedCallback) {							
				nrcEventEmitter('customEvent','my custom event');
				// pass serialized data to client to be sent to remote API
				serializedCallback(data.toString());
			}
		});
        var args ={data:"test data"}
  		client.post(server.baseURL + "/json/path/post/query",args, function(data, response) {});
    });

  });

 //  describe("#Validators", function() {

 //    var testValidator = {
 //    	"name": "test-validator",
 //    	// "contentTypes": [],
	// 	"isDefault": false,
	// 	"rules": {"test-string":"required|string","test-int":"required|min:8"},
	// 	"match": function(request) {
	// 		return true;
	// 		// console.log(request.headers)
	// 		// console.log(request.headers)
	// 		return request.headers["test-header"] === "test";			  
	// 	},
	// 	validate: function(data, nrcEventEmitter, validatedCallback) {
	// 		if (typeof data.postData != 'object')
	// 			data.postData = JSON.parse(data.postData);
	// 		data.postData.validated = true;
 //            data.postData = JSON.stringify(data.postData);
	// 		validatedCallback(data);
	// 	}
	// },
	// defaultTestValidator = {
	// 	"name": "default-test-validator",
	// 	"isDefault": true
	// };  

 //    it("add invalid validator to client", function(done) {
 //      var client = new Client();
 //      client.on('error', function(err) {
 //        err.should.startWith("validator cannot be added: invalid validator definition");
 //        done();
 //      });
 //      client.validators.add({"invalid":123, "validator":456}).should.throw();
 //    });

 //    it("add validator to client", function(done) {
 //        var client = new Client();     
 //        client.validators.add(testValidator);
 //        var validator = client.validators.find("test-validator");        
 //        validator.should.not.equal(null);
 //        validator.should.type("object");
 //        done();
 //    });
    
 //    it("remove validator from client", function(done) {
 //        var client = new Client();
 //        client.on('error', function(err) {
 //            err.should.startWith("cannot find validator: test-validator doesn't exists");
 //            done();
 //        });
 //        client.validators.add(testValidator);
 //        var validator = client.validators.find("test-validator");        
 //        validator.should.not.equal(null);
 //        validator.should.type("object");
 //        client.validators.remove("test-validator");        
 //        client.validators.find("test-validator");
 //    });
    
 //    it("request match validator", function(done) {
 //        var client = new Client(),
	//         args = {
	//         	headers: {"test-header":"test","content-type":"application/json"},
	//         	data: {"test-string":"123","test-int":7}
	//         };
 //        client.validators.clean();
 //        client.validators.add(testValidator);

 //        var request = client.post(server.baseURL + "/json/path/post", args, function(data, response) {
 //        	data.postData = JSON.parse(data.postData);
 //            data.postData.should.type("object");
 //            data.postData.should.have.property("validated");
 //            data.postData.validated.should.be.a.Boolean;
 //            data.postData.validated.should.be.true;

 //        });       
 //        done();
 //    });

 //    it("get all regular validators", function(done){
 //    	var client = new Client();
	// 	var validators = client.validators.getAll();
	// 	validators.should.have.length(0);
	// 	done();        
 //    });

 //    it("emit custom event from validator to client", function(done) {
 //        var client = new Client();
 //        client.on('customEvent', function(event) {
 //        	event.should.be.equal("my custom event");
 //        	done();
 //        });
 //        client.validators.clean();
 //        client.validators.add({
	// 		"name": "example-validator",
	// 		"isDefault": false,
	// 		"rules": {},
	// 		"match": function(request) {return true;},							
	// 		"validate": function(data, nrcEventEmitter, validatedCallback) {							
	// 			nrcEventEmitter('customEvent','my custom event');
	// 			validatedCallback(data);
	// 		}
	// 	});
 //        var args = {data:"test data"};
 //  		client.post(server.baseURL + "/json/path/post/query", args, function(data, response) {});
 //    });
    
 //  });

});