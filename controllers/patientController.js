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
require("dotenv").config();

const createToken = (id) => {
  return jwt.sign({ id }, process.env.Token_Secret);
};

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "espitalia.app.gp",
    pass: "ovxfmxqneryirltk",
  },
});

const sendOtp = async (patientId, patientName, email) => {
  const otp = otpGenerator.generate(5, {
    digits: true,
    upperCaseAlphabets: false,
    lowerCaseAlphabets: false,
    specialChars: false,
  });
  const account = await WaitingVerfication.findOne({ patient: patientId });
  console;
  if (account) {
    await WaitingVerfication.updateOne(account, {
      otp: otp,
    });
  } else {
    await WaitingVerfication.create({
      patient: patientId,
      otp: otp,
    });
  }
  const confirmationMail = {
    from: "espitalia.app.gp@gmail.com",
    to: email,
    subject: "Verify your account",
    html:
      "Dear " +
      patientName +
      ",<br/><br/>Welcome to Espitalia.<br/><br/> Please enter this code in the application: <br/>" +
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

module.exports.resendOtp = async (req, res) => {
  try {
    const { name, email } = await Patient.findById(req.patient);
    sendOtp(req.patient, name, email);
    res.status(200).send();
  } catch (err) {
    res.status(400).send(err.message);
  }
};

module.exports.patientSignup = async (req, res) => {
  const {
    email,
    password,
    name,
    phoneNumber,
    dateOfBirth,
    gender,
    diabetic,
    bloodType,
    bloodPressure,
    allergic,
    allergies,
    fcmToken,
  } = req.body;
  try {
    const patient = await Patient.create({
      email,
      password,
      name,
      phoneNumber,
      dateOfBirth,
      gender,
      diabetic,
      bloodType,
      bloodPressure,
      allergic,
      allergies,
      fcmToken,
    });
    const token = createToken(patient.id);
    sendOtp(patient.id, patient.name, patient.email);
    res.status(201).send({ token });
  } catch (err) {
    res.status(400).send(err.message);
  }
};

module.exports.patientLogin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const patient = await Patient.patientLogin(email, password);
    if (patient.unbanIn > Date.now()) {
      throw new Error(
        'Your account "' +
          email +
          '" is banned as you did not show up at your' +
          " reservation time for five times. This ban ends at " +
          patient.unbanIn.toLocaleString()
      );
    }
    const token = createToken(patient.id);
    if (!patient.verified) {
      sendOtp(patient.id, patient.name, patient.email);
      res.status(200).send({ verified: patient.verified, token });
    } else {
      res.status(200).send({ verified: patient.verified, token });
    }
  } catch (err) {
    res.status(404).send(err.message);
  }
};

module.exports.patientLogout = async (req, res) => {
  try {
    res.status(200).send("Logged Out");
  } catch (err) {
    res.status(400).send(err.message);
  }
};

module.exports.verifyAccount = async (req, res) => {
  const { otp, forgot } = req.body;
  try {
    const waitingVerfication = await WaitingVerfication.findOne({
      patient: req.patient,
    });
    if (otp == waitingVerfication.otp) {
      if (!forgot) {
        await Patient.updateOne(
          { _id: waitingVerfication.patient },
          {
            verified: true,
          }
        );
      }
      await WaitingVerfication.deleteOne({ patient: req.patient });
      res.status(200).send("Verified");
    } else {
      res.status(400).send("Wrong Otp");
    }
  } catch (err) {
    res.status(400).send(err.message);
  }
};

module.exports.patientChangePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  try {
    const result = await Patient.changePassword(
      req.patient,
      oldPassword,
      newPassword
    );
    res.status(200).send(result);
  } catch (err) {
    res.status(400).send(err.message);
  }
};

module.exports.patientForgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const patient = await Patient.findOne({ email });
    if (patient) {
      sendOtp(patient.id, patient.name, patient.email);
      const token = createToken(patient.id);
      res.status(201).send({ token });
    } else {
      res.status(404).send("This email does not exist");
    }
  } catch (err) {
    res.status(400).send(err.message);
  }
};

