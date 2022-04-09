const { Router } = require('express');

const patientController = require('../controllers/patientController')

const router = Router();

router.post('/signup', patientController.patientSignup);
router.post('/login', patientController.patientLogin);
router.post('/verify', patientController.verifyAccount);

module.exports = router;