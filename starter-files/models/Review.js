const { text } = require('express');
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const reviewSchema = new mongoose.Schema({
	created: {
		type: Date,
		default: Date.now()
	},
	author: {
		type: mongoose.Schema.ObjectId,
		ref: 'User',
		required: 'Please supply an author to write a review.'
	},
	store: {
		type: mongoose.Schema.ObjectId,
		ref: 'Store',
		required: 'Please supply a store to write a review.'
	},
	text: {
		type: String,
		required: 'Please supply review text for your review.'
	},
	rating: {
		type: Number,
		min: 1,
		max: 5
	}
});

function autopopulate(next) {
	this.populate('author')
	next();
}

reviewSchema.pre('find', autopopulate);
reviewSchema.pre('findOne', autopopulate);

module.exports = mongoose.model('Review', reviewSchema);