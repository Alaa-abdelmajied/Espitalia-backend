const { Router } = require("express");

const receptionistController = require("../controllers/receptionistController");

const router = Router();

router.post("/login", receptionistController.Login);

//router.get("/ReviewReservation", receptionistController.ReviewReservation);
//router.get("/CancelReservation", receptionistController.CancelReservation);
router.post("/GenerateBloodRequest", receptionistController.GenerateBloodRequest);
router.delete("/DropBloodRequest", receptionistController.DropBloodRequest);
//router.post("/EditReservation", receptionistController.EditReservation);
router.get("/GetSpecializations", receptionistController.GetSpecializations);
module.exports = router;
