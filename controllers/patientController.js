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

const decodeToken = (token) => {
  return jwt.verify(token, process.env.Token_Secret).id;
};

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "espitalia.app.gp",
    pass: "Espitalia@app.com",
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

module.exports.patientSignup = async (req, res) => {
  const { email, password, name, phoneNumber, dateOfBirth, questions } =
    req.body;
  try {
    const patient = await Patient.create({
      email,
      password,
      name,
      phoneNumber,
      dateOfBirth,
      questions,
    });
    const token = createToken(patient.id);
    sendOtp(patient.id, patient.name, patient.email);
    res.status(201).send(token);
  } catch (err) {
    res.status(400).send(err.message);
  }
};

module.exports.patientLogin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const patient = await Patient.patientLogin(email, password);
    const token = createToken(patient.id);
    if (!patient.verified) {
      sendOtp(patient.id, patient.name, patient.email);
      res.status(200).send({ verified: patient.verified, token });
    } else {
      await Patient.updateOne(patient, {
        loggedIn: true,
      });
      res.status(200).send({ verified: patient.verified, token });
    }
  } catch (err) {
    res.status(404).send(err.message);
  }
};

module.exports.patientLogout = async (req, res) => {
  const { token } = req.body;
  try {
    const patientId = decodeToken(token);
    await Patient.updateOne(
      { _id: patientId },
      {
        loggedIn: false,
      }
    );
    res.status(200).send("Logged Out");
  } catch (err) {
    res.status(400).send(err.message);
  }
};

module.exports.verifyAccount = async (req, res) => {
  const { otp, token, forgot } = req.body;
  try {
    const patientId = decodeToken(token);
    const waitingVerfication = await WaitingVerfication.findOne({
      patient: patientId,
    });
    if (otp == waitingVerfication.otp) {
      if (!forgot) {
        await Patient.updateOne(
          { _id: waitingVerfication.patient },
          {
            verified: true,
            loggedIn: true,
          }
        );
      }
      await WaitingVerfication.deleteOne({ patient: patientId });
      res.status(200).send("Verified");
    } else {
      res.status(400).send("Wrong Otp");
    }
  } catch (err) {
    res.status(400).send(err.message);
  }
};

// module.exports.resendOtp = async (req, res) => {
//     const { token } = req.body;
//     try {
//         const decodedToken = jwt.verify(token, 'Grad_Proj.Espitalia#SecRet.Application@30132825275');
//         sendOtp(patient.id, patient.name, patient.email);
//     } catch (err) {
//         res.status(400).send(err.message);
//     }
// }

