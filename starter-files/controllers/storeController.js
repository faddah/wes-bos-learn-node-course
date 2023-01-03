const mongoose = require('mongoose');
const Store = mongoose.model('Store');
const User = mongoose.model('User');
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
	req.body.author = req.user._id;
	const store = await (new Store(req.body)).save();
	// await store.save();
	// res.json(req.body)
	console.log('Saving to MongoDB via Mongoose worked!');
	req.flash('success', `Successfully Created ${store.name}. Care to leave a review?`)
	res.redirect(`/store/${store.slug}`);
};

exports.getStores = async (req, res) => {
	const page = req.params.page || 1;
	const limit = 4;
	const skip = (page * limit) - limit;
	// 1. Query the Database for the list of *all* the stores
	// console.log(stores);
	const storesPromise = Store
		.find()
		.skip(skip)
		.limit(limit)
		.sort({ created: 'desc' }); 
	const countPromise = Store.count();
	const [stores, count] = await Promise.all([storesPromise, countPromise]);
	const pages = Math.ceil(count / limit);
	if(page === 0) {
		req.flash('info', `Hey! You asked for page ${page}, but that page doesn't exist — so we took you to Page ${pages}.`);
		res.redirect(`/stores/page/${pages}`);
		return;
	}
	if(!stores.length && skip) {
		req.flash('info', `Hey! You asked for page ${page}, but that page doesn't exist — so we took you to Page ${pages}.`);
		res.redirect(`/stores/page/${pages}`);
		return;		
	}
	res.render('stores', { title: "Our Stores", elips: "...", stores, page, pages, count });
}

const confirmOwner = (store, user) => {
	if(!store.author.equals(user._id)) {
		throw Error(`You are not the Owner of this store — you must be the store owner to edit it.`)
	}
}

exports.editStores = async (req, res) => {
	// 1. Find the store given the id
	// res.json(req.params); // shows it returns just the id for that store from the params
	const store = await Store.findOne({ _id: req.params.id });
	// res.json(store);
	// TODO: 2. Authenticate user as store owner via login
	confirmOwner(store, req.user);
	// 3. Render out the edit form so the store owner can update their page
	res.render('editStore', { title: `Edit ${store.name}`, store });
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
	const store = await Store.findOne({ slug: req.params.slug }).populate('author reviews');
	if(!store) return next();
	// res.json(store);
	res.render('store', { store, title: store.name });
}

exports.getStoresByTag = async (req, res) => {
	// res.send(`<h2>It Works, You Bastardz!</h2>`);
	const tag = req.params.tag;
	const tagQuery = tag || { $exists: true };
	const tagsPromise = Store.getTagsList();
	const storePromise = Store.find({ tags: tagQuery });
	const [tags, stores] = await Promise.all([tagsPromise, storePromise]);
	// res.json(stores);
	res.render('tag', { tags, title: '#Tags!', tag, stores });
}

exports.searchStores = async (req, res) => {
	// res.json(req.query);
	const stores = await Store
		// first, find the stores that match...
		.find({
			$text: {
				$search: req.query.q
			}
		},
		// ...then, sort their sorry asses
		{
			score: { $meta: 'textScore' }
		}).sort({
			score: { $meta: 'textScore' }
		})
		.limit(5);
	res.json(stores);
}

exports.mapPage = async (req, res) => res.render('map', { title: `Map` });

exports.mapStores = async (req, res) => {
	const coordinates = [req.query.lng, req.query.lat].map(parseFloat);
	const query = {
		location: {
			$near: {
				$geometry: {
					type: 'Point',
					coordinates
				},
				$maxDistance: 10000   // 10 km
			}
		}
	}
	const stores = await Store.find(query)
		.select('slug name description location photo')
		.limit(10);
	res.json(stores);
}

exports.heartStore = async (req, res) => {
	const hearts = await req.user.hearts.map(obj => obj.toString());
	const operator = await hearts.includes(req.params.id) ? '$pull' : '$addToSet';
	const user = await User
		.findByIdAndUpdate(
			req.user._id,
			{ [operator]: { hearts: req.params.id } },
			{ new: true }
	);
	res.json(user)
}

exports.getHearts = async (req, res) => {
	const stores = await Store.find({
		_id: { $in: req.user.hearts }
	})
	res.render('stores', { title: `Hearted Stores`, stores });
}

exports.getTopStores = async (req, res) => {
	const stores = await Store.getTopStores();
	// res.json(stores)
	res.render('topStores', { stores, title: '★ Top Stores!' });
}