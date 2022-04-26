const { Router } = require('express');

const patientController = require('../controllers/patientController')

const router = Router();

router.post('/signup', patientController.patientSignup);
router.post('/login', patientController.patientLogin);
router.post('/verify', patientController.verifyAccount);
router.post('/changePassword', patientController.patientChangePassword);
router.post('/searchDoctors', patientController.patientSearchDoctor);
router.post('/searchSpecialization', patientController.patientSearchSpecialization);
router.post('/searchHospitals', patientController.patientSearchHospital);
router.post('/search', patientController.patientGeneralSerach);
router.post('/pressOnHospital', patientController.pressOnHospital);
router.post('/pressOnHospitalThenSpecialization', patientController.pressOnHospitalThenSpecialization);

module.exports = router;