https://github.com/mikeerickson/validatorjs#readme

// ES5
let Validator = require('validatorjs');
// ES6
import * as Validator from 'validatorjs';



let validation = new Validator(data, rules [, customErrorMessages]);

// Example 1 - Passing Validation

let data = {
  name: 'John',
  email: 'johndoe@gmail.com',
  age: 28
};

let rules = {
  name: 'required',
  email: 'required|email',
  age: 'min:18'
};

let validation = new Validator(data, rules);

validation.passes(); // true
validation.fails(); // false



// Example 2 - Failing Validation

let validation = new Validator({
  name: 'D',
  email: 'not an email address.com'
}, {
  name: 'size:3',
  email: 'required|email'
});

validation.fails(); // true
validation.passes(); // false

// Error messages
validation.errors.first('email'); // 'The email format is invalid.'
validation.errors.get('email'); // returns an array of all email error messages





Nested objects can also be validated. There are two ways to declare validation rules for nested objects. The first way is to declare the validation rules with a corresponding nested object structure that reflects the data. The second way is to declare validation rules with flattened key names. For example, to validate the following data:

let data = {
  name: 'John',
  bio: {
    age: 28,
    education: {
      primary: 'Elementary School',
      secondary: 'Secondary School'
    }
  }
};

We could declare our validation rules as follows:

let nested = {
  name: 'required',
  bio: {
    age: 'min:18',
    education: {
      primary: 'string',
      secondary: 'string'
    }
  }
};

// OR

let flattened = {
  'name': 'required',
  'bio.age': 'min:18',
  'bio.education.primary': 'string',
  'bio.education.secondary': 'string'
};



WildCards can also be validated.

let data = {
  users: [{
    name: 'John',
    bio: {
      age: 28,
      education: {
        primary: 'Elementary School',
        secondary: 'Secondary School'
      }
    }
  }]
};


We could declare our validation rules as follows:

let rules = {
  'users.*.name': 'required',
  'users.*.bio.age': 'min:18',
  'users.*.bio.education.primary': 'string',
  'users.*.bio.education.secondary': 'string'
};




