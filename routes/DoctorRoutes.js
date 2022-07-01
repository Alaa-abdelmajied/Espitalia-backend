const { Router } = require("express");
const doctorController = require("../controllers/doctorController");
const router = Router();
const auth = require("../middleware/doctor_auth");

//POST Routes
router.post("/login", doctorController.Login);
router.post("/verify", auth, doctorController.verifyAccount);
router.post("/resendOTP", auth, doctorController.resendOtp);
router.post("/changePassword", auth, doctorController.changePassword);
router.post("/forgotPassword", doctorController.forgotPassword);
router.post(
  "/forgotPasswordChange",
  auth,
  doctorController.forgotPasswordChange
);
router.post(
  "/addReportAndPrescription",
  doctorController.addReportAndPrescription
);
router.post("/endAppointments", auth, doctorController.endAppointment);
router.post("/didNotShow", auth, doctorController.patientDidNotShow);
router.post("/patientEntered", auth, doctorController.patientEntered);


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
router.get("/doctorProfile", auth, doctorController.getDoctorProfile);
router.get("/getPatientHistory/:patientId", doctorController.getPatientHistory);

module.exports = router;
