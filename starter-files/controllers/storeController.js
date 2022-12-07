const mongoose = require('mongoose');
const Store = mongoose.model('Store');

exports.homePage = (req, res) => res.render('index');
exports.addStore = (req, res) => res.render('editStore', { title: 'Add Store' });
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
	// 1. find & update the storey
	// findOneAndUpdate takes three params — the query, data, options
	const store = await Store.findOneAndUpdate({ _id: req.params.id }, req.body, {
		new: true, // returns the new store instead of the old one
		runValidators: true // runs the Schema validators AGAIN, so they can't be changed, on Update
	}).exec();  // with findOneAndUpdate(), you have to run .exec() after it to make sure it runs.
	// 2. re-direct them to the store and tell them it worked.
	req.flash('success', `Successfully updated <strong>${store.name}</strong>. <a href="/stores/${store.slug}>View Store →</a>"`);
	res.redirect(`/stores/${store._id}/edit`)
	console.log('Update me, baby.')
};