module.exports.patientForgotPasswordChange = async (req, res) => {
  const { newPassword } = req.body;
  try {
    const result = await Patient.forgotPassword(req.patient, newPassword);
    res.status(200).send(result);
  } catch (err) {
    res.status(400).send(err.message);
  }
};

//Display Homepage
module.exports.displayHomepage = async (req, res) => {
  var hospitals = [];
  var doctors = [];
  var specializations = [];

  const dataSize = 5;
  try {
    const doctor = await Doctor.aggregate([
      { $match: { isActive: true } },
      {
        $project: {
          _id: 1,
          name: 1,
          specialization: 1,
          rating: 1,
          hospitalID: 1,
        },
      },
      { $sample: { size: dataSize } },
    ]);

    const hospital = await Hospital.aggregate([
      { $project: { _id: 1, name: 1, address: 1 } },
      { $sample: { size: dataSize } },
    ]);

    const specialization = await Specialization.aggregate([
      { $match: { "doctorIds.0": { $exists: true } } },
      { $project: { _id: 1, name: 1 } },
      { $sample: { size: dataSize } },
    ]);

    for (var i = 0; i < dataSize; i++) {
      const { name, address } = await Hospital.findById(doctor[i].hospitalID);
      hospitals.push({
        _id: hospital[i]._id,
        name: hospital[i].name,
        address: hospital[i].address,
      });
      doctors.push({
        _id: doctor[i]._id,
        name: doctor[i].name,
        speciality: doctor[i].specialization,
        hospitalName: name,
        hospitalAddress: address,
        averageRating: doctor[i].rating,
      });
      specializations.push(specialization[i].name);
    }

    res.status(200).send({ hospitals, doctors, specializations });
  } catch (err) {
    res.status(400).send(err.message);
  }
};

module.exports.seeAllDoctors = async (req, res) => {
  try {
    var allDoctors = [];
    const doctorData = await Doctor.find({ isActive: true }).select({
      _id: 1,
      name: 1,
      specialization: 1,
      hospitalID: 1,
      rating: 1,
    });

    for (var i = 0; i < doctorData.length; i++) {
      const { name, address } = await Hospital.findById(
        doctorData[i].hospitalID
      );
      allDoctors.push({
        _id: doctorData[i]._id,
        name: doctorData[i].name,
        specialization: doctorData[i].specialization,
        doctorHospitalName: name,
        doctorHospitalAddress: address,
        rating: doctorData[i].rating,
      });
    }

    res.status(200).send(allDoctors);
  } catch (err) {
    res.status(400).send(err.message);
  }
};

module.exports.seeAllHospitals = async (req, res) => {
  var allHospitals = [];
  try {
    const hospitalData = await Hospital.find();
    for (var i = 0; i < hospitalData.length; i++) {
      allHospitals.push({
        hospitalID: hospitalData[i]._id,
        hospitalName: hospitalData[i].name,
        address: hospitalData[i].address,
      });
    }

    res.status(200).send(allHospitals);
  } catch (err) {
    res.status(400).send(err.message);
  }
};

module.exports.seeAllSpecializations = async (req, res) => {
  try {
    const specializationData = await Specialization.find({
      "doctorIds.0": { $exists: true },
    }).select({
      name: 1,
      _id: 0,
    });
    res.status(200).send(specializationData);
  } catch (err) {
    res.status(400).send(err.message);
  }
};

const d = new Date();
console.log(d, d.toLocaleString());

