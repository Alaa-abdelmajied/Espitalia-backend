const { Router } = require('express');

const patientController = require('../controllers/patientController')

const router = Router();

router.post('/login',patientController.patientLogin);
router.get('/getPatient', patientController.getPatient);
router.get('/getNotification', patientController.getNotification);
router.get('/getBloodRequests', patientController.getBloodRequests);

module.exports = router;