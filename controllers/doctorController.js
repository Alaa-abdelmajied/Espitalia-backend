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
const { upcomingAppointments } = require("./patientController");
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
      schedule: workingDays,
      hospitalName: hospitalName.name,
    });
  } catch (err) {
    res.status(400).send(err.message);
  }
};

module.exports.getUpcomingAppointments = async (req, res) => {
  const token = req.header("x-auth-token");
  console.log(token);
  const decodedToken = jsonwebtoken.verify(token, "PrivateKey");
  var upcomingAppointments = [];
  try {
    const { schedule } = await Doctor.findById(decodedToken);
    for (var i = 0; i < schedule.length; i++) {
      console.log(schedule[i].AppointmentList);
      for (var j = 0; j < schedule[i].AppointmentList.length; j++) {
        console.log(schedule[i].AppointmentList[j]._id);
        const { patient } = await Appointment.findById(
          schedule[i].AppointmentList[j]._id
        );
        const { name, oldAppointments } = await Patient.findById(patient);
        const { report, prescription } = await Appointment.findById(
          oldAppointments[j]._id
        );
        console.log(report, prescription);
        upcomingAppointments.push({
          patientName: name,
          oldAppointments: oldAppointments,
        });
      }
      // const {report,patient,report}=await Appointment.findById(schedule[i].AppointmentList._id);
    }

    // console.log(schedule);
    // let obj = schedule[0].find({ date: { $gt: "2022-05-01T22:00:00Z" } });
    // console.log(obj);

    res.send(upcomingAppointments);
  } catch (err) {
    res.status(400).send(err.message);
  }
};

module.exports.upcomingAppointments = async (req, res) => {
  const token = req.params.token;
  try {
    const id = decodeToken(token);

    const { newAppointments } = await Patient.findById(id);
    var appointmentDetails = [];

    for (var i = 0; i < newAppointments.length; i++) {
      const { doctor, hospital, date, flowNumber, from, to } =
        await Appointment.findById(newAppointments[i]._id);
      console.log(doctor);

      const fullDate =
        date.getDate() + "-" + (date.getMonth() + 1) + "-" + date.getFullYear();
      const hospitalData = await Hospital.findById(hospital);
      const doctorData = await Doctor.findById(doctor);

      appointmentDetails.push({
        appointmentID: newAppointments[i]._id,
        hospitalName: hospitalData.name,
        drName: doctorData.name,
        specialization: doctorData.specialization,
        date: fullDate,
        from: from,
        to: to,
        resNum: flowNumber,
      });
    }
    res.status(200).send(appointmentDetails);
  } catch (err) {
    res.status(400).send(err.message);
  }
};

