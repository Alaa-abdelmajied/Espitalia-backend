const { Router } = require("express");
const doctorController = require("../controllers/doctorController");
const router = Router();

router.get("/doctor/:id", doctorController.getDoctor);
// router.get("/upcomingAppointments/:id", doctorController.getUpcomingAppointments);

module.exports = router;
