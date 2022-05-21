const { Doctor, Schedule } = require('../models/Doctor');
const BloodRequest = require('../models/BloodRequests');

const Receptionist = require('../models/Receptionist');
const Patient = require('../models/Patient');
const { application } = require('express');
const { array, date } = require('joi');
const jwt = require('jsonwebtoken');
const Hospital = require('../models/Hospital');


module.exports.Login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const receptionist = await Receptionist.findOne({ email });
    if (!receptionist) return res.status(400).send('bad request');

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

// module.exports.Logout = async (req, res) => {
// }

// module.exports.ConfirmAttendance = async (req,res) => {

// }

// module.exports.AddOfflineReservation = async (req,res) => {

// }

// module.exports.TrackFlow = async (req,res) =>{

// }


