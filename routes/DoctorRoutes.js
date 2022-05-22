const { Router } = require("express");
const doctorController = require("../controllers/doctorController");
const router = Router();
// const auth = require("../middleware/hospital_auth");

router.post("/login", doctorController.Login);
router.get("/doctor", doctorController.getDoctor);
router.get("/upcomingAppointments", doctorController.getUpcomingAppointments);

module.exports = router;
