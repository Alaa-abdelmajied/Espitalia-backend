const Patient = require("../models/Patient");
const { Doctor } = require("../models/Doctor");
const Hospital = require("../models/Hospital");
const Appointment = require("../models/Appointment");

const jsonwebtoken = require("jsonwebtoken");

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

/*FIXME: way of returning data + only show shifts that has appointments*/
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
        var patients = [];
        if (schedule[i].AppointmentList.length > 0) {
          for (var j = 0; j < schedule[i].AppointmentList.length; j++) {
            console.log(schedule[i].AppointmentList[j]);
            const { patient } = await Appointment.findById(
              schedule[i].AppointmentList[j]
            );
            const { name } = await Patient.findById(patient);
            patients.push({patientName:name});
          }
        }
        currentDayAppointments.push({
          from: schedule[i].from,
          to: schedule[i].to,
          patients,
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

module.exports.getUpcomingAppointments = async (req, res) => {
  const token = req.header("x-auth-token");
  const decodedToken = jsonwebtoken.verify(token, "PrivateKey");
  var upcomingAppointments = [];

  try {
    const { schedule } = await Doctor.findById(decodedToken);
    for (var i = 0; i < schedule.length; i++) {
      if (schedule[i].date > new Date()) {
        const appointmentDate = schedule[i].date.toDateString();
        var patients = [];
        if (schedule[i].AppointmentList.length > 0) {
          for (var j = 0; j < schedule[i].AppointmentList.length; j++) {
            console.log(schedule[i].AppointmentList[j]);
            const { patient } = await Appointment.findById(
              schedule[i].AppointmentList[j]
            );
            const { name } = await Patient.findById(patient);
            patients.push(name);
          }
        }
        upcomingAppointments.push({
          id: schedule[i]._id,
          date: appointmentDate,
          from: schedule[i].from,
          to: schedule[i].to,
          patients,
        });
      }
    }

    if (upcomingAppointments.length === 0)
      return res.status(404).send("No upcoming appointments");

    res.status(200).send(upcomingAppointments);
  } catch (err) {
    res.status(400).send(err.message);
  }
};
