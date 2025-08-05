const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');

router.get('/slots', searchController.searchFreeSlots);

router.get('/users', searchController.searchUsers);

module.exports = router;
