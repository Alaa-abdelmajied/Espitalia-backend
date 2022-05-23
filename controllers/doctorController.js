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
const jsonwebtoken = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const otpGenerator = require("otp-generator");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const ObjectId = require("mongodb").ObjectId;
const date = require("date-and-time");
const { reset } = require("nodemon");
const { object } = require("joi");
require("dotenv").config();

module.exports.Login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const doctor = await Doctor.doctorLogin(email, password);
    const token = doctor.generateAuthToken();
    console.log(token);
    res.header("x-auth-token", token).send(doctor);
  } catch (e) {
    res.status(400).send(e.message);
  }
};

module.exports.getDoctor = async (req, res) => {
  const token = req.header("x-auth-token");
  console.log(token);
  const decodedToken = jsonwebtoken.verify(token, "PrivateKey");

  try {
    const { name, phoneNumber, email, hospitalID, workingDays, rating } =
      await Doctor.findById(decodedToken);

    const hospitalName = await Hospital.findById(hospitalID);
    res.send({
      drName: name,
      averageRating: rating,
      phoneNumber: phoneNumber,
      email: email,
      workingDays: workingDays,
      hospitalName: hospitalName.name,
    });
  } catch (err) {
    res.status(400).send(err.message);
  }
};


/*FIXME: only show shifts that has appointments*/
module.exports.getCurrentDayAppointments = async (req, res) => {
  const token = req.header("x-auth-token");
  console.log(token);
  const decodedToken = jsonwebtoken.verify(token, "PrivateKey");
  var currentDayAppointments = [];
  try {
    const { schedule } = await Doctor.findById(decodedToken);
    for (var i = 0; i < schedule.length; i++) {
      console.log(schedule[i].date);
      if (schedule[i].date.toDateString() === new Date().toDateString()) {
        console.log("here");
        var currentShiftPatients = [];
        if (schedule[i].AppointmentList.length > 0) {
          for (var j = 0; j < schedule[i].AppointmentList.length; j++) {
            console.log(schedule[i].AppointmentList[j]);
            const { patient } = await Appointment.findById(
              schedule[i].AppointmentList[j]
            );
            const { name } = await Patient.findById(patient);
            currentShiftPatients.push({
              patientName: name,
            });
          }
        }
        currentDayAppointments.push({
          shift: { from: schedule[i].from, to: schedule[i].to },
          currentShiftPatients,
        });
      }
    }
    if (currentDayAppointments.length === 0)
      return res.status(404).send("No Appointments today :)");

    res.status(200).send(currentDayAppointments);
  } catch (err) {
    res.status(400).send(err.message);
  }
};


/*TODO: continue + fix*/

// module.exports.getUpcomingAppointments = async (req, res) => {
//   const token = req.header("x-auth-token");
//   const decodedToken = jsonwebtoken.verify(token, "PrivateKey");
//   var upcomingAppointments = [];
//   try {
//     const { schedule } = await Doctor.findById(decodedToken);
//     for (var i = 0; i < schedule.length; i++) {
//       if (
//         schedule[i].date.toDateString() > new Date().toDateString() &&
//         schedule[i].AppointmentList.length > 0
//       ) {
//         const appointmentDate = schedule[i].date.toDateString();
//         // console.log(appointmentDate);
//         if (schedule[i].AppointmentList.length > 0) {
//           for (var j = 0; j < schedule[i].AppointmentList.length; j++) {
//             console.log(schedule[i].AppointmentList[j]);
//             const { patient } = await Appointment.findById(
//               schedule[i].AppointmentList[j]
//             );
//             const { name } = await Patient.findById(patient);
//             upcomingAppointments.push({
//               date: appointmentDate,
//               patientName: name,
//             });
//           }
//         }
//       }
//     }
//     if (upcomingAppointments.length === 0)
//       return res.status(404).send("No upcoming appointments");

//     res.status(200).send(upcomingAppointments);
//   } catch (err) {
//     res.status(400).send(err.message);
//   }
// };
