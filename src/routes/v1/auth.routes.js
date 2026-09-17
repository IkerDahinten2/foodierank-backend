const express = require('express');
const router = express.Router();
const { register, login, getProfile } = require('../../controllers/auth.controller');
const { validateRegister, validateLogin } = require('../../middlewares/validators.middleware');
const { requireAuth } = require('../../middlewares/auth.middleware');

router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.get('/profile', requireAuth, getProfile);

module.exports = router;