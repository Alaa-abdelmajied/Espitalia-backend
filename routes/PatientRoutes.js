const { Router } = require("express");
const auth = require("../middleware/patient_auth");


const patientController = require("../controllers/patientController");

const router = Router();

//POST Routes
router.post("/signup", patientController.patientSignup);
router.post("/login", patientController.patientLogin);
router.post("/logout", auth, patientController.patientLogout);
router.post("/verify", auth, patientController.verifyAccount);
router.post("/changePassword", auth, patientController.patientChangePassword);
router.post("/forgotPassword", patientController.patientForgotPassword);
router.post(
  "/forgotPasswordChange", auth,
  patientController.patientForgotPasswordChange
);
router.post("/rateAndReview", auth, patientController.rateAndReview);
router.post("/book", auth, patientController.bookAppointment);

//GET Routes
router.get("/searchDoctors/:search", patientController.patientSearchDoctor);
router.get(
  "/doctorInSpecialization/:search",
  patientController.pressOnSpecialization
);
router.get(
  "/searchDoctorInSpecialization/:specialization/:search",
  patientController.searchDoctorInSpecialization
);
router.get("/searchHospitals/:search", patientController.patientSearchHospital);
router.get("/search/:search", patientController.patientGeneralSearch);
router.get(
  "/searchAllSpecializations/:search",
  patientController.patientSearchSpecialization
);
router.get("/pressOnHospital/:id", patientController.pressOnHospital);
router.get(
  "/pressOnHospitalThenSpecialization/:id/:search",
  patientController.pressOnHospitalThenSpecialization
);
router.get(
  "/searchDoctorInSpecInHosp/:id/:specialization/:search",
  patientController.searchDoctorInSpecInHosp
);
router.get("/searchSpecializationInHospital/:id/:search", patientController.searchSpecializationInHospital);

router.get("/report/:id", patientController.getReport);
router.get("/homepage", patientController.displayHomepage);
router.get("/doctor/:id", patientController.getDoctorDetails);
router.get("/allDoctors", patientController.seeAllDoctors);
router.get("/allHospitals", patientController.seeAllHospitals);
router.get("/allSpecializations", patientController.seeAllSpecializations);
router.get("/oldAppointment", auth, patientController.oldAppointments);
router.get(
  "/upcomingAppointment", auth,
  patientController.upcomingAppointments
);
router.get("/getPatient", auth, patientController.getPatientProfile);
router.get("/getNotification", auth, patientController.getNotification);
router.get("/getBloodRequests/:skipNumber", patientController.getBloodRequests);
router.get("/isBloodReqUpdated/:date", patientController.isBloodReqUpdated);
router.get("/currentFlowNumber/:id", patientController.getFlowOfEntrance);

//DELETE Routes
router.delete("/cancel/:appointmentID", patientController.cancelAppointment);

//PUT Routes
router.put("/editProfile", auth, patientController.editProfile);

module.exports = router;
