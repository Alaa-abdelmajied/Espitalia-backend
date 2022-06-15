const { Router } = require('express');
const auth = require('../middleware/hospital_auth');

const hospitalController = require('../controllers/hospitalController');

const router = Router();

//TODO: POST request:
router.post('/login', hospitalController.Login);
router.post('/logout', auth, hospitalController.Logout);

router.post('/addDoctor', auth, hospitalController.addDoctor);

router.post('/addReceptionist', auth, hospitalController.addReceptionist);


//TODO: GET request:
router.get('/viewDoctors', auth, hospitalController.viewDoctors);
router.get('/getDoctor/:doctorID', auth, hospitalController.getDoctor);
router.get('/getSpecializations', auth, hospitalController.getSpecializations);
router.get('/searchDoctors/:search',auth,hospitalController.hospitalSearchDoctor);

router.get('/getReceptionist/:receptID', auth, hospitalController.getReceptionist);
router.get('/viewReceptionists', auth, hospitalController.viewReceptionists);
router.get('/searchReceptionist/:search',auth,hospitalController.hospitalSearchReceptionist);


//TODO: PUT request:
router.put('/deactivateDoctor', auth, hospitalController.deactivateDoctor);
router.put('/activateDoctor', auth, hospitalController.activateDoctor);
router.put('/removeWorkingDay', auth, hospitalController.removeWorkingDay);
router.put('/addWorkingDay', auth, hospitalController.addWorkingDay);

router.put('/deactivateReceptionist', auth, hospitalController.deactivateReceptionist);
router.put('/activateReceptionist', auth, hospitalController.activateReceptionist);
//
router.put('/removeWorkingDayRecept', auth, hospitalController.removeWorkingDayRecept);
router.put('/addWorkingDayRecept', auth, hospitalController.addWorkingDayRecept);

module.exports = router;