const { Router } = require('express');

const hospitalController = require('../controllers/hospitalController');

const router = Router();

//TODO: POST request:
router.post('/login', hospitalController.Login);
router.post('/addDoctor', hospitalController.addDoctor);
router.post('/addReceptionist', hospitalController.addReceptionist);


//TODO: GET request:
router.get('/viewDoctors', hospitalController.viewDoctors);
router.get('/viewReceptionists', hospitalController.viewReceptionists);

//TODO: PUT request:
router.put('/deactivateDoctor', hospitalController.deactivateDoctor);
router.put('/activateDoctor', hospitalController.deactivateDoctor);
router.put('/deactivateReceptionist', hospitalController.deactivateReceptionist);
router.put('/activateReceptionist', hospitalController.activateReceptionist);

module.exports = router;