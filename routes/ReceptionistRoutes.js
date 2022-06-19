const { Router } = require("express");
const auth = require('../middleware/receptionist_auth');

const receptionistController = require("../controllers/receptionistController");

const router = Router();

//POST
router.post("/login", receptionistController.Login);
router.post("/CreateBloodRequest", auth, receptionistController.CreateBloodRequest);
//router.post("/EditReservation", receptionistController.EditReservation);
router.post("/book", auth, receptionistController.book);
router.post("/createNotification", receptionistController.createNotification);

//GET
router.get("/GetSpecializations", auth, receptionistController.GetSpecializations);
router.get("/getDoctorsWithSpecificSpecialization/:specName", auth, receptionistController.getDoctorsWithSpecificSpecialization);
router.get("/getDoctor/:id", auth, receptionistController.getDoctor);
router.get("/GetReceptionistProfile", auth, receptionistController.GetReceptionistProfile);
router.get("/getMyData", auth, receptionistController.getMyData);
router.get("/getAppointmentsList/:doctorID/:scheduleID", auth, receptionistController.getAppointmentsList);
router.get("/getBloodRequests", auth, receptionistController.getBloodRequests);
router.get("/getOldBloodRequests", auth, receptionistController.getOldBloodRequests);
router.get("/GetNotifications", auth, receptionistController.GetNotifications);
//router.get("/ReviewReservation", receptionistController.ReviewReservation);
//router.get("/CancelReservation", receptionistController.CancelReservation);
router.get("/searchSpecializations/:search", auth, receptionistController.searchSpecializations);


//DELETE
router.delete("/cancelAppointment", receptionistController.cancelAppointment);
router.delete("/DropBloodRequest", auth, receptionistController.DropBloodRequest);

//PUT
router.put("/finalizeBloodRequest", auth, receptionistController.finalizeBloodRequest);


module.exports = router;
