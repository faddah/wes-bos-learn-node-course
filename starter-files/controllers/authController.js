const passport = require('passport');
const crypto = require('crypto');
const mongoose = require('mongoose');
const User = mongoose.model('User');
const promisify = require('es6-promisify');
const mail = require(`../handlers/mail`);

exports.login = passport.authenticate('local', {
	failureRedirect: '/login',
	failureFlash: `Your log-in failed — your email or password were incorrect, please try again.`,
	successRedirect: '/',
	successFlash: `You are now logged in — Welcome.`
})

exports.logout = (req, res) => {
	req.logout();
	req.flash('success', 'You have been logged out. 👋');
	res.redirect('/');
}

exports.isLoggedIn = (req, res, next) => {
	// first check if this user is authenticated already
	if(req.isAuthenticated()) {
		return next();
	}
	req.flash('error', 'Whoops! You must be logged-in to do that. Please log-in.');
	res.redirect('/login');
}

exports.forgot = async (req, res) => {
	// 1. See if a user with that email even exists
	const user = await User.findOne({ email: req.body.email });
	if(!user) {
		req.flash(`error`, `That email account does not exist on this site.`);
		return res.redirect('/login');
	}
	// 2. Set reset tokens and expiry on their account (1 hour before token expires)
	user.resetPasswordToken =  crypto.randomBytes(20).toString('hex');
	user.resetPasswordExpires = Date.now() + 3600000; // the time now + 1 full hour
	await user.save();
	// 3. Send them an email for resetting password with the token attached
	const resetURL = `http://${req.headers.host}/account/reset/${user.resetPasswordToken}`;
	// NOTE: IRL, DON'T ever do this putting the reset right in a link anyone could see & click,
	// we'll take care of sending the actual email in a later video, but for now we're doing this
	// to show it works.
	await mail.send({
		user,
		subject: `That's So Delicious site Password Reset for your Account.`,
		resetURL,
		filename: `password-reset`,
	});
	req.flash(`success`, `You have been emailed a password reset link.`)
	// 4. After email token has been set, re-direct them to the login page
	res.redirect('/login');
}

exports.reset = async (req, res) => {
	// res.json(req.params);
	const user = await User.findOne({
		resetPasswordToken: req.params.token,
		resetPasswordExpires: { $gt: Date.now() }
	});
	// If the user is not found...
	if(!user) {
		req.flash('error', `Your password reset is invalid or expired.`);
		res.redirect('/login');
	}
	// However, if there _is_ such a user... show the password form!
	res.render('reset', { title: `Reset your Password` });
}

exports.confirmedPasswords = (req, res, next) => {
	if(req.body.password === req.body['password-confirm']) {
		next();
		return;
	}
	req.flash('error', `Your passwords do not match.`);
	res.redirect('back');
}
exports.update = async  (req, res, next) => {
	const user = await User.findOne({
		resetPasswordToken: req.params.token,
		resetPasswordExpires: { $gt: Date.now() }
	});
	// If the user is not found...
	if (!user) {
		req.flash('error', `Your password reset is invalid or expired.`);
		res.redirect('/login');
	}
	// However, if there _is_ such a user... reset the password in the mongodb!
	const setPassword = promisify(user.setPassword, user); 
	await setPassword(req.body.password);
	user.resetPasswordToken = undefined;
	user.resetPasswordExpires = undefined;
	const updateUser = await user.save();
	await req.login(updateUser); 
	req.flash(`success`, `🕺 Noice! You're password has been reset and you are logged in.`); 
	res.redirect('/');
}