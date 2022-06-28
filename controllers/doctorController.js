const Patient = require("../models/Patient");
const { Doctor, Schedule } = require("../models/Doctor");
const Hospital = require("../models/Hospital");
const Appointment = require("../models/Appointment");
const WaitingVerfication = require("../models/WaitingVerfication");
const conn = require("../db");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const otpGenerator = require("otp-generator");

require("dotenv").config();

const createToken = (id) => {
  return jwt.sign({ id }, "PrivateKey");
};

// const decodeToken = (token) => {
//   return jwt.verify(token, "PrivateKey").id;
// };
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "espitalia.app.gp",
    pass: "ovxfmxqneryirltk",
  },
});

const sendOtp = async (drId, drName, email) => {
  const otp = otpGenerator.generate(5, {
    digits: true,
    upperCaseAlphabets: false,
    lowerCaseAlphabets: false,
    specialChars: false,
  });
  const account = await WaitingVerfication.findOne({ user: drId });
  console;
  if (account) {
    await WaitingVerfication.updateOne(account, {
      otp: otp,
    });
  } else {
    await WaitingVerfication.create({
      user: drId,
      otp: otp,
    });
  }
  const confirmationMail = {
    from: "espitalia.app.gp@gmail.com",
    to: email,
    subject: "Forgot Password",
    html:
      "Dr " +
      drName +
      ",<br/><br/> Please enter this code in the application: <br/>" +
      otp +
      "<br/><br/>Thanks and regards , <br/>      Espitalia",
  };
  transporter.sendMail(confirmationMail, function (error, info) {
    if (error) {
      console.log("Email" + error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });
};

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

module.exports.verifyAccount = async (req, res) => {
  const { otp } = req.body;
  try {
    const waitingVerfication = await WaitingVerfication.findOne({
      user: req.doctor,
    });
    if (otp == waitingVerfication.otp) {
      await WaitingVerfication.deleteOne({ user: req.doctor });
      res.status(200).send("Verified");
    } else {
      res.status(400).send("Wrong Otp");
    }
  } catch (err) {
    res.status(400).send(err.message);
  }
};

module.exports.resendOtp = async (req, res) => {
  try {
    const { name, email } = await Doctor.findById(req.doctor);
    sendOtp(req.doctor, name, email);
    res.status(200).send();
  } catch (err) {
    res.status(400).send(err.message);
  }
};

module.exports.changePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  try {
    const result = await Doctor.changePassword(
      req.doctor,
      oldPassword,
      newPassword
    );
    res.status(200).send(result);
  } catch (err) {
    res.status(400).send(err.message);
  }
};

module.exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const dr = await Doctor.findOne({ email });
    if (dr) {
      sendOtp(dr.id, dr.name, dr.email);
      const token = createToken(dr.id);
      res.status(201).send({ token });
    } else {
      res.status(404).send("This email does not exist");
    }
  } catch (err) {
    res.status(400).send(err.message);
  }
};

module.exports.forgotPasswordChange = async (req, res) => {
  const { newPassword } = req.body;
  try {
    const result = await Doctor.forgotPassword(req.doctor, newPassword);
    res.status(200).send(result);
  } catch (err) {
    res.status(400).send(err.message);
  }
};

module.exports.getDoctorProfile = async (req, res) => {
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
    console.log("sch",schedule);
    for (var i = 0; i < schedule.length; i++) {
      console.log(schedule[i].date);
      if (schedule[i].date.toDateString() === new Date().toDateString()) {
        console.log("here");
        var patients = [];
        if (schedule[i].AppointmentList.length > 0) {
          for (var j = 0; j < schedule[i].AppointmentList.length; j++) {
            console.log(schedule[i].AppointmentList[j]);
            const { patient, entered } = await Appointment.findById(
              schedule[i].AppointmentList[j]
            );
            console.log(entered);
            const { name } = await Patient.findById(patient);
            patients.push({
              patientID: patient,
              appointmentID: schedule[i].AppointmentList[j],
              patientName: name,
              scheduleID: schedule[i]._id,
              entered: entered,
            });
            console.log("patient==>",patients[j],"end");

          }
        }
        currentDayAppointments.push({
          from: schedule[i].from,
          to: schedule[i].to,
          patients,
        });
      }
      currentDayAppointments.sort(function (a, b) {
        return (a.from - b.from)&&(a.to-b.to);
      });
    }
    if (currentDayAppointments.length === 0)
      return res.status(404).send("No Appointments today :)");

    res.status(200).send(currentDayAppointments);
  } catch (err) {
    res.status(400).send(err.message);
  }
};

module.exports.getUpcomingAppointments = async (req, res) => {
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
          dateToSort: schedule[i].date,
          patients,
        });
      }
      upcomingAppointments.sort(function (a, b) {
        return a.dateToSort - b.dateToSort;
      });
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
          throw new Error("still ongoing");
        } else {
          schedule[i].entered = true;
        }
        break;
      }
    }
    console.log(schedule);
    await Doctor.findByIdAndUpdate(req.doctor, {
      $set: {
        schedule: schedule,
      },
    });
    res.status(200).send();
  } catch (err) {
    res.status(400).send(err.message);
  }
};

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
            throw new Error("no ongoing");
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
      if (patient.unVisits + 1 == 5) {
        var banTime = new Date();
        banTime.setDate(banTime.getDate() + 30);
        await Patient.findByIdAndUpdate(
          patientId,
          {
            unVisits: 0,
            unbanIn: banTime,
          },
          { session }
        );
      } else {
        console.log(patient.unVisits);
        await Patient.findByIdAndUpdate(
          patientId,
          {
            unVisits: patient.unVisits + 1,
          },
          { session }
        );
      }
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