//search be el talata (array w ba push fyha beltartyb 0:drs 1:hospital 2:specialization)
module.exports.patientGeneralSearch = async (req, res) => {
  const search = req.params.search;
  const limitSize = 4;

  var doctorSeeMore = false;
  var hospitalSeeMore = false;
  var specializationsSeeMore = false;

  var doctors = await Doctor.find({
    isActive: true,
    name: { $regex: ".*" + search + ".*", $options: "i" },
  })
    .limit(limitSize)
    .select({ name: 1 });

  var hospitals = await Hospital.find({
    name: { $regex: ".*" + search + ".*", $options: "i" },
  })
    .limit(limitSize)
    .select({ name: 1, address: 1 });

  var specializations = await Specialization.find({
    name: { $regex: ".*" + search + ".*", $options: "i" },
    "doctorIds.0": { $exists: true },
  })
    .limit(limitSize)
    .select({ name: 1 });

  if (doctors.length == limitSize) {
    doctors.pop();
    doctorSeeMore = true;
  }

  if (hospitals.length == limitSize) {
    hospitals.pop();
    hospitalSeeMore = true;
  }

  if (specializations.length == limitSize) {
    specializations.pop();
    specializationsSeeMore = true;
  }

  if (
    (doctors.length === 0) &
    (hospitals.length === 0) &
    (specializations.length === 0)
  )
    return res
      .status(404)
      .send("No hospitals or doctors or specializations found");
  res.status(200).send({
    doctors: doctors,
    doctorSeeMore: doctorSeeMore,
    hospitals: hospitals,
    hospitalSeeMore: hospitalSeeMore,
    specializations: specializations,
    specializationsSeeMore: specializationsSeeMore,
  });
};
//search be asma2 el drs bas
module.exports.patientSearchDoctor = async (req, res) => {
  const search = req.params.search;
  const doctors = await Doctor.find({
    isActive: true,
    name: { $regex: ".*" + search + ".*", $options: "i" },
  }).select({ _id: 1, name: 1, specialization: 1, hospitalID: 1, rating: 1 });
  var allDoctors = [];
  for (var i = 0; i < doctors.length; i++) {
    const { name, address } = await Hospital.findById(doctors[i].hospitalID);
    allDoctors.push({
      _id: doctors[i]._id,
      name: doctors[i].name,
      specialization: doctors[i].specialization,
      doctorHospitalName: name,
      doctorHospitalAddress: address,
      rating: doctors[i].rating,
    });
  }
  if (doctors.length === 0)
    return res.status(404).send("No doctors with that name found");
  res.status(200).send(allDoctors);
};

//search be hospital bas
module.exports.patientSearchHospital = async (req, res) => {
  const search = req.params.search;
  const hospitals = await Hospital.find({
    name: { $regex: ".*" + search + ".*", $options: "i" },
  }).select({ name: 1, address: 1, _id: 1 });

  var hospitalResult = [];
  for (var i = 0; i < hospitals.length; i++) {
    hospitalResult.push({
      hospitalID: hospitals[i]._id,
      hospitalName: hospitals[i].name,
      address: hospitals[i].address,
    });
  }

  if (hospitals.length === 0)
    return res.status(404).send("No Hospitals with that name found");

  res.status(200).send(hospitalResult);
};

//search be Specialization bas
module.exports.patientSearchSpecialization = async (req, res) => {
  const search = req.params.search;
  var specializations = await Specialization.find({
    name: { $regex: ".*" + search + ".*", $options: "i" },
    "doctorIds.0": { $exists: true },
  }).select({ _id: 0, name: 1 });
  if (specializations.length === 0)
    return res.status(404).send("No specializations with that name found");
  res.status(200).send(specializations);
};

//function when pressed on specefic hospital it will return its Specialization
module.exports.pressOnHospital = async (req, res) => {
  const id = req.params.id;
  try {
    const { specialization } = await Hospital.findById(id);
    // const specialization = (await Hospital.find({ _id: id }))[0].specialization;
    if (specialization.length === 0)
      res.status(404).send("No specialzations found");
    else res.status(200).send(specialization);
  } catch (error) {
    res.status(404).send("No hospitals found");
  }
};

