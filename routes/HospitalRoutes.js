const { Router } = require('express');

const hospitalController = require('../controllers/hospitalController');

const router = Router();

//TODO: POST request:
router.post('/addDoctor', hospitalController.addDoctor);
router.post('/addReceptionist', hospitalController.addReceptionist);


//TODO: GET request:
router.get('/login', hospitalController.Login);
router.get('/viewDoctors', hospitalController.viewDoctors);
router.get('/viewReceptionists', hospitalController.viewReceptionists);

//TODO: PUT request:


//TODO: DELETE request:

module.exports = router;