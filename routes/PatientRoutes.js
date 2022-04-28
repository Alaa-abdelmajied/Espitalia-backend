const { Router } = require('express');

const patientController = require('../controllers/patientController')

const router = Router();

router.post('/signup', patientController.patientSignup);
router.post('/login', patientController.patientLogin);
router.post('/logout', patientController.patientLogout);
router.post('/verify', patientController.verifyAccount);
router.post('/changePassword', patientController.patientChangePassword);
router.post('/forgotPassword', patientController.patientForgotPassword);
router.post('/forgotPasswordChange', patientController.patientForgotPasswordChange);
router.post('/searchDoctors', patientController.patientSearchDoctor);
router.post('/searchSpecialization', patientController.patientSearchSpecialization);
router.post('/searchHospitals', patientController.patientSearchHospital);
router.post('/search', patientController.patientGeneralSerach);
router.post('/pressOnHospital', patientController.pressOnHospital);
router.post('/pressOnHospitalThenSpecialization', patientController.pressOnHospitalThenSpecialization);
router.get('/searchDoctors/:search', patientController.patientSearchDoctor);
router.get('/searchSpecialization/:search', patientController.patientSearchSpecialization);
router.get('/searchHospitals/:search', patientController.patientSearchHospital);
router.get('/search/:search', patientController.patientGeneralSerach);
router.get('/pressOnHospital/:id', patientController.pressOnHospital);
router.get('/pressOnHospitalThenSpecialization/:id/:search', patientController.pressOnHospitalThenSpecialization);
router.post('/editProfile', patientController.editProfile);
router.post('/rate', patientController.rateDoctor);
router.post('/book', patientController.book);
router.get('/report', patientController.selectReport);
router.get('/homepage', patientController.displayHomepage);
router.get('/seeMore', patientController.seeMore);
router.get('/oldAppointment', patientController.oldAppointments);
router.get('/upcomingAppointment', patientController.upcomingAppointments);
// router.get('/getPatient', patientController.getPatient);
// router.get('/getPatient', patientController.getPatient);
router.get('/getNotification', patientController.getNotification);
router.post('/review', patientController.reviewDoctor);
// router.get('/getBloodRequests', patientController.getBloodRequests);
router.get('/currentFlowNumber', patientController.getFlowOfEntrance);

module.exports = router;