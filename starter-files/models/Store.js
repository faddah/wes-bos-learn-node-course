const { ServerDescription } = require('mongodb');
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const slug = require('slugs');

const storeSchema = new mongoose.Schema({
	name: {
		type: String,
		trim: true,
		required: 'Please enter a Store name!',
	},
	slug: String,
	description: {
		type: String,
		trim: true,
	},
	tags: [String],
	created: {
		type: Date,
		default: Date.now
	},
	location: {
		type: {
			type: String,
			default: 'Point'
		},
		coordinates: [{
			type: Number,
			required: 'You _must_ supply coordinates (long., lat.)!'
		}],
		address: {
			type: String,
			required: 'You _must_ supply an address!'
		}
	}
});

storeSchema.pre('save', function(next) {
	if(!this.isModified('name')) { // if the name has NOT been modified...
		next(); // skip this entirely!
		return; // stop the function from running
		// can also be expressed shorter in one line as `return next();`
	}
	this.slug = slug(this.name);
	next();
	// TODO: Make more resillient, so slugs are always unique (i.e., more than one Tim Horton's chain, etc.).
});

module.exports = mongoose.model('Store', storeSchema);