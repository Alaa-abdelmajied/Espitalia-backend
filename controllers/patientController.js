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

const createToken = (id) => {
  return jwt.sign({ id }, "Grad_Proj.Espitalia#SecRet.Application@30132825275");
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
    const decodedToken = jwt.verify(
      token,
      "Grad_Proj.Espitalia#SecRet.Application@30132825275"
    );
    await Patient.updateOne(
      { _id: decodedToken.id },
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
    const decodedToken = jwt.verify(
      token,
      "Grad_Proj.Espitalia#SecRet.Application@30132825275"
    );
    const waitingVerfication = await WaitingVerfication.findOne({
      patient: decodedToken.id,
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
      await WaitingVerfication.deleteOne({ patient: decodedToken.id });
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
    const decodedToken = jwt.verify(
      token,
      "Grad_Proj.Espitalia#SecRet.Application@30132825275"
    );
    const result = await Patient.changePassword(
      decodedToken.id,
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
      res.status(201).send(token);
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
    const decodedToken = jwt.verify(
      token,
      "Grad_Proj.Espitalia#SecRet.Application@30132825275"
    );
    const result = await Patient.forgotPassword(decodedToken.id, newPassword);
    res.status(200).send(result);
  } catch (err) {
    res.status(400).send(err.message);
  }
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
// module.exports.patientSearchSpecialization = async (req,res) => {
//     const search = req.params.search;
//     const specializations = await Doctor.find({specialization:{$regex: ".*" + search + ".*"}});
//     if(specializations.length === 0) return res.status(404).send('No specializations with that name found');
//     res.send(specializations);
// }

//search be specialization table
module.exports.patientSearchSpecialization = async (req, res) => {
  const search = req.params.search;
  try {
    const specializations = await Specialization.find({ name: search });
    console.log(specializations[0].doctorIds);
    res.send(specializations[0].doctorIds);
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
  const { id } = req.body;

  try {
    const patient = await Patient.find({ _id: id });
    //console.log(patient);
    res.send(patient);
  } catch (err) {
    res.status(400).send(err.message);
  }
};

module.exports.getNotification = async (req, res) => {
  try {
    const id = req.body;
    const notification = await Notifications.find({ userID: id });
    console.log(notification);
    res.send(notification);
  } catch (err) {
    res.status(400).send(err.message);
  }
};

module.exports.getBloodRequests = async (req, res) => {
  try {
    const bloodRequests = await BloodRequests.find().limit(5);
    var requests = [];
    for (var i = 0; i < bloodRequests.length; i++) {
      var hospital = await Hospital.findById(bloodRequests[i].hospitalID);
      var req = {
        id: bloodRequests[i]._id,
        hospital_Name: hospital.name,
        bloodType: bloodRequests[i].bloodType,
        quantity: bloodRequests[i].quantity,
      };
      requests.push(req);
      console.log(req);
    }
    res.send(requests);
  } catch (err) {
    res.status(400).send(err.message);
  }
};

//search be el talata (array w ba push fyha beltartyb 0:drs 1:hospital 2:specialization)
module.exports.patientGeneralSerach = async (req, res) => {
  const search = req.params.search;
  const limitSize = 3;
  var result = new Array();
  var doctors = await Doctor.find({
    name: { $regex: ".*" + search + ".*" },
  }).limit(limitSize);

  var hospitals = await Hospital.find({
    name: { $regex: ".*" + search + ".*" },
  }).limit(limitSize);

  console.log(hospitals.length);
  var specializations = await Specialization.find({
    name: { $regex: ".*" + search + ".*" },
  }).limit(limitSize);

  if (hospitals.length > limitSize) {
    hospitals.pop();
  }

  result.push({ doctors: doctors });
  result.push({ hospitals: hospitals });
  result.push({ specializations: specializations });

  if (
    (result[0].length === 0) &
    (result[1].length === 0) &
    (result[2].length === 0)
  )
    return res
      .status(404)
      .send("No hospitals or doctors or specializations found");
  res.status(200).send(result);
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
  }).select({ name: 1, specialization: 1, _id: 1 });
  if (doctors.length === 0) res.status(404).send("No doctors here");
  else res.status(200).send(doctors);
};

//Display Homepage
module.exports.displayHomepage = async (req, res) => {
  var homepageData = [];
  const dataSize = 5;
  try {
    const doctor = await Doctor.aggregate([
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

    for (var i = 0; i < dataSize; i++) {
      const doctorHospitalData = await Hospital.findById(doctor[i].hospitalID);
      homepageData.push({
        hospitalID: hospital[i]._id,
        hospitalName: hospital[i].name,
        hospitalAddress: hospital[i].address,
        drID: doctor[i]._id,
        drName: doctor[i].name,
        speciality: doctor[i].specialization,
        doctorHospitalName: doctorHospitalData.name,
        doctorHospitalAddress: doctorHospitalData.address,
      });
    }
    res.status(200).send(homepageData);
  } catch (err) {
    res.status(400).send(err.message);
  }
};

module.exports.seeAllDoctors = async (req, res) => {
  var allDoctors = [];
  try {
    const doctorData = await Doctor.find().select({
      _id: 1,
      name: 1,
      specialization: 1,
      hospitalID: 1,
    });
    for (var i = 0; i < doctorData.length; i++) {
      const doctorHospitalData = await Hospital.findById(
        doctorData[i].hospitalID
      );
      allDoctors.push({
        _id: doctorData[i]._id,
        name: doctorData[i].name,
        specialization: doctorData[i].specialization,
        doctorHospitalName: doctorHospitalData.name,
        doctorHospitalAddress: doctorHospitalData.address,
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
  const token = req.params.id;
  try {
    const { id } = jwt.verify(
      token,
      "Grad_Proj.Espitalia#SecRet.Application@30132825275"
    );
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
  const token = req.params.id;
  try {
    const { id } = jwt.verify(
      token,
      "Grad_Proj.Espitalia#SecRet.Application@30132825275"
    );
    const { newAppointments } = await Patient.findById(id);
    var appointmentDetails = [];
    for (var i = 0; i < newAppointments.length; i++) {
      const { doctor, hospital, date, flowNumber } = await Appointment.findById(
        newAppointments[i]._id
      );
      const d =
        date.getDate() + "-" + (date.getMonth() + 1) + "-" + date.getFullYear();
      const hospitalData = await Hospital.findById(hospital);
      const doctorData = await Doctor.findById(doctor);
      appointmentDetails.push({
        appointmentID: newAppointments[i]._id,
        hospitalName: hospitalData.name,
        drName: doctorData.name,
        specialization: doctorData.specialization,
        date: d,
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
  const { id, name, phoneNumber, dateOfBirth, questions } = req.body;
  const patient = await Patient.findByIdAndUpdate(id, {
    name: name,
    phoneNumber: phoneNumber,
    dateOfBirth: dateOfBirth,
    questions: questions,
  });
  if (!patient) return res.status(404).send("Patient not found");
  res.send(await Patient.findById(id));
};

module.exports.rateDoctor = async (req, res) => {
  const { token, doctorId, rate } = req.body;
  try {
    const decodedToken = jwt.verify(
      token,
      "Grad_Proj.Espitalia#SecRet.Application@30132825275"
    );
    const { name } = await Patient.findOne({ _id: decodedToken.id });
    const doctor = await Doctor.findOne({ _id: doctorId });
    const numberOfReviews = doctor.workingDays.length;
    const newRate =
      (doctor.rating * numberOfReviews + Number(rate)) / (numberOfReviews + 1);
    res.status(200).send({ newRate, name });
  } catch (err) {
    res.status(400).send(err.message);
  }
};

//Review dr
module.exports.reviewDoctor = async (req, res) => {
  const { review, doctorID, userID } = req.body;
  try {
    const { name } = await Patient.findOne({ _id: userID });
    await Doctor.findByIdAndUpdate(
      { _id: doctorID },
      { $push: { reviews: [name, review] } }
    );
    const doctor = await Doctor.findOne({ _id: doctorID });
    const date = new Date();
    const fullDate =
      date.getDate() + "-" + date.getMonth() + "-" + date.getFullYear();
    const reviewDetails = [
      { name: name },
      { date: fullDate },
      { rating: doctor.rating },
      { review: review },
    ];
    console.log(reviewDetails);
    res.status(200).send(reviewDetails);
  } catch (err) {
    res.status(400).send(err.message);
  }
};

module.exports.book = async (req, res) => {
  const { userId, drId, date, from, to } = req.body;

  const doctor = await Doctor.findById(drId);

  const hospitalId = doctor.hospitalID;

  const schedule = doctor.schedule;

  let obj = doctor.schedule.find(
    (o) =>
      (o.to === to) &
      (o.from === from) &
      (Date.parse(o.date) === Date.parse(date))
  );

  const indexOfScehdule = doctor.schedule.indexOf(obj);

  const flowNumber = obj.AppointmentList.length + 1;

  try {
    const session = await conn.startSession();
    await session.withTransaction(async () => {
      const appointment = await Appointment.create(
        [
          {
            _id: ObjectId(),
            patient: userId,
            doctor: drId,
            date: obj.date,
            flowNumber: flowNumber,
            hospital: hospitalId,
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
    console.log("success");
  } catch (error) {
    console.log("error");
  }
};

module.exports.cancelAppointment = async (req, res) => {
  const { appointmentID, from, to } = req.body;
  try {
    const { patient, doctor, date } = await Appointment.findById(appointmentID);
    const dr = await Doctor.findById(doctor);
    const schedule = dr.schedule;

    let obj = dr.schedule.find(
      (o) =>
        (o.to === to) &
        (o.from === from) &
        (Date.parse(o.date) === Date.parse(date))
    );

    const indexOfScehdule = dr.schedule.indexOf(obj);

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

      for (var i = 0; i < obj.AppointmentList.length; i++) {
        if (obj.AppointmentList[i] == appointmentID) {
          obj.AppointmentList.splice(i, 1);
        }
      }
      schedule[indexOfScehdule] = obj;
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
    console.log("success");
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

module.exports.getFlowOfEntrance = async (req, res) => {
  const { id } = req.params;
  try {
    const { currentFlowNumber } = await Doctor.findOne({ _id: id });
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
              workingDays[nextDayIndex].day == workingDays[nextDayIndex + 1].day
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
