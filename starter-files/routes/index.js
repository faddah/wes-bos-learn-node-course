const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController');

const { catchErrors } = require('../handlers/errorHandlers')

// Do work here
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
router.get('/stores', storeController.getStores);
router.get('/add', storeController.addStore);


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

module.exports = router;
