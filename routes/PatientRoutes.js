const { Router } = require("express");

const patientController = require("../controllers/patientController");

const router = Router();

//POST Routes
router.post("/signup", patientController.patientSignup);
router.post("/login", patientController.patientLogin);
router.post("/logout", patientController.patientLogout);
router.post("/verify", patientController.verifyAccount);
router.post("/changePassword", patientController.patientChangePassword);
router.post("/forgotPassword", patientController.patientForgotPassword);
router.post(
  "/forgotPasswordChange",
  patientController.patientForgotPasswordChange
);
router.post("/searchDoctors", patientController.patientSearchDoctor);
router.post(
  "/searchSpecialization",
  patientController.patientSearchSpecialization
);
router.post("/searchHospitals", patientController.patientSearchHospital);
router.post("/search", patientController.patientGeneralSerach);
router.post("/pressOnHospital", patientController.pressOnHospital);
router.post(
  "/pressOnHospitalThenSpecialization",
  patientController.pressOnHospitalThenSpecialization
);
router.post("/rateAndReview", patientController.rateAndReview);
router.post("/book", patientController.book);

//GET Routes
router.get("/searchDoctors/:search", patientController.patientSearchDoctor);
router.get(
  "/searchSpecialization/:search",
  patientController.patientSearchSpecialization
);
router.get("/searchHospitals/:search", patientController.patientSearchHospital);
router.get("/search/:search", patientController.patientGeneralSerach);
router.get("/pressOnHospital/:id", patientController.pressOnHospital);
router.get(
  "/pressOnHospitalThenSpecialization/:id/:search",
  patientController.pressOnHospitalThenSpecialization
);
router.get("/report/:id", patientController.selectReport);
router.get("/homepage", patientController.displayHomepage);
router.get("/doctor/:id", patientController.getDoctorDetails);
router.get("/allDoctors", patientController.seeAllDoctors);
router.get("/allHospitals", patientController.seeAllHospitals);
router.get("/allSpecializations", patientController.seeAllSpecializations);
router.get("/oldAppointment/:token", patientController.oldAppointments);
router.get(
  "/upcomingAppointment/:token",
  patientController.upcomingAppointments
);
router.get("/getPatient/:token", patientController.getPatient);
router.get("/getNotification/:token", patientController.getNotification);
router.get("/getBloodRequests/:skipNumber", patientController.getBloodRequests);
router.get("/isBloodReqUpdated/:date", patientController.isBloodReqUpdated)
router.get('/currentFlowNumber/:id', patientController.getFlowOfEntrance);

//DELETE Routes
router.delete("/cancel", patientController.cancelAppointment);

//PUT Routes
router.put("/editProfile", patientController.editProfile);

module.exports = router;
