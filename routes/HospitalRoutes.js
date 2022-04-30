const { Router } = require('express');

const hospitalController = require('../controllers/hospitalController');

const router = Router();

//TODO: POST request:


//TODO: GET request:
router.get('/login', hospitalController.Login);
router.get('/viewDoctors', hospitalController.viewDoctors);
router.post('/addDoctor', hospitalController.addDoctor);
//TODO: PUT request:


//TODO: DELETE request:

module.exports = router;