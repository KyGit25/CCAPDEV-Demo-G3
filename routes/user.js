
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.get('/view', userController.viewOwnProfile);

router.get('/view/:id', userController.viewPublicProfile);

router.get('/edit', userController.getEditProfile);
router.post('/edit', userController.updateProfile);

router.post('/delete', userController.deleteProfile);

module.exports = router;
