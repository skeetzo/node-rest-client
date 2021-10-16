// Validation Manager

const Validator = require('validatorjs');

var ValidationManager = function() {

	var registry = {},
		defaultValidator = null;

	var _private = {
		"validate": function (validator) {
			function validateProperties(_validator, props) {
				var result = true;
				for (const propIndex in props) {
					var propType  = props[propIndex].split(":");
					if (!_validator.hasOwnProperty([propType[0]]) || typeof _validator[propType[0]] !== propType[1]){
						result = false;
						break;
					}
				}
				return result;
			}
			result = validateProperties(validator, ["name:string", "rules:object", "isDefault:boolean"]);
			// valid  validator, check if its not default response validator, to validate non default validator props
			if (result && !validator.isDefault)
				result = validateProperties(validator, ["match:function"]);
			// if (result && validator.isDefault)
				// result = validateProperties(validator, ["validate:function"]);
			return result;
		}
	};

	this.add = function(validator) {
		if (!_private.validate(validator))
			throw "validator cannot be added: invalid validator definition";
		if (validator.isDefault)
			defaultValidator = validator;
		else
			registry[validator.name] = validator;
	};

	this.remove = function(validatorName) {
		const result = registry[validatorName];
		if (!result)
			throw "cannot remove validator: " + validatorName +" doesn't exists";
		delete registry[validatorName];
	};

	this.clean = function() {
		registry = {};
	};

	this.find = function(validatorName) {
		const result = registry[validatorName];
		if (!result)
			throw "cannot find validator: " + validatorName + " doesn't exists ";
		return result;
	};

	this.getDefault = function() {
		return defaultValidator;
	};
	
	this.get = function(response) {
		var result = null;
		for (const validatorName in registry)
			if (registry[validatorName].match(response)) {
				result = registry[validatorName];
				break;
			}
		// if validator not found return default validator, else validator found
		return (result === null) ? defaultValidator : result;
	};

	this.getAll = function() {
		var result = [];		
		for (const validatorName in registry)
			result.push(registry[validatorName]);
		return result;
	}

	this.validate = function(data, nrcEventEmitter, validatedCallback) {
		if (Object.keys(this.rules).length === 0) return validatedCallback(data);
		let validated = new Validator(data, this.rules);
		validated = validated.passes();
		if (!validated) {
        	nrcEventEmitter('error','Error validating response. response: [' +data + '], error: [' + err + ']');
        	return validatedCallback(null);
		}
		validatedCallback(data);
	}

};

//////////////////////////////////////////////////////////////////////////////////////////////////

module.exports = function() {

	const validatorManager = new ValidationManager();

	const BaseValidator = {
		"name": "validator",
		"isDefault": false,
		"contentTypes": [],
		"match": function(response) {
			var result = false,
				contentType = response.headers["content-validator"] && response.headers["content-validator"].replace(/ /g, '');
			if (!contentType) return false;
			for (var i=0; i<this.contentTypes.length;i++) {
				result = this.contentTypes[i].trim().toLowerCase() === contentType.trim().toLowerCase();
				if (result) break;
			}
			return result;
		}
	};

	// validatorManager.add(BaseValidator);

	validatorManager.add({
		"name": "DEFAULT",
		"isDefault": true,
		"rules": {},
		"validate": validatorManager.validate
	});

	return validatorManager;

}