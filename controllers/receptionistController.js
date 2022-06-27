const fetch = require('node-fetch');
const { Doctor, Schedule } = require('../models/Doctor');
const BloodRequest = require('../models/BloodRequests');
const Receptionist = require('../models/Receptionist');
const Patient = require('../models/Patient');
const { array, date } = require('joi');
const jwt = require('jsonwebtoken');
const nodemailer = require("nodemailer");
const otpGenerator = require("otp-generator");
const Hospital = require('../models/Hospital');
const Appointment = require('../models/Appointment');
const OfflinePatient = require('../models/OfflinePatient');
const Notification = require('../models/Notifications');
const WaitingVerfication = require("../models/WaitingVerfication");

const ObjectId = require("mongodb").ObjectId;

const conn = require("../db");

const createToken = (id) => {
  return jwt.sign({ _id: id }, "PrivateKey");
};

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "espitalia.app.gp",
    pass: "ovxfmxqneryirltk",
  },
});

const sendOtp = async (receptionistId, receptionistName, email) => {
  const otp = otpGenerator.generate(5, {
    digits: true,
    upperCaseAlphabets: false,
    lowerCaseAlphabets: false,
    specialChars: false,
  });
  const account = await WaitingVerfication.findOne({ user: receptionistId });
  console;
  if (account) {
    await WaitingVerfication.updateOne(account, {
      otp: otp,
    });
  } else {
    await WaitingVerfication.create({
      user: receptionistId,
      otp: otp,
    });
  }
  const confirmationMail = {
    from: "espitalia.app.gp@gmail.com",
    to: email,
    subject: "Verify your account",
    html:
      "Receptionist " +
      receptionistName +
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
    const receptionist = await Receptionist.receptionistLogin(email, password);
    if (!receptionist) return res.status(400).send('bad request');
    const token = receptionist.generateAuthToken();
    res.header('x-auth-token', token).send(receptionist);
  }
  catch (error) {
    res.status(400).send(error);
  }
}

