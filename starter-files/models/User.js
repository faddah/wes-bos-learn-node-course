const mongoose = require('mongoose');
const Schema = mongoose.Schema;
mongoose.Promise = global.Promise;
const md5 = require('md5');
const validator = require('validator');
const mongodbErrorHandler = require('mongoose-mongodb-errors');
const passportLocalMongoose = require('passport-local-mongoose');

const userSchema = new Schema({
		email: {
			type: String,
			unique: true,
			loadcase: true,
			trim: true,
			validate: [validator.isEmail, 'Invalid Email Address.'],
			required: "Please supply a valide email address.",
		},
	name: {
		type: String,
		required: "Please supply your name.",
		trim: true,
	},
});

userSchema.plugin(passportLocalMongoose, { usernameField: 'email' });
userSchema.plugin(mongodbErrorHandler);  // prettifies ugly mongo errors like if `unique: true` fails.

module.exports = mongoose.model('User', userSchema);