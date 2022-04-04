const { Router } = require('express');

const patientController = require('../controllers/patientController')

const router = Router();

router.post('/login',patientController.patientLogin);

module.exports = router;