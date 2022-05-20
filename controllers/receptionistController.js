
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
    res.send(token);
  }
  catch (error) {
    res.status(400).send(error);
  }
}

module.exports.GenerateBloodRequest = async (req, res) => {
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

  const { id } = req.body;
  try {
    const receptionist= await Receptionist.findOne({_id :id});
    const hospitalID = await receptionist.hospitalID;
    console.log("Hospital ID:" +hospitalID);
    // to test ; specializations need to be added to some hospitals in database
    const hospital = await Hospital.findOne({_id :"626a7ed1e1a7da1e245abd68"});
    console.log(hospital.specialization);

    res.send(hospital);
  }
  catch (err) {
    res.status(400).send(err);
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


