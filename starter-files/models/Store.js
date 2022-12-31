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
}, {
	toJSON: { virtuals: true },
	toObject: { virtuals: true }
});

// Define indexes in MongoDB to speed up search
storeSchema.index({
	name: 'text',
	description: 'text',
});

storeSchema.index({ location: '2dsphere' });

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
		// $unwind aggregation operator function on MongoDB docs —
		// https://www.mongodb.com/docs/manual/reference/operator/aggregation/unwind/
		{ $unwind: '$tags' },
		// 2. $group them by tag and count them with $sum
		// $group & $sum operators on MongoDB Docs —
		// https://www.mongodb.com/docs/manual/reference/operator/aggregation/group/#mongodb-pipeline-pipe.-group
		// https://www.mongodb.com/docs/manual/reference/operator/aggregation/sum/#mongodb-group-grp.-sum
		{ $group: { _id: '$tags', count: { $sum: 1 } } },
		// 3. $sort them
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

storeSchema.statics.getTopStores = function() {
	return this.aggregate([
		// Lookup Stores and populate the reviews - use MongoDB methods
		{ $lookup: { 
				from: 'reviews',
				localField: '_id',
				foreignField: 'store',
				as: 'reviews' 
			} 
		},
		// filter only for Items that have 2 or more reivews
		{ 
			$match: { 
				'reviews.1': { 
					$exists: true
				} 
			}
		},
		// Add the average reviews field
		{ $project: {
				photo: '$$ROOT.photo',
				name: '$$ROOT.name',
				reviews: '$$ROOT.reviews',
				slug: '$$ROOT.slug',
				averageRating: { $avg: '$reviews.rating' }
			} 
		},
		// sort it by our own new field, highest reviews first
		{ $sort: {  
				averageRating: -1,
			} 
		},
		// limit it to at most ten
		{ $limit: 10 }
	]);
}

// Find reviews where the store's _id property === reviews stores property
storeSchema.virtual('reviews', {
	ref: 'Review',  // what model to link?
	localField: '_id',  // which field on the store?
	foreignField: 'store',  // which field on the reivew?
});

function autopopulate(next) {
	this.populate('reviews');
	next();
}

storeSchema.pre('find', autopopulate);
storeSchema.pre('findOne', autopopulate);

module.exports = mongoose.model('Store', storeSchema);