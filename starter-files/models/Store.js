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
	},
	photo: String,
	author: {
		type: mongoose.Schema.ObjectId,
		ref: 'User',
		required: `Please supply an author.`
	}
});

// Define indexes in MongoDB to speed up search
storeSchema.index({
	name: 'text',
	description: 'text',
});

storeSchema.pre('save', async function(next) {
	if(!this.isModified('name')) { // if the name has NOT been modified...
		next(); // skip this entirely!
		return; // stop the function from running
		// can also be expressed shorter in one line as `return next();`
	}
	this.slug = slug(this.name);
	// TODO: Make more resillient, so slugs are always unique (i.e., more than one Tim Horton's chain, etc.).
	// find other similarly named stores, to prevent duplicate slub names
	// like faddah, faddah-2, faddah-3, etc
	const slugRegEx = new RegExp(`^(${this.slug})((-[0-9]*$)?)$`, 'i');
	const storesWithSlug = await this.constructor.find({ slug: slugRegEx });
	if(storesWithSlug.length) {
		this.slug = `${this.slug}-${storesWithSlug.length + 1}`
	}
	next();
});

storeSchema.statics.getTagsList = function() {
	// Docs on MongoDB Aggregate Pipeline Operators —
	// https://www.mongodb.com/docs/manual/reference/operator/aggregation/
	return this.aggregate([
		// it's basically - use MongoDB aggregator pipeline functions to:
		// 1. $unwind what tags are in each store
		// 2. $group them by tag and count them with $sum
		// 3. $sort them
		// $unwind aggregation operator function on MongoDB docs —
		// https://www.mongodb.com/docs/manual/reference/operator/aggregation/unwind/
		{ $unwind: '$tags' },
		// $group & $sum operators on MongoDB Docs —
		// https://www.mongodb.com/docs/manual/reference/operator/aggregation/group/#mongodb-pipeline-pipe.-group
		// https://www.mongodb.com/docs/manual/reference/operator/aggregation/sum/#mongodb-group-grp.-sum
		{ $group: { _id: '$tags', count: { $sum: 1 } } },
		// $sort operator on MongoDB Docs —
		// https://www.mongodb.com/docs/v6.0/reference/operator/aggregation/sort/
		{ $sort: { count: -1 } }  // -1 sorts it in descending order
	]);

	/*
	storeSchema.statics.getTagsList = function() {
		return this.aggregate([
			{ $unwind: '$tags' },
			{ $group: { _id: '$tags', count: { $sum: 1 } } },
			{ $sort: { count: -1 } }
		]);
	}
	*/
}

module.exports = mongoose.model('Store', storeSchema);