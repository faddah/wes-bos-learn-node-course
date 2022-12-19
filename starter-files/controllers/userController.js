const mongoose = require('mongoose');
const User = mongoose.model('User');
const promisify = require('es6-promisify')

exports.loginForm = (req, res) => res.render('login', { title: "Login" } );
exports.registerForm = (req, res) => res.render('register', { title: "Register" } );

exports.validateRegister = (req, res, next) => {
	req.sanitizeBody('name');
	req.checkBody('name', 'Please supply a valid name.').notEmpty();
	req.checkBody('email', 'Please supply a valid email.').isEmail();
	req.sanitizeBody('email').normalizeEmail({
		remove_dots: false,
		remove_extension: false,
		gmail_remove_subaddress: false, 
	});
	req.checkBody('password', 'The Password field cannot be blank — please supply a valid Password.').notEmpty();
	req.checkBody('password-confirm', 'The Confirm Password field cannot be blank — please supply a valid Confirm Password.').notEmpty();
	req.checkBody('password-confirm', 'Whoops! Your passwords currently do not match.').equals(req.body.password);

	const errors = req.validationErrors();
	if(errors) {
		req.flash('error', errors.map(err => err.msg));
		res.render('register', {
			title: 'Register',
			body: req.body,
			flashes: req.flash(),
		});
		return; // stops this function from running
	}
	next(); // skip on to the next middleware function
};

exports.register = async (req, res, next) => {
	const user = new User({ 
		email: req.body.email,
		name: req.body.name,
	});
	const register = promisify(User.register, User);
	await register(user, req.body.password);
	// console.log('you\'re registered!');
	// res.send(`<h1>It worked!</h1>`)
	next();  // if successful, pass to next middleware, authController().login
};
