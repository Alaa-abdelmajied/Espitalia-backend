const { Doctor, Schedule } = require('../models/Doctor');
const BloodRequest = require('../models/BloodRequests');
const Receptionist = require('../models/Receptionist');
const Patient = require('../models/Patient');
const { application } = require('express');
const { array, date } = require('joi');
const jwt = require('jsonwebtoken');
const Hospital = require('../models/Hospital');
const Appointment = require('../models/Appointment');
const OfflinePatient = require('../models/OfflinePatient');
const Notification = require('../models/Notifications');

const ObjectId = require("mongodb").ObjectId;


const conn = require("../db");

module.exports.Login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const receptionist = await Receptionist.findOne({ email });
    if (!receptionist) return res.status(400).send('bad request');
    //FIXME: no checking the password
    const token = jwt.sign({ _id: receptionist._id }, 'PrivateKey');
    // res.send(token);
    res.header('x-auth-token', token).send('Logged in');
  }
  catch (error) {
    res.status(400).send(error);
  }
}

module.exports.CreateBloodRequest = async (req, res) => {
  const { bloodType, hospitalID, receptionistID } = req.body;
  try {
    const request = await BloodRequest.create({
      bloodType,
      hospitalID,
      receptionistID
    });
    res.send(request);
    console.log(request);
  }
  catch (err) {
    res.status(400).send(err);
  }
}

module.exports.DropBloodRequest = async (req, res) => {
  const { id } = req.body;
  try {
    console.log(id);
    const request = await BloodRequest.findByIdAndDelete({ _id: id });
    res.status(200).send("Request cancelled successfully");
  }
  catch (err) {
    res.status(400).send(err);
  }
}

// module.exports.EditReservation = async (req,res) => {

// }

module.exports.GetSpecializations = async (req, res) => {

  //const { id } = req.body;
  try {
    const receptionist = await Receptionist.findById(req.receptionist._id);
    const hospitalID = await receptionist.hospitalID;
    console.log("Hospital ID:" + hospitalID);
    // to test ; specializations need to be added to some hospitals in database
    const hospital = await Hospital.findOne({ _id: hospitalID });
    // console.log(hospital.specialization);

    res.send(hospital.specialization);
  }
  catch (err) {
    res.status(400).send(err);
  }

}

module.exports.getDoctorsWithSpecificSpecialization = async (req, res) => {
  const specializationName = req.params.specName;
  console.log('spec:', specializationName);
  try {

    const receptionist = await Receptionist.findById(req.receptionist._id);
    const hospitalID = receptionist.hospitalID;
    const hospital = await Hospital.findOne({ _id: hospitalID });
    // console.log(hospital.specialization);

    const doctor = await Doctor.find({
      specialization: specializationName,
      hospitalID: hospitalID
    });

    console.log(doctor);
    res.send(doctor);
  }
  catch (err) {
    res.status(400).send(err);
  }
}

module.exports.getDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    res.send(doctor);
  }
  catch (error) {
    res.status(404).send('not found');
  }
}

module.exports.book = async (req, res) => {
  const { patientPhoneNumber, patientName, drId, date, from, to } = req.body;
  //console.log(req.body);
  const doctor = await Doctor.findById(drId);
  const hospitalId = doctor.hospitalID;
  const schedule = doctor.schedule;

  let obj = doctor.schedule.find(
    (o) =>
      (o.to === to) &
      (o.from === from) &
      (Date.parse(o.date) === Date.parse(date))
  );
  //console.log(obj);
  const indexOfScehdule = doctor.schedule.indexOf(obj);
  const flowNumber = obj.AppointmentList.length + 1;
  // console.log(flowNumber);
  try {
    const session = await conn.startSession();
    await session.withTransaction(async () => {
      const P_id = ObjectId();
      const newPatient = await OfflinePatient.create(
        [{
          _id: P_id,
          name: patientName,
          phoneNumber: patientPhoneNumber
        }], { session }
      );
      // console.log("success");
      const appointment = await Appointment.create(
        [
          {
            _id: ObjectId(),
            patient: P_id,
            doctor: drId,
            date: obj.date,
            from: from,
            to: to,
            flowNumber: flowNumber,
            hospital: hospitalId,
            reviewd: false,
          }],

        { session }
      );
      obj.AppointmentList.push(appointment[0]._id);
      schedule[indexOfScehdule] = obj;

      await Doctor.findByIdAndUpdate(
        drId,
        {
          $set: {
            schedule: schedule,
          },
        },
        { session }
      );

    });
    session.endSession();
    res.status(200).send("Appointment successfully booked");

  } catch (error) {
    console.log("error");
    res.status(400).send("Error booking appointment");
  }


}

module.exports.GetReceptionistProfile = async (req, res) => {
  try {
    const receptionist = await Receptionist.findById(req.receptionist._id);
    res.send(receptionist);
  }
  catch (error) {
    res.status(400).send("No receptionist found");
  }
}

module.exports.createNotification = async (req, res) => {
  const { title, body, userID } = req.body;
  try {
    const notification = await Notification.create({
      title,
      body,
      userID
    });
    res.send(notification);
    console.log(notification);

  }
  catch (err) {
    res.status(400).send(err);
  }
}


module.exports.GetNotifications = async (req, res) => {

  try {
    const notification = await Notification.find({ userID: req.receptionist._id });
    console.log(notification);
    res.send(notification);
  }
  catch (error) {
    res.status(400).send("No notifications available");
  }

}

module.exports.getMyData = async (req, res) => {
  try {
    const receptionist = await Receptionist.findById(req.receptionist._id).select('-password');
    res.send(receptionist);
  }
  catch (error) {
    res.status(404).send('not found');
  }
}

// module.exports.Logout = async (req, res) => {
// }

// module.exports.ConfirmAttendance = async (req,res) => {
// }
// module.exports.TrackFlow = async (req,res) =>{
// }