module.exports.searchSpecializationInHospital = async (req, res) => {
  const hospitalID = req.params.id;
  const search = req.params.search;
  console.log(hospitalID);
  console.log(search);
  try {
    const { specialization } = await Hospital.findById(hospitalID);
    console.log(specialization);
    let array = [];
    searchReg = ".*" + search + ".*";
    console.log(searchReg);
    for (var i = 0; i < specialization.length; i++) {
      if (specialization[i].toUpperCase().match(searchReg.toUpperCase()))
        array.push(specialization[i]);
    }
    console.log(array);
    res.status(200).send(array);
  } catch (err) {
    if (array.length === 0) res.status(404).send("No specializations found");
    else {
      res.status(404).send(err);
    }
  }
};

//return doctors in specefic hospital in specific Specialization
module.exports.pressOnHospitalThenSpecialization = async (req, res) => {
  const id = req.params.id;
  const search = req.params.search;
  const doctors = await Doctor.find({
    hospitalID: id,
    specialization: search,
    isActive: true,
  }).select({ _id: 1, name: 1, specialization: 1, rating: 1 });

  if (doctors.length === 0) res.status(404).send("No doctors here");
  else res.status(200).send(doctors);
};

module.exports.searchDoctorInSpecInHosp = async (req, res) => {
  const id = req.params.id;
  const specialization = req.params.specialization;
  const search = req.params.search;
  try {
    const doctors = await Doctor.find({
      name: { $regex: ".*" + search + ".*", $options: "i" },
      hospitalID: id,
      specialization: specialization,
      isActive: true,
    }).select({ name: 1, rating: 1, specialization: 1 });
    console.log(doctors);
    res.status(200).send(doctors);
  } catch (err) {
    res.status(404).send(err);
  }
};

//search be specialization table
module.exports.pressOnSpecialization = async (req, res) => {
  const search = req.params.search;
  var doctorDetails = [];

  try {
    const specializations = await Specialization.findOne({ name: search });
    console.log(specializations.doctorIds);
    for (var i = 0; i < specializations.doctorIds.length; i++) {
      const { _id, name, specialization, hospitalID, rating, isActive } =
        await Doctor.findById(specializations.doctorIds[i]);
      if (isActive) {
        const hospitalInfo = await Hospital.findById(hospitalID).select({
          name: 1,
          address: 1,
          _id: 0,
        });
        doctorDetails.push({
          _id: _id,
          name: name,
          specialization: specialization,
          rating: rating,
          doctorHospitalName: hospitalInfo.name,
          doctorHospitalAddress: hospitalInfo.address,
        });
      }
    }
    res.status(200).send(doctorDetails);
  } catch (error) {
    res.status(404).send(error.message);
  }
};

module.exports.searchDoctorInSpecialization = async (req, res) => {
  const specialization = req.params.specialization;
  const search = req.params.search;
  var doctorDetails = [];
  try {
    const doctors = await Doctor.find({
      name: { $regex: ".*" + search + ".*", $options: "i" },
      specialization: specialization,
      isActive: true,
    }).select({ name: 1, rating: 1, hospitalID: 1 });
    for (var i = 0; i < doctors.length; i++) {
      const hospitalInfo = await Hospital.findById(
        doctors[i].hospitalID
      ).select({
        name: 1,
        address: 1,
        _id: 0,
      });
      doctorDetails.push({
        _id: doctors[i]._id,
        name: doctors[i].name,
        specialization: specialization,
        rating: doctors[i].rating,
        doctorHospitalName: hospitalInfo.name,
        doctorHospitalAddress: hospitalInfo.address,
      });
    }
    console.log(doctorDetails);
    res.status(200).send(doctorDetails);
  } catch (err) {
    res.status(404).send(err);
  }
};

