const { Router } = require("express");
const auth = require('../middleware/receptionist_auth');

const receptionistController = require("../controllers/receptionistController");

const router = Router();

//POST
router.post("/login", receptionistController.Login);
router.post("/GenerateBloodRequest", receptionistController.GenerateBloodRequest);
//router.post("/EditReservation", receptionistController.EditReservation);

//GET
router.get("/GetSpecializations", auth, receptionistController.GetSpecializations);
//router.get("/ReviewReservation", receptionistController.ReviewReservation);
//router.get("/CancelReservation", receptionistController.CancelReservation);

//DELETE
router.delete("/DropBloodRequest", receptionistController.DropBloodRequest);

//PUT


module.exports = router;
