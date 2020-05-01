import express from 'express';
import importer from 'anytv-node-importer';
import multer from 'multer';
import auth from './../middleware/checkauth';

const router = express.Router();

const __ = importer.dirloadSync(__dirname + '/../controllers');
const upload = multer({ dest: 'uploads/' });



// USERS
router.get ('/users',                                   __.userController.index);
router.get ('/users/:id',                               __.userController.show);
router.put ('/users/:id',                          auth,__.userController.update);
router.post('/users',                              auth,__.userController.store);
router.put ('/users/delete/:id',                   auth,__.userController.remove);

// AUTHENTICATION

router.post('/user/login',                              __.authenticationController.login);
router.post('/user/logout',                        auth,__.authenticationController.logout);

// ROLES
router.get ('/roles',                                   __.roleController.index);
router.get ('/roles/:id',                               __.roleController.show);
router.put ('/roles/:id',                          auth,__.roleController.update);
router.post('/roles',                              auth,__.roleController.store);
router.put ('/roles/delete/:id',                   auth,__.roleController.remove);

// BOOKINGS
router.get ('/bookings',                           auth,__.bookingController.index);
router.put ('/bookings/:id',                       auth,__.bookingController.update);
router.get ('/bookings/:id',                       auth,__.bookingController.show);
router.post('/bookings',                           auth,__.bookingController.store);
router.put ('/bookings/delete/:id',                auth,__.bookingController.remove);

// BOOKING ITEMS
router.get ('/booking-items',                           __.bookingItemController.index);
router.post('/booking-items',                           __.bookingItemController.store);
router.put ('/booking-items/:id',                       __.bookingItemController.update);
router.delete('/booking-items/delete/:id',                __.bookingItemController.remove);

// TRANSACTIONS
router.get ('/transactions',                           __.transactionController.index);
router.get ('/transactions/:id',                       __.transactionController.show);
router.post('/transactions',                           __.transactionController.store);
router.put ('/transactions/delete/:id',                __.transactionController.remove);

// PRODUCTS
router.get ('/products',                                __.productController.index);
router.get ('/products/:id',                            __.productController.show);
router.put ('/products/:id',      upload.single('file'),__.productController.update);
router.post('/products',          upload.single('file'),__.productController.store);
router.put ('/products/delete/:id',                     __.productController.remove);



module.exports = router;