function calculateAge(dateString) {
  var today = new Date();
  var birthDate = new Date(dateString);
  var age = today.getFullYear() - birthDate.getFullYear();
  var m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

/*TODO: change name to getPatientProfile*/
module.exports.getPatientProfile = async (req, res) => {
  try {
    const {
      name,
      phoneNumber,
      email,
      dateOfBirth,
      gender,
      bloodType,
      diabetic,
      bloodPressure,
      allergic,
      allergies,
    } = await Patient.findById(req.patient);
    const birthdate =
      dateOfBirth.getDate() +
      "-" +
      (dateOfBirth.getMonth() + 1) +
      "-" +
      dateOfBirth.getFullYear();
    const age = calculateAge(dateOfBirth);
    res.status(200).send({
      name,
      phoneNumber,
      email,
      birthdate,
      age,
      gender,
      dateOfBirth,
      bloodType,
      diabetic,
      bloodPressure,
      allergic,
      allergies,
    });
  } catch (err) {
    res.status(400).send(err.message);
  }
};

module.exports.getNotification = async (req, res) => {
  try {
    const notification = await Notifications.find({ userID: req.patient });
    console.log(notification[0].date.toLocaleString());
    res.send(notification);
  } catch (err) {
    res.status(400).send(err.message);
  }
};

module.exports.isBloodReqUpdated = async (req, res) => {
  const { date } = req.params;
  try {
    const newEntries = await BloodRequests.count({
      date: { $gt: new Date(date) },
    });
    res.status(200).send({ newEntries });
  } catch (err) {
    res.status(500).send(err.message);
  }
};

module.exports.getBloodRequests = async (req, res) => {
  const { skipNumber } = req.params;
  const limitSize = 4;
  try {
    const bloodRequests = await BloodRequests.find()
      .sort({ date: -1, _id: 1 })
      .skip(skipNumber)
      .limit(limitSize);
    var requests = [];
    for (var i = 0; i < bloodRequests.length; i++) {
      var hospital = await Hospital.findById(bloodRequests[i].hospitalID);
      var date = new Date(bloodRequests[i].date);
      var req = {
        id: bloodRequests[i]._id,
        hospital_Name: hospital.name,
        bloodType: bloodRequests[i].bloodType,
        quantity: bloodRequests[i].quantity,
        date: date,
      };
      requests.push(req);
    }
    res.status(200).send(requests);
  } catch (err) {
    res.status(400).send(err.message);
  }
};

//Get Report
module.exports.getReport = async (req, res) => {
  const appointmentID = req.params.id;
  try {
    const { doctor, hospital, date, report, prescription, reviewd } =
      await Appointment.findById(appointmentID);
    const doctorData = await Doctor.findById(doctor);
    const hospitalData = await Hospital.findById(hospital);
    // const fullDate =
    //   date.getDate() + "-" + (date.getMonth() + 1) + "-" + date.getFullYear();
    const appointmentDetails = {
      drId: doctorData._id,
      hospitalName: hospitalData.name,
      drName: doctorData.name,
      specialization: doctorData.specialization,
      date: date.toDateString(),
      diagnosis: report,
      prescription: prescription,
      reviewed: reviewd,
    };
    res.status(200).send(appointmentDetails);
  } catch (err) {
    res.status(400).send(err.message);
  }
};

//Old Appointments
module.exports.oldAppointments = async (req, res) => {
  try {
    const { oldAppointments } = await Patient.findById(req.patient);
    var appointmentDetails = [];
    for (var i = 0; i < oldAppointments.length; i++) {
      const { doctor, hospital, date } = await Appointment.findById(
        oldAppointments[i]._id
      );
      // const fullDate =
      //   date.getDate() + "-" + (date.getMonth() + 1) + "-" + date.getFullYear();
      const hospitalData = await Hospital.findById(hospital);
      const doctorData = await Doctor.findById(doctor);
      appointmentDetails.push({
        appointmentID: oldAppointments[i]._id,
        hospitalName: hospitalData.name,
        drName: doctorData.name,
        specialization: doctorData.specialization,
        date: date.toDateString(),
      });
    }
    res.status(200).send(appointmentDetails);
  } catch (err) {
    res.status(400).send(err.message);
  }
};

//Upcoming appointments
module.exports.upcomingAppointments = async (req, res) => {
  try {
    const { newAppointments } = await Patient.findById(req.patient);
    var appointmentDetails = [];
    var currentFlowNumber;
    var entered;

    for (var i = 0; i < newAppointments.length; i++) {
      const { doctor, hospital, date, flowNumber, from, to } =
        await Appointment.findById(newAppointments[i]._id);
      console.log(doctor);

      const fullDate =
        date.getDate() + "-" + (date.getMonth() + 1) + "-" + date.getFullYear();
      const hospitalData = await Hospital.findById(hospital);
      const doctorData = await Doctor.findById(doctor);

      for (var j = 0; j < doctorData.schedule.length; j++) {
        if (
          doctorData.schedule[j].AppointmentList.includes(
            newAppointments[i]._id
          )
        ) {
          currentFlowNumber = doctorData.schedule[j].flowNumber;
          entered = doctorData.schedule[j].entered;
          break;
        }
      }

      appointmentDetails.push({
        appointmentID: newAppointments[i]._id,
        hospitalName: hospitalData.name,
        drName: doctorData.name,
        specialization: doctorData.specialization,
        date: fullDate,
        from: from,
        to: to,
        resNum: flowNumber,
        currentFlowNumber: currentFlowNumber,
        entered: entered,
        dateToSort: date,
      });
    }
    appointmentDetails.sort(function (a, b) {
      return a.dateToSort - b.dateToSort;
    });
    res.status(200).send(appointmentDetails);
  } catch (err) {
    res.status(400).send(err.message);
  }
};

/*
    Edit Patient's Profile:
        function takes parameters : id, name, phone number, date of birth, and answers for the medical questions
        then, search for a patient with the associated id.
        when it finds the patient it  updates his record.
        if the patient is not found, the function return 404 error (not found error).
*/
module.exports.editProfile = async (req, res) => {
  const {
    newName,
    newPhoneNumber,
    newDate,
    newDiabetic,
    newBloodType,
    newBloodPressure,
    newAllergic,
    newAllergies,
  } = req.body;

  const patient = await Patient.findByIdAndUpdate(req.patient, {
    $set: {
      name: newName,
      phoneNumber: newPhoneNumber,
      dateOfBirth: newDate,
      bloodType: newBloodType,
      diabetic: newDiabetic,
      bloodPressure: newBloodPressure,
      allergic: newAllergic,
      allergies: newAllergies,
    },
  });
  if (!patient) return res.status(404).send("Patient not found");
  res.status(200).send(await Patient.findById(req.patient));
};

module.exports.rateAndReview = async (req, res) => {
  const { rate, review, doctorId, appointmentID } = req.body;
  try {
    const { name } = await Patient.findById(req.patient);
    const { rating, reviews } = await Doctor.findById(doctorId);

    const numberOfReviews = reviews.length;

    const newRate = (
      (rating * numberOfReviews + Number(rate)) /
      (numberOfReviews + 1)
    ).toFixed(1);
    const date = new Date();
    await Doctor.findByIdAndUpdate(doctorId, {
      rating: newRate,
      $push: {
        reviews: [
          {
            name: name,
            rating: rate,
            review: review,
            date: date,
          },
        ],
      },
    });

    await Appointment.findByIdAndUpdate(appointmentID, {
      $set: {
        reviewd: true,
      },
    });

    res.status(200).send("Rating and review done");
  } catch (err) {
    res.status(400).send(err.message);
  }
};

module.exports.getDoctorDetails = async (req, res) => {
  const doctorId = req.params.id;
  var doctorData = [];
  var reviewDetails = [];
  var scheduleDetails = [];
  const currentTime = new Date().toLocaleTimeString("en-GB").substring(0, 5);
  console.log("new date", "hours==>", currentTime);
  try {
    const { name, hospitalID, reviews, schedule, rating, specialization } =
      await Doctor.findById(doctorId);
    console.log(rating);
    const hospitalData = await Hospital.findById(hospitalID);

    doctorData = {
      drName: name,
      specialization: specialization,
      averageRating: rating,
      hospitalName: hospitalData.name,
      hospitalAddress: hospitalData.address,
    };

    for (var i = 0; i < reviews.length; i++) {
      const fullDate =
        reviews[i].date.getDate() +
        "-" +
        (reviews[i].date.getMonth() + 1) +
        "-" +
        reviews[i].date.getFullYear();
      reviewDetails.push({
        name: reviews[i].name,
        review: reviews[i].review,
        rate: reviews[i].rating,
        date: fullDate,
      });
    }

    for (var i = 0; i < schedule.length; i++) {
      scheduleDetails.push({
        date: schedule[i].date,
        from: schedule[i].from,
        to: schedule[i].to,
        displayDate: schedule[i].date.toDateString(),
      });
      const x = "01:00";
      console.log(x, currentTime);
      if (x > currentTime) {
        console.log("not yet");
      } else {
        console.log("passed");
      }
    }
    res.status(200).send({ doctorData, reviewDetails, scheduleDetails });
  } catch (err) {
    res.status(400).send(err.message);
  }
};

/*TODO: change name bookAppointment*/
module.exports.bookAppointment = async (req, res) => {
  const { drId, appDate, appFrom, appTo } = req.body;
  const doctor = await Doctor.findById(drId);
  const hospitalId = doctor.hospitalID;
  const schedule = doctor.schedule;

  let obj = doctor.schedule.find(
    (o) =>
      (o.to === appTo) &
      (o.from === appFrom) &
      (Date.parse(o.date) === Date.parse(appDate))
  );

  const indexOfScehdule = doctor.schedule.indexOf(obj);
  const flowNumber = obj.AppointmentList.length + 1;

  try {
    const { newAppointments } = await Patient.findById(req.patient);
    for (var i = 0; i < newAppointments.length; i++) {
      console.log("im here");
      const { doctor, date, from } = await Appointment.findById(
        newAppointments[i]._id
      );
      console.log(
        newAppointments[i]._id,
        new Date(appDate).toDateString(),
        date.toDateString()
      );
      if (doctor == drId) {
        throw new Error(
          "You already have an upcoming appointment with the same doctor"
        );
      } else if (
        from == appFrom &&
        date.toDateString() === new Date(appDate).toDateString()
      ) {
        console.log("you cannot");
        throw new Error("You already have an appointment at the same time");
      }
    }
    const session = await conn.startSession();
    await session.withTransaction(async () => {
      const appointment = await Appointment.create(
        [
          {
            _id: ObjectId(),
            patient: req.patient,
            doctor: drId,
            date: obj.date,
            from: appFrom,
            to: appTo,
            flowNumber: flowNumber,
            hospital: hospitalId,
          },
        ],
        { session }
      );
      await Patient.findByIdAndUpdate(
        req.patient,
        {
          $push: {
            newAppointments: appointment[0].id,
          },
        },
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
    console.log("success");
  } catch (error) {
    console.log("error");
    res.status(400).send(error.message);
  }
};

module.exports.cancelAppointment = async (req, res) => {
  const appointmentID = req.params.appointmentID;
  try {
    const { patient, doctor } = await Appointment.findById(appointmentID);
    const { schedule } = await Doctor.findById(doctor);
    const session = await conn.startSession();
    await session.withTransaction(async () => {
      await Appointment.findByIdAndDelete(appointmentID, { session });
      await Patient.findByIdAndUpdate(
        patient,
        {
          $pull: {
            newAppointments: appointmentID,
          },
        },
        { session }
      );

      for (var i = 0; i < schedule.length; i++) {
        if (schedule[i].AppointmentList.includes(appointmentID)) {
          var index = schedule[i].AppointmentList.indexOf(appointmentID);
          for (var j = index + 1; j < schedule[i].AppointmentList.length; j++) {
            const currentFlowNumber = await Appointment.findById(
              schedule[i].AppointmentList[j]
            ).select({ flowNumber: 1, _id: 0 });
            await Appointment.findByIdAndUpdate(
              schedule[i].AppointmentList[j],
              {
                $set: {
                  flowNumber: currentFlowNumber.flowNumber - 1,
                },
              },
              { session }
            );
          }
          schedule[i].AppointmentList.splice(index, 1);
        }
      }

      await Doctor.findByIdAndUpdate(
        doctor,
        {
          $set: {
            schedule: schedule,
          },
        },
        { session }
      );
    });
    session.endSession();
    res.status(200).send("Appointment cancelled successfully");
  } catch (err) {
    res.status(400).send("Error cancelling appointment");
  }
};

module.exports.getFlowOfEntrance = async (req, res) => {
  const { doctorId } = req.body;
  try {
    const { currentFlowNumber } = await Doctor.findOne({ _id: doctorId });
    res.status(200).send({ currentFlowNumber });
  } catch (err) {
    res.status(400).send(err.message);
  }
};

//function to update db scheudles most probably it will be moved to dr controller
// var intervalID = setInterval(myCallback, 5000);
async function myCallback() {
  const drs = await Doctor.find();
  for (dr of drs) {
    if (dr.isActive) {
      const schedules = dr.schedule;
      const drId = dr._id;
      const workingDays = dr.workingDays;
      let newSchedule = [];
      let flag = false;
      for (schedule of schedules) {
        if (
          (date.subtract(schedule.date, new Date(Date.now())).toDays() < 0) &
          (new Date(schedule.date).getDay() != new Date(Date.now()).getDay())
        ) {
          console.log("henaaa");
          flag = true;
        } else {
          newSchedule.push(schedule);
        }
      }

      if (flag) {
        //last day in schudles
        let length = dr.schedule.length;
        let arr = date.format(dr.schedule[length - 1].date, "ddd, MMM DD YYYY");
        let dayInDb = arr.split(",");
        let lastDayInDb = dayInDb[0];

        //index of that last day in working days in order to bring the next day after it
        let day = workingDays.find((o) => o.day === lastDayInDb.toLowerCase());
        const indexOfDay = workingDays.indexOf(day);

        //bringing next day in working days
        let nextDayIndex = 0;
        if (indexOfDay < workingDays.length - 1) nextDayIndex = indexOfDay + 1;

        //making new scheudle with that next day
        //el bafakr feh en ha-loop men 2wl el yom el 25eer fel schedule w hazwd yom kol mara
        //w akarn el ayam be asamyhom awl ma la2y el yom el ana 3awzah ha break el loop w a7ot fel schedule el gded
        let lastDayInSchedule = dr.schedule[length - 1].date;
        while (1) {
          let nextDay = date.addDays(lastDayInSchedule, 1);
          let arr = date.format(nextDay, "ddd, MMM DD YYYY");
          let x = arr.split(",");
          let nextDayInLetters = x[0];
          if (nextDayInLetters.toLowerCase() == workingDays[nextDayIndex].day) {
            addedSchedule = new Schedule({
              date: nextDay,
              to: workingDays[nextDayIndex].to,
              from: workingDays[nextDayIndex].from,
              AppointmentList: [],
            });
            newSchedule.push(addedSchedule);
            if (nextDayIndex != workingDays.length - 1) {
              if (
                workingDays[nextDayIndex].day ==
                workingDays[nextDayIndex + 1].day
              ) {
                addedSchedule = new Schedule({
                  date: nextDay,
                  to: workingDays[nextDayIndex + 1].to,
                  from: workingDays[nextDayIndex + 1].from,
                  AppointmentList: [],
                });
                newSchedule.push(addedSchedule);
              }
            }
            break;
          }
          lastDayInSchedule = nextDay;
        }
      }

      await Doctor.findByIdAndUpdate(drId, {
        $set: {
          schedule: newSchedule,
        },
      });
    }
  }
}
