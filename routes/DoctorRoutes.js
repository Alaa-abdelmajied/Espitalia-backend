const { Router } = require("express");
const doctorController = require("../controllers/doctorController");
const router = Router();
const auth = require("../middleware/doctor_auth");

//POST Routes
router.post("/login", doctorController.Login);
router.post(
  "/addReportAndPrescription",
  doctorController.addReportAndPrescription
);
router.post("/endAppointments", auth, doctorController.endAppointment);
router.post("/didNotShow", auth, doctorController.patientDidNotShow);
router.post("/patientEntered", doctorController.patientEntered);


//GET Routes
router.get(
  "/currentDayAppointments",
  auth,
  doctorController.getCurrentDayAppointments
);
router.get(
  "/doctorUpcomingAppointments",
  auth,
  doctorController.getUpcomingAppointments
);
router.get("/doctorProfile", auth, doctorController.getDoctor);
router.get(
  "/upcomingAppointments",
  auth,
  doctorController.getUpcomingAppointments
);
router.get("/getPatientHistory/:patientId", doctorController.getPatientHistory);

module.exports = router;
