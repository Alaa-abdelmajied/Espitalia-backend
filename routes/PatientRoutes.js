const { Router } = require('express');

const patientController = require('../controllers/patientController')

const router = Router();

<<<<<<< HEAD
router.post('/login',patientController.patientLogin);
router.get('/getPatient', patientController.getPatient);
router.get('/getNotification', patientController.getNotification);
router.get('/getBloodRequests', patientController.getBloodRequests);
=======
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
router.post('/editProfile', patientController.editProfile);

router.get('/report',patientController.selectReport);
router.get('/homepage',patientController.displayHomepage);
router.get('/getPatient', patientController.getPatient);
>>>>>>> 15d8539ca7b5dc08c2cdef66031b4d4abc5eb6bd

module.exports = router;