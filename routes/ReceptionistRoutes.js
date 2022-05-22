const { Router } = require("express");
const auth = require('../middleware/receptionist_auth');

const receptionistController = require("../controllers/receptionistController");

const router = Router();

//POST
router.post("/login", receptionistController.Login);
router.post("/CreateBloodRequest", receptionistController.CreateBloodRequest);
//router.post("/EditReservation", receptionistController.EditReservation);
router.post("/book", auth, receptionistController.book);
router.post("/createNotification", receptionistController.createNotification);

//GET
router.get("/GetSpecializations", auth, receptionistController.GetSpecializations);
router.get("/getDoctorsWithSpecificSpecialization/:specName", auth, receptionistController.getDoctorsWithSpecificSpecialization);
router.get("/getDoctor/:id", auth, receptionistController.getDoctor);
router.get("/GetReceptionistProfile", auth, receptionistController.GetReceptionistProfile);

router.get("/GetNotifications", auth, receptionistController.GetNotifications);
//router.get("/ReviewReservation", receptionistController.ReviewReservation);
//router.get("/CancelReservation", receptionistController.CancelReservation);

//DELETE
router.delete("/DropBloodRequest", receptionistController.DropBloodRequest);

//PUT


module.exports = router;