module.exports.verifyAccount = async (req, res) => {
  const { otp } = req.body;
  try {
    const waitingVerfication = await WaitingVerfication.findOne({
      user: req.receptionist._id,
    });
    if (otp == waitingVerfication.otp) {
      await WaitingVerfication.deleteOne({ user: req.receptionist._id });
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
    const { name, email } = await Receptionist.findById(req.receptionist._id);
    sendOtp(req.receptionist._id, name, email);
    res.status(200).send();
  } catch (err) {
    res.status(400).send(err.message);
  }
};

module.exports.changePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  try {
    const result = await Receptionist.changePassword(
      req.receptionist._id,
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
    const receptionist = await Receptionist.findOne({ email });
    if (receptionist) {
      sendOtp(receptionist.id, receptionist.name, receptionist.email);
      const token = createToken(receptionist.id);
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
    const result = await Receptionist.forgotPassword(req.receptionist._id, newPassword);
    res.status(200).send(result);
  } catch (err) {
    res.status(400).send(err.message);
  }
};

module.exports.CreateBloodRequest = async (req, res) => {
  const { bloodType } = req.body;
  const receptionistID = req.receptionist._id;
  var hospitalID = await Receptionist.findById(receptionistID).select("hospitalID -_id");
  hospitalID = hospitalID.hospitalID;
  var hospital = await Hospital.findOne({ _id: hospitalID }).select("name -_id");
  console.log(hospital.name);
  const tokens = await Patient.find().select("fcmToken -_id");
  // console.log(tokens);
  var request;
  try {
    request = await BloodRequest.create({
      bloodType,
      hospitalID,
      receptionistID
    });
    // console.log(request);
    // return res.status(200).send(request);
  }
  catch (err) {
    res.status(400).send(err);
    return;
  }
  sendNotification(tokens, hospital, bloodType);
  res.status(200).send(request);
  // res.status(200).send("Request sent successfully");
}

const sendNotification = async (tokens, hospital, bloodType) => {
  for (var i = 0; i < tokens.length; i++) {
    var token = tokens[i].fcmToken;
    if (token === undefined || token === '')
      continue;
    console.log({token});
    var response = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'key=AAAACuOwo1M:APA91bEXOxZzUg_14sDwUZV7oDq3zIs9CqYBhzpclvbdxUldhg7gn4O7dAoZ2lTRYRsfoRaJKD_V0iT0kOdqcxQMWGE6sLEKXAtW1tQ2j-56FV-cLlN2MfmNftTkSWq_smPfYzfRz6qo'
      },
      body: JSON.stringify({
        to: `${token}`,
        collapse_key: "type_a",
        notification: {
          title: `Blood Request at ${hospital.name}`,
          body: `New Blood Request: ${bloodType} blood needed in ${hospital.name} ASAP!`,
          icon: "ic_launcher",
          sound: "default"
        },
        data: {
          body: "New Blood Request",
          icon: "ic_launcher",
          title: "Blood Request for " + bloodType,
          key_1: "Value for key_1",
          key_2: "Value for key_2"
        }
      })
    }).then((response) => {
      response.json();

    }).catch(function (error) {
      console.log(error);
    });
    console.log({ response });
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

module.exports.finalizeBloodRequest = async (req, res) => {
  const { id } = req.body;
  try {
    console.log(id);
    const request = await BloodRequest.findByIdAndUpdate(id, { isVisible: false });
    res.status(200).send("Finalized");
  }
  catch (err) {
    res.status(400).send(err);
  }
}

module.exports.getBloodRequests = async (req, res) => {
  try {
    var hospitalID = await Receptionist.findById(req.receptionist._id).select("hospitalID -_id");
    hospitalID = hospitalID.hospitalID;
    const requests = await BloodRequest.find({ hospitalID: hospitalID, isVisible: true }).sort({ date: -1 });
    res.send(requests);
  }
  catch (err) {
    res.status(400).send("error");
  }
}

module.exports.getOldBloodRequests = async (req, res) => {
  try {
    var hospitalID = await Receptionist.findById(req.receptionist._id).select("hospitalID -_id");
    hospitalID = hospitalID.hospitalID;
    const requests = await BloodRequest.find({ hospitalID: hospitalID, isVisible: false }).sort({ date: -1 });
    res.send(requests);
  }
  catch (err) {
    res.status(400).send("error");
  }
}

// module.exports.EditReservation = async (req,res) => {

// }

module.exports.GetSpecializations = async (req, res) => {
  try {
    const receptionist = await Receptionist.findById(req.receptionist._id);
    const hospitalID = await receptionist.hospitalID;
    console.log("Hospital ID:" + hospitalID);
    const hospital = await Hospital.findOne({ _id: hospitalID });
    res.send(hospital.specialization);
  }
  catch (err) {
    res.status(400).send(err);
  }

}

module.exports.searchSpecializations = async (req, res) => {
  console.log
  try {
    const receptionist = await Receptionist.findById(req.receptionist._id);
    const hospitalID = await receptionist.hospitalID;
    const hospital = await Hospital.findOne({ _id: hospitalID });
    let search = req.params.search;

    // console.log(hospital.specialization);
    let array = [];
    search = ".*" + search + ".*";
    //console.log(search);
    for (var i = 0; i < hospital.specialization.length; i++) {
      if (hospital.specialization[i].toUpperCase().match(search.toUpperCase()))
        array.push(hospital.specialization[i]);
    }
    console.log(array);
    res.status(200).send(array);
  } catch {
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

module.exports.getAppointmentsList = async (req, res) => {
  const { doctorID, scheduleID } = req.params;
  try {
    const doctor = await Doctor.findById(doctorID);
    const schedule = doctor.schedule.find((o) => (o._id == scheduleID));
    const appointments = [];
    var result = [];
    for (var i = 0; i < schedule.AppointmentList.length; i++) {
      const appointment = await Appointment.findById(schedule.AppointmentList[i]);
      var patient = await Patient.findById(appointment.patient).select('name _id phoneNumber');
      if (patient == null) {
        patient = await OfflinePatient.findById(appointment.patient).select('name _id phoneNumber');
      }
      const tuple = {
        _id: appointment._id,
        name: patient.name,
        phoneNumber: patient.phoneNumber,
        flowNumber: appointment.flowNumber
      };
      result.push(tuple);
    }
    res.send(result);
  }
  catch (error) {
    res.status(404).send('ERROR: not Found');
  }
}

module.exports.cancelAppointment = async (req, res) => {
  const { appointmentID } = req.body;
  try {
    const { patient, doctor } = await Appointment.findById(appointmentID);
    var fcmToken = await Patient.findById(patient).select('fcmToken -_id');
    fcmToken = fcmToken.fcmToken;
    const { schedule } = await Doctor.findById(doctor);
    const session = await conn.startSession();
    await session.withTransaction(async () => {
      await Appointment.findByIdAndDelete(appointmentID, { session });
      var patient_ = await OfflinePatient.findById(patient);
      if (patient_ == null) {
        await Patient.findByIdAndUpdate(
          patient,
          {
            $pull: {
              newAppointments: appointmentID,
            },
          },
          { session }
        );
      }
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
    var response = await fetch(`https://fcm.googleapis.com/fcm/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `key=AAAACuOwo1M:APA91bEXOxZzUg_14sDwUZV7oDq3zIs9CqYBhzpclvbdxUldhg7gn4O7dAoZ2lTRYRsfoRaJKD_V0iT0kOdqcxQMWGE6sLEKXAtW1tQ2j-56FV-cLlN2MfmNftTkSWq_smPfYzfRz6qo`
      },
      body: JSON.stringify({
        to: fcmToken,
        notification: {
          title: 'Appointment Cancelled',
          body: 'Your appointment might been cancelled, please check your appointments list',
          sound: 'default',
          click_action: 'FCM_PLUGIN_ACTIVITY',
          icon: 'https://i.ibb.co/Ps2q5mL/ic-launcher.png'
        },
        data: {
          message: 'Your appointment has been cancelled, please check your appointments list',
          title: 'Appointment Cancelled',
          sound: 'default',
          click_action: 'FCM_PLUGIN_ACTIVITY',
          icon: 'https://i.ibb.co/Ps2q5mL/ic-launcher.png'
        }
      })
    }).then((response) => {
      response.json();

    }).catch(function (error) {
      console.log(error);
    });
    console.log({ response });
    res.status(200).send("Appointment cancelled successfully");
  }
  catch (error) {
    res.status(400).send("Error cancelling appointment");
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


