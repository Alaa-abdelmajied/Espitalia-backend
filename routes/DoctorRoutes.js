const { Router } = require("express");
const doctorController = require("../controllers/doctorController");
const router = Router();
const auth = require("../middleware/doctor_auth");

router.post("/login", doctorController.Login);
router.get(
  "/currentDayAppointments",
  doctorController.getCurrentDayAppointments
);
router.get(
  "/doctorUpcomingAppointments",
  doctorController.getUpcomingAppointments
);


router.post("/addReportAndPrecription", doctorController.addReportAndPrecription);
router.post("/endAppointments", auth, doctorController.endAppointment);
router.post("/didNotShow", auth, doctorController.patientDidNotShow);

router.get("/doctor", auth, doctorController.getDoctor);
router.get("/upcomingAppointments", auth, doctorController.getUpcomingAppointments);
router.get("/getPatientHistory/:patientId", doctorController.getPatientHistory);

module.exports = router;
