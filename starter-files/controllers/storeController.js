const mongoose = require('mongoose');
const Store = mongoose.model('Store');
const multer = require('multer');
const jimp = require('jimp');
const uuid = require('uuid');

const multerOptions = {
	storage: multer.memoryStorage(), // we save to memory only first, as we want to re-size it before saving to MongoDB
	fileFilter(req, file, next) {
		const isPhoto = file.mimetype.startsWith('image/');
		isPhoto 
			? next(null, true) 
			: next({ message: 'That file type is not an image and isn\'t allowed!' }, false);
	}
}

exports.homePage = (req, res) => res.render('index');
exports.addStore = (req, res) => res.render('editStore', { title: 'Add Store' });

exports.upload = multer(multerOptions).single('photo');

exports.resize = async (req, res, next) => {
	if(!req.file) {
		next(); // skip to the next middleware
		return;
	}
	// console.log(req.file);
	// get the pic file extension from the end of the mimetype
	const extension = req.file.mimetype.split('/')[1];
	req.body.photo = `${uuid.v4()}.${extension}`;
	// now we resize
	const photo = await jimp.read(req.file.buffer);
	await photo.resize(800, jimp.AUTO);
	await photo.write(`./public/uploads/${req.body.photo}`);
	// once we'ver written/saved the photo to our file system,
	// skip on to the next & keep going!
	next();
}

exports.createStore = async (req, res) => {
	const store = await (new Store(req.body)).save();
	// await store.save();
	// res.json(req.body)
	console.log('Saving to MongoDB via Mongoose worked!');
	req.flash('success', `Successfully Created ${store.name}. Care to leave a review?`)
	res.redirect(`/store/${store.slug}`);
};

exports.getStores = async (req, res) => {
	// 1. Query the Database for the list of *all* the stores
	// console.log(stores);
	const stores = await Store.find(); 
	res.render('stores', { title: "Our Stores", elips: "...", stores });
}

exports.editStores = async (req, res) => {
	// 1. Find the store given the id
	// res.json(req.params); // shows it returns just the id for that store from the params
	const store = await Store.findOne({ _id: req.params.id });
	// res.json(store);
	// TODO: 2. Authenticate user as store owner via login
	// 3. Render out the edit form so the store owner can update their page
	res.render('editStore', { title: `Edit ${store.name}`, store })
}

exports.updateStore = async (req, res) => {
	// 1. Set the location data to be a "Point" in Mongo Schema
	req.body.location.type = 'Point';
	// 2. find & update the storey
	// findOneAndUpdate() takes three params — the query, data, options
	const store = await Store.findOneAndUpdate({ _id: req.params.id }, req.body, {
		new: true, // returns the new store instead of the old one
		runValidators: true // runs the Schema validators AGAIN, so they can't be changed, on Update
	}).exec();  // with findOneAndUpdate(), you have to run .exec() after it to make sure it runs.
	// 3. re-direct them to the store and tell them it worked.
	req.flash('success', `Successfully updated <strong>${store.name}</strong>. <a href="/stores/${store.slug}>View Store →</a>"`);
	res.redirect(`/stores/${store._id}/edit`)
	console.log('Update me, baby.')
};

exports.getStoreBySlug = async (req, res, next) => {
	// res.send('hey, it works. what else you want? you\'re so demanding.');
	const store = await Store.findOne({ slug: req.params.slug });
	if(!store) return next();
	// res.json(store);
	res.render('store', { store, title: store.name });
}

exports.getStoresByTag = async (req, res) => {
	// res.send(`<h2>It Works, You Bastardz!</h2>`);
	const tags = await Store.getTagsList();
	const tag = req.params.tag;
	res.render('tag', { tags, title: '#Tags!', tag });
}