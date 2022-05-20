const Patient = require("../models/Patient");
const Notifications = require("../models/Notifications");
const BloodRequests = require("../models/BloodRequests");
const { Doctor } = require("../models/Doctor");
const { Schedule } = require("../models/Doctor");
const Hospital = require("../models/Hospital");
const Appointment = require("../models/Appointment");
const Specialization = require("../models/Specialization");
const WaitingVerfication = require("../models/WaitingVerfication");
const conn = require("../db");

const nodemailer = require("nodemailer");
const otpGenerator = require("otp-generator");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const ObjectId = require("mongodb").ObjectId;
const date = require("date-and-time");
const { reset } = require("nodemon");
const { object } = require("joi");
const { upcomingAppointments } = require("./patientController");
require("dotenv").config();

module.exports.getDoctor = async (req, res) => {
  const drID = req.params.id;

  try {
    const {
      name,
      phoneNumber,
      email,
      hospitalID,
      workingDays,
      rating,
      userName,
    } = await Doctor.findById(drID);

    const hospitalName = await Hospital.findById(hospitalID);
    res.send({
      drName: name,
      username: userName,
      averageRating: rating,
      phoneNumber: phoneNumber,
      email: email,
      schedule: workingDays,
      hospitalName: hospitalName.name,
    });
  } catch (err) {
    res.status(400).send(err.message);
  }
};

// module.exports.getUpcomingAppointments = async (req, res) => {
//   const drID = req.params.id;
//   var upcomingAppointments = [];
//   try {
//     const { schedule } = await Doctor.findById(drID);
//     for (var i = 0; i < schedule.length; i++) {
//       for (var j = 0; j < schedule[i].AppointmentList.length; j++) {
//         console.log(schedule[i].AppointmentList[j]._id);
//         const { patient } = await Appointment.findById(
//           schedule[i].AppointmentList[j]._id
//         );
//         const { name, oldAppointments } = await Patient.findById(patient);
//         const { report, prescription } = await Appointment.findById(
//           oldAppointments[j]._id
//         );
//         console.log(report, prescription);
//         upcomingAppointments.push({
//           patientName: name,
//           oldAppointments: oldAppointments,
//         });
//       }
//       // const {report,patient,report}=await Appointment.findById(schedule[i].AppointmentList._id);
//     }

//     // console.log(schedule);
//     // let obj = schedule[0].find({ date: { $gt: "2022-05-01T22:00:00Z" } });
//     // console.log(obj);

//     res.send(upcomingAppointments);
//   } catch (err) {
//     res.status(400).send(err.message);
//   }
// };
