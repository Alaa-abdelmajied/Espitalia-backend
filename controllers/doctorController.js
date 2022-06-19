const Patient = require("../models/Patient");
const { Doctor, Schedule } = require("../models/Doctor");
const Hospital = require("../models/Hospital");
const Appointment = require("../models/Appointment");
const conn = require("../db");
const jwt = require("jsonwebtoken");

require("dotenv").config();

const createToken = (id) => {
  return jwt.sign({ id }, "PrivateKey");
};

// const decodeToken = (token) => {
//   return jwt.verify(token, "PrivateKey").id;
// };

module.exports.Login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const doctor = await Doctor.doctorLogin(email, password);
    const token = createToken(doctor.id);
    console.log(token);
    res.status(200).header("x-auth-token", token).send(doctor);
  } catch (e) {
    res.status(400).send(e.message);
  }
};

module.exports.getDoctor = async (req, res) => {
  // const token = req.header("x-auth-token");
  // console.log(req.doctor);
  // const decodedToken = decodeToken(token);

  try {
    const { name, phoneNumber, email, hospitalID, workingDays, rating } =
      await Doctor.findById(req.doctor);

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

module.exports.getCurrentDayAppointments = async (req, res) => {
  console.log(req.doctor);
  var currentDayAppointments = [];
  try {
    const { schedule } = await Doctor.findById(req.doctor);
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
            patients.push({
              patientID: patient,
              appointmentID: schedule[i].AppointmentList[j],
              patientName: name,
              scheduleID: schedule[i]._id
            });
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
  // const token = req.header("x-auth-token");
  // const decodedToken = jsonwebtoken.verify(token, "PrivateKey");
  var upcomingAppointments = [];

  try {
    const { schedule } = await Doctor.findById(req.doctor);
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

module.exports.getPatientHistory = async (req, res) => {
  const { patientId } = req.params;
  try {
    var patientHistory = [];
    const { oldAppointments } = await Patient.findById(patientId);
    for (var i = 0; i < oldAppointments.length; i++) {
      const { doctor, report, prescription } = await Appointment.findById(
        oldAppointments[i]
      );
      const { name, specialization } = await Doctor.findById(doctor);
      patientHistory.push({
        doctorName: name,
        specialization: specialization,
        report: report,
        prescription: prescription,
      });
    }
    res.status(200).send(patientHistory);
  } catch (err) {
    res.status(400).send(err.message);
  }
};

module.exports.addReportAndPrescription = async (req, res) => {
  const { appointmentId, report, prescription } = req.body;
  try {
    await Appointment.findByIdAndUpdate(appointmentId, {
      report: report,
      prescription: prescription,
    });
    res.status(200).send();
  } catch (err) {
    res.status(500).send(err.message);
  }
};

module.exports.patientEntered = async (req, res) => {
  const { scheduleId } = req.body;
  try {
    const { schedule } = await Doctor.findById(req.doctor);
    for (var i = 0; i < schedule.length; i++) {
      if (schedule[i]._id == scheduleId) {
        if (schedule[i].entered) {
          throw new Error('still ongoing')
        } else {
          schedule[i].entered = true;
        }
        break;
      }
    }
    console.log(schedule);
    await Doctor.findByIdAndUpdate(
      req.doctor,
      {
        $set: {
          schedule: schedule,
        },
      }
    );
    res.status(200).send();
  } catch (err) {
    res.status(400).send(err.message);
  }
}

module.exports.endAppointment = async (req, res) => {
  const { appointmentId, patientId, scheduleId } = req.body;
  try {
    const { newAppointments, oldAppointments } = await Patient.findById(
      patientId
    );

    const { schedule } = await Doctor.findById(req.doctor);
    newAppointments.splice(newAppointments.indexOf(appointmentId), 1);
    oldAppointments.push(appointmentId);
    for (var i = 0; i < schedule.length; i++) {
      if (schedule[i]._id == scheduleId) {
        if (schedule[i].AppointmentList.includes(appointmentId)) {
          if (schedule[i].entered) {
            schedule[i].entered = false;
          } else {
            throw new Error('no ongoing');
          }
          var index = schedule[i].AppointmentList.indexOf(appointmentId);
          schedule[i].AppointmentList.splice(index, 1);
          schedule[i].flowNumber += 1;
        }
        break;
      }
    }
    // for (var i = 0; i < schedule.length; i++) {
    //   if (schedule[i].AppointmentList.includes(appointmentId)) {
    //     var index = schedule[i].AppointmentList.indexOf(appointmentId);
    //     schedule[i].AppointmentList.splice(index, 1);
    //     break;
    //   }
    // }
    const session = await conn.startSession();
    await session.withTransaction(async () => {
      await Patient.findByIdAndUpdate(
        patientId,
        {
          $set: {
            newAppointments: newAppointments,
            oldAppointments: oldAppointments,
          },
        },
        { session }
      );
      await Doctor.findByIdAndUpdate(
        req.doctor,
        {
          $set: {
            schedule: schedule,
          },
        },
        { session }
      );
    });
    session.endSession();
    res.status(200).send();
  } catch (err) {
    res.status(400).send(err.message);
  }
};

module.exports.patientDidNotShow = async (req, res) => {
  const { patientId, appointmentId } = req.body;
  try {
    const patient = await Patient.findById(patientId);
    const { schedule } = await Doctor.findById(req.doctor);
    for (var i = 0; i < schedule.length; i++) {
      if (schedule[i].AppointmentList.includes(appointmentId)) {
        var index = schedule[i].AppointmentList.indexOf(appointmentId);
        schedule[i].AppointmentList.splice(index, 1);
        break;
      }
    }
    const session = await conn.startSession();
    await session.withTransaction(async () => {
      await Patient.updateOne(
        patient,
        {
          unVisits: patient.unVisits + 1,
        },
        { session }
      );

      await Doctor.findByIdAndUpdate(
        req.doctor,
        {
          $set: {
            schedule: schedule,
          },
        },
        { session }
      );

      await Appointment.findByIdAndDelete(appointmentId, { session });
    });
    session.endSession();
    res.status(200).send();
  } catch (err) {
    res.status(400).send(err.message);
  }
};
