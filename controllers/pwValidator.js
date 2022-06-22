var passwordValidator = require('password-validator');

// Create a pwValidator
var pwValidator = new passwordValidator();

// Add properties to it
pwValidator
.is().min(8)                                    // Minimum length 8
.is().max(100)                                  // Maximum length 100
.has().uppercase()                              // Must have uppercase letters
.has().lowercase()                              // Must have lowercase letters
.has().digits(2)                                // Must have at least 2 digits
.has().not().spaces()                           // Should not have spaces
.is().not().oneOf(['Passw0rd', 'Password123']); // Blacklist these values

// Validate against a password string
console.log(pwValidator.validate('validPASS123'));
// => true
console.log(pwValidator.validate('invalidPASS'));
// => false

// Get a full list of rules which failed
console.log(pwValidator.validate('joke', { list: true }));
// => [ 'min', 'uppercase', 'digits' ]

module.exports = pwValidator