module.exports.patientChangePassword = async (req, res) => {
  const { oldPassword, newPassword, token } = req.body;
  try {
    const patientId = decodeToken(token);
    const result = await Patient.changePassword(
      patientId,
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
  const { newPassword, token } = req.body;
  try {
    const patientId = decodeToken(token);
    const result = await Patient.forgotPassword(patientId, newPassword);
    res.status(200).send(result);
  } catch (err) {
    res.status(400).send(err.message);
  }
};

//search be el talata (array w ba push fyha beltartyb 0:drs 1:hospital 2:specialization)
module.exports.patientGeneralSerach = async (req, res) => {
  const search = req.params.search;
  const limitSize = 4;
  // var result = new Array();
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

  // result.push({ doctors: doctors });
  // result.push({ hospitals: hospitals });
  // result.push({ specializations: specializations });

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
  const doctors = await Doctor.find({ name: { $regex: ".*" + search + ".*" } });
  if (doctors.length === 0)
    return res.status(404).send("No doctors with that name found");
  res.send(doctors);
};

//search be Specialization bas
module.exports.searchSpecialization = async (req, res) => {
  const search = req.params.search;
  var specializations = await Specialization.find({
    name: { $regex: ".*" + search + ".*", $options: "i" },
  }).select({ name: 1 });
  if (specializations.length === 0)
    return res.status(404).send("No specializations with that name found");
  res.send({ specializations: specializations });
};

// module.exports.searchSpecialization = async (req, res) => {
//   const search = req.params.specialization;
//   try {
//     var specializations = await Specialization.find({
//       name: { $regex: ".*" + search + ".*", $options: "i" },
//     });
//     res.status(200).send(specializations);
//   } catch (error) {
//     res.status(404).send("No specialzations found");
//   }
// };

//search be specialization table
module.exports.patientSearchSpecialization = async (req, res) => {
  const search = req.params.search;
  var doctorDetails = [];
  try {
    const specializations = await Specialization.find({ name: search });
    console.log(specializations[0].doctorIds);
    for (var i = 0; i < specializations[0].doctorIds.length; i++) {
      const { _id, name, specialization, hospitalID, rating } =
        await Doctor.findById(specializations[0].doctorIds[i]);
      const hospitalInfo = await Hospital.findById(hospitalID).select({
        name: 1,
        address: 1,
        _id: 0,
      });
      doctorDetails.push({
        _id: _id,
        name: name,
        specialization: specialization,
        averageRating: rating,
        hospitalName: hospitalInfo.name,
        hospitalAddress: hospitalInfo.address,
      });
    }
    res.send(doctorDetails);
  } catch (error) {
    res.status(404).send(error.message);
  }
};

//search be hospital bas
module.exports.patientSearchHospital = async (req, res) => {
  const search = req.params.search;
  const hospitals = await Hospital.find({
    name: { $regex: ".*" + search + ".*" },
  });
  if (hospitals.length === 0)
    return res.status(404).send("No Hospitals with that name found");
  res.send(hospitals);
};

module.exports.getPatient = async (req, res) => {
  const token = req.params.token;

  try {
    const id = decodeToken(token);
    const patient = await Patient.findById(id).select({
      name: 1,
      phoneNumber: 1,
      email: 1,
      _id: 0,
    });
    // console.log(patient);
    res.send(patient);
  } catch (err) {
    res.status(400).send(err.message);
  }
};

module.exports.getNotification = async (req, res) => {
  const token = req.params.token;
  try {
    const id = decodeToken(token);
    const notification = await Notifications.find({ userID: id });
    console.log(notification);
    res.send(notification);
  } catch (err) {
    res.status(400).send(err.message);
  }
};

module.exports.isBloodReqUpdated = async (req, res) => {
  const { date } = req.params;
  console.log(date);
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
  const limitSize = 5;
  try {
    const bloodRequests = await BloodRequests.find()
      .sort({ date: -1, _id: 1 })
      .skip(skipNumber)
      .limit(limitSize);
    var requests = [];
    for (var i = 0; i < bloodRequests.length; i++) {
      var hospital = await Hospital.findById(bloodRequests[i].hospitalID);
      var date = new Date(bloodRequests[i].date);
      date.setHours(date.getHours() + 2);
      var req = {
        id: bloodRequests[i]._id,
        hospital_Name: hospital.name,
        bloodType: bloodRequests[i].bloodType,
        quantity: bloodRequests[i].quantity,
        date: date,
      };
      requests.push(req);
      // console.log(req);
    }
    res.status(200).send(requests);
  } catch (err) {
    res.status(400).send(err.message);
  }
};

//function when pressed on specefic hospital it will return its Specialization
module.exports.pressOnHospital = async (req, res) => {
  const id = req.params.id;
  try {
    const specialization = (await Hospital.find({ _id: id }))[0].specialization;
    if (specialization.length === 0)
      res.status(404).send("No specialzations found");
    else res.status(200).send(specialization);
  } catch (error) {
    res.status(404).send("No hospitals found");
  }
};

//return doctors in specefic hospital in specefic Specialization
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
      { $project: { _id: 1, name: 1 } },
      { $sample: { size: dataSize } },
    ]);

    for (var i = 0; i < dataSize; i++) {
      const { name, address } = await Hospital.findById(doctor[i].hospitalID);
      const { rating } = await Doctor.findById(doctor[i]._id);
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
        averageRating: rating,
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
  var allSpecializations = [];
  try {
    const specializationData = await Specialization.find().select({
      name: 1,
      _id: 0,
    });
    res.status(200).send(specializationData);
  } catch (err) {
    res.status(400).send(err.message);
  }
};

//Get Report
module.exports.selectReport = async (req, res) => {
  const appointmentID = req.params.id;
  try {
    const { doctor, hospital, date, report, prescription } =
      await Appointment.findById(appointmentID);
    const doctorData = await Doctor.findById(doctor);
    const hospitalData = await Hospital.findById(hospital);
    const d =
      date.getDate() + "-" + (date.getMonth() + 1) + "-" + date.getFullYear();
    const appointmentDetails = {
      drId: doctorData._id,
      hospitalName: hospitalData.name,
      drName: doctorData.name,
      specialization: doctorData.specialization,
      date: d,
      diagnosis: report,
      prescription: prescription,
    };
    res.status(200).send(appointmentDetails);
  } catch (err) {
    res.status(400).send(err.message);
  }
};

//Old Appointments
module.exports.oldAppointments = async (req, res) => {
  const token = req.params.token;
  try {
    const id = decodeToken(token);

    const { oldAppointments } = await Patient.findById(id);
    var appointmentDetails = [];
    for (var i = 0; i < oldAppointments.length; i++) {
      const { doctor, hospital, date } = await Appointment.findById(
        oldAppointments[i]._id
      );
      const d =
        date.getDate() + "-" + (date.getMonth() + 1) + "-" + date.getFullYear();
      const hospitalData = await Hospital.findById(hospital);
      const doctorData = await Doctor.findById(doctor);
      appointmentDetails.push({
        appointmentID: oldAppointments[i]._id,
        hospitalName: hospitalData.name,
        drName: doctorData.name,
        specialization: doctorData.specialization,
        date: d,
      });
    }
    res.status(200).send(appointmentDetails);
  } catch (err) {
    res.status(400).send(err.message);
  }
};

//Upcoming appointments
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

/*
    Edit Patient's Profile:
        function takes parameters : id, name, phone number, date of birth, and answers for the medical questions
        then, search for a patient with the associated id.
        when it finds the patient it  updates his record.
        if the patient is not found, the function return 404 error (not found error).
*/
module.exports.editProfile = async (req, res) => {
  // takes id from the reqest body
  const {
    token,
    name,
    phoneNumber,
    // , dateOfBirth, questions
  } = req.body;
  const patientId = decodeToken(token);
  const patient = await Patient.findByIdAndUpdate(patientId, {
    name: name,
    phoneNumber: phoneNumber,
    // dateOfBirth: dateOfBirth,
    // questions: questions,
  });
  if (!patient) return res.status(404).send("Patient not found");
  res.send(await Patient.findById(patientId));
};

module.exports.rateAndReview = async (req, res) => {
  const { rate, review, doctorId, token } = req.body;
  try {
    const patientId = decodeToken(token);

    const { name } = await Patient.findById(patientId);
    const { rating, reviews } = await Doctor.findById(doctorId);

    const numberOfReviews = reviews.length;

    const newRate =
      (rating * numberOfReviews + Number(rate)) / (numberOfReviews + 1);
    const date = new Date();
    await Doctor.findByIdAndUpdate(doctorId, {
      rating: newRate,
      $push: {
        reviews: [{ name: name, rating: rate, review: review, date: date }],
      },
    });

    // await Appointment.findByIdAndUpdate(
    //   appointmentID,
    //   {
    //     $set: {
    //       reviewd: true,
    //     },
    //   }
    // );
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

  try {
    const { name, hospitalID, reviews, schedule, rating, specialization } =
      await Doctor.findById(doctorId);

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
      const fullDate =
        schedule[i].date.getDate() +
        "-" +
        (schedule[i].date.getMonth() + 1) +
        "-" +
        schedule[i].date.getFullYear();
      scheduleDetails.push({
        date: schedule[i].date,
        from: schedule[i].from,
        to: schedule[i].to,
        displayDate: fullDate,
      });
    }
    res.status(200).send({ doctorData, reviewDetails, scheduleDetails });
  } catch (err) {
    res.status(400).send(err.message);
  }
};

module.exports.book = async (req, res) => {
  const { token, drId, date, from, to } = req.body;
  const doctor = await Doctor.findById(drId);
  const hospitalId = doctor.hospitalID;
  const schedule = doctor.schedule;

  //TODO: a5od el token adwr bi f new app. w kol app ashof 3ndha drId + date + from kda nfs le dr f nfs el m3a
  // lw fiha date+from kda mynf3sh nfs el m3ad m3 dr mo5tlf

  let obj = doctor.schedule.find(
    (o) =>
      (o.to === to) &
      (o.from === from) &
      (Date.parse(o.date) === Date.parse(date))
  );

  const indexOfScehdule = doctor.schedule.indexOf(obj);
  const flowNumber = obj.AppointmentList.length + 1;

  try {
    const userId = decodeToken(token);
    const session = await conn.startSession();
    await session.withTransaction(async () => {
      // const { newAppointments } = await Patient.findById(userId);

      // for (var i = 0; i < newAppointments.length; i++) {
      //   console.log("im here");
      //   // console.log(newAppointments.length);
      //   const { doctor, date, from } = await Appointment.findById(
      //     newAppointments[i]._id
      //   );
      //   console.log(newAppointment[i]._id, doctor, drId);
      //   /*FIXME: msh byd5ol hena khales
      //   doctor != drId
      //   msh 7sah by loop gher mara fa byshof el doctorId mo5tlf
      //   */
      //   if (doctor == drId && date == date && from == from) {
      //     console.log("You cannot book the same appointment twice");
      //   } else if (date == date && from == from) {
      //     console.log("You cannot book two appointments at the same time");
      //   }
      //   {
      //     session;
      //   }
      // }
      const appointment = await Appointment.create(
        [
          {
            _id: ObjectId(),
            patient: userId,
            doctor: drId,
            date: obj.date,
            from: from,
            to: to,
            flowNumber: flowNumber,
            hospital: hospitalId,
            reviewd: false,
          },
        ],
        { session }
      );
      await Patient.findByIdAndUpdate(
        userId,
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
    //console.log(x);
    session.endSession();
    res.status(200).send("Appointment successfully booked");
    console.log("success");
  } catch (error) {
    console.log("error");
    res.status(400).send("Error booking appointment");
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
//var intervalID = setInterval(myCallback, 5000);
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
