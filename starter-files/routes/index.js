const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const reviewController = require('../controllers/reviewController');

const { catchErrors } = require('../handlers/errorHandlers');

// Do some work here
/* 
router.get('/', (req, res) => {
	// const faddah = {
	// 	name: "faddah",
	// 	age: 62,
	// 	cool: true
	// }
  // res.send('<h2 style="font-family: `Apple Gothic`, Helvetica, Arial, sans-serif`; font-size: 3em; color: darkblue; margin: 5%; text-align: center;">Hey! It works!</h2>');
	// res.json(faddah);
	// res.json(req.query);
	// res.render('hello', {
	// 	name: "faddah",
	// 	dog: req.query.dog,
	// 	title: "i love food! ❤️ 🍔 😋"
	// });  
});
 */

/* 
router.get('/reverse/:name', (req, res) => {
	const reverse = [...req.params.name].reverse().join('');
	res.send(reverse);
});
 */

router.get('/', storeController.getStores);
router.get('/stores', catchErrors(storeController.getStores));
router.get('/stores/page/:page', catchErrors(storeController.getStores));
router.get('/add', 
	authController.isLoggedIn,
	storeController.addStore,
);


router.post('/add',
	storeController.upload,
	catchErrors(storeController.resize),
	catchErrors(storeController.createStore)
);

router.post('/add/:id',
	storeController.upload,
	catchErrors(storeController.resize),
	catchErrors(storeController.updateStore)
);

router.get('/stores/:id/edit', catchErrors(storeController.editStores));
router.get('/store/:slug', catchErrors(storeController.getStoreBySlug));
router.get('/tags/', catchErrors(storeController.getStoresByTag));
router.get('/tags/:tag', catchErrors(storeController.getStoresByTag));

router.get('/login', userController.loginForm);
router.post('/login', authController.login);
router.get('/register', userController.registerForm);


// for POSTS of User data, when they submit registration —
router.post('/register', 
	// 1. we validate the registration data
	userController.validateRegister,
	// 2. the user is registered and put in the mongodb
	userController.register,
	// 3. we log that user in
	authController.login,
);

router.get('/logout', authController.logout);

router.get('/account',
	authController.isLoggedIn,
	userController.account,
);
router.post('/account', catchErrors(userController.updateAccount));
router.post('/account/forgot', catchErrors(authController.forgot));
router.get('/account/reset/:token', catchErrors(authController.reset));
router.post('/account/reset/:token', 
	authController.confirmedPasswords,
	catchErrors(authController.update),
);
router.get('/map', storeController.mapPage);
router.get('/hearts', authController.isLoggedIn, catchErrors(storeController.getHearts))
router.post('/reviews/:id', authController.isLoggedIn, catchErrors(reviewController.addReview))
router.get('/top', catchErrors(storeController.getTopStores));

/* 

	Our API Endpoints for the MongoDB (w/ Indexing!)

*/

router.get('/api/search', catchErrors(storeController.searchStores));
router.get('/api/stores/near', catchErrors(storeController.mapStores));
router.post('/api/stores/:id/heart', catchErrors(storeController.heartStore));

module.exports = router;
