const Patient = require('../models/Patient');
const Notifications = require('../models/Notifications');
const BloodRequests = require('../models/BloodRequests');
const Doctor = require('../models/Doctor');
const Hospital = require('../models/Hospital');
const Appointment = require('../models/Appointment');
const Specialization = require('../models/Specialization');
const WaitingVerfication = require('../models/WaitingVerfication');

const nodemailer = require('nodemailer');
const otpGenerator = require('otp-generator');
const jwt = require('jsonwebtoken');


const createToken = (id) => {
    return jwt.sign({ id }, 'Grad_Proj.Espitalia#SecRet.Application@30132825275');
};

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'espitalia.app.gp',
        pass: 'Espitalia@app.com'
    }
});

const sendOtp = async (patientId, patientName, email) => {
    const otp = otpGenerator.generate(5, {
        digits: true, upperCaseAlphabets: false,
        lowerCaseAlphabets: false, specialChars: false
    });
    const account = await WaitingVerfication.findOne({ patient: patientId });
    console
    if (account) {
        await WaitingVerfication.updateOne(account, {
            otp: otp
        });
    } else {
        await WaitingVerfication.create({
            patient: patientId,
            otp: otp
        });
    }
    const confirmationMail = {
        from: 'espitalia.app.gp@gmail.com',
        to: email,
        subject: 'Verify your account',
        html: 'Dear ' + patientName + ',<br/><br/>Welcome to Espitalia.<br/><br/> Please enter this code in the application: <br/>' + otp + '<br/><br/>Thanks and regards , <br/>      Espitalia'
    }
    transporter.sendMail(confirmationMail, function (error, info) {
        if (error) {
            console.log("Email" + error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
}

module.exports.patientSignup = async (req, res) => {
    const { email, password, name, phoneNumber,
        dateOfBirth, questions } = req.body;
    try {
        const patient = await Patient.create({
            email, password, name, phoneNumber,
            dateOfBirth, questions
        });
        const token = createToken(patient.id);
        sendOtp(patient.id, patient.name, patient.email);
        res.status(201).send(token);
    } catch (err) {
        res.status(400).send(err.message);
    }
}

module.exports.patientLogin = async (req, res) => {
    const { email, password } = req.body;
    try {
        const patient = await Patient.patientLogin(email, password);
        const token = createToken(patient.id);
        if (!patient.verified) {
            sendOtp(patient.id, patient.name, patient.email);
            res.status(200).send({ verified: patient.verified, token })
        } else {
            await Patient.updateOne(patient, {
                loggedIn: true
            });
            res.status(200).send({ verified: patient.verified, token })
        }
    } catch (err) {
        res.status(400).send(err.message);
    }
}

module.exports.patientLogout = async (req, res) => {
    const { token } = req.body;
    try {
        const decodedToken = jwt.verify(token, 'Grad_Proj.Espitalia#SecRet.Application@30132825275');
        await Patient.updateOne({ _id: decodedToken.id }, {
            loggedIn: false
        });
        res.status(200).send('Logged Out');
    } catch (err) {
        res.status(400).send(err.message);
    }
}

module.exports.verifyAccount = async (req, res) => {
    const { otp, token, forgot } = req.body;
    try {
        const decodedToken = jwt.verify(token, 'Grad_Proj.Espitalia#SecRet.Application@30132825275');
        const waitingVerfication = await WaitingVerfication.findOne({ patient: decodedToken.id });
        if (otp == waitingVerfication.otp) {
            if (!forgot) {
                // const patient = await Patient.findOne({ _id: waitingVerfication.patient });
                await Patient.updateOne({ _id: waitingVerfication.patient }, {
                    verified: true,
                    loggedIn: true
                });
            }
            await WaitingVerfication.deleteOne({ patient: decodedToken.id });
            res.status(200).send('Verified');
        } else {
            res.status(400).send('Wrong Otp');
        }
    } catch (err) {
        res.status(400).send(err.message);
    }
}

module.exports.patientChangePassword = async (req, res) => {
    const { oldPassword, newPassword, token } = req.body;
    try {
        const decodedToken = jwt.verify(token, 'Grad_Proj.Espitalia#SecRet.Application@30132825275');
        const result = await Patient.changePassword(decodedToken.id, oldPassword, newPassword);
        res.status(200).send(result);
    } catch (err) {
        res.status(400).send(err.message);
    }
}

module.exports.patientForgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        const patient = await Patient.findOne({ email });
        if (patient) {
            sendOtp(patient.id, patient.name, patient.email);
            const token = createToken(patient.id);
            res.status(201).send(token);
        } else {
            res.status(404).send('This email does not exist');
        }
    } catch (err) {
        res.status(400).send(err.message);
    }
}

module.exports.patientForgotPasswordChange = async (req, res) => {
    const { newPassword, token } = req.body;
    try {
        const decodedToken = jwt.verify(token, 'Grad_Proj.Espitalia#SecRet.Application@30132825275');
        const result = await Patient.forgotPassword(decodedToken.id, newPassword);
        res.status(200).send(result);
    } catch (err) {
        res.status(400).send(err.message);
    }
}

//search be asma2 el drs bas
module.exports.patientSearchDoctor = async (req, res) => {
    const search = req.params.search;
    const doctors = await Doctor.find({ name: { $regex: ".*" + search + ".*" } });
    if (doctors.length === 0) return res.status(404).send('No doctors with that name found');
    res.send(doctors);

}

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
}


//search be hospital bas
module.exports.patientSearchHospital = async (req, res) => {
    const search = req.params.search;
    const hospitals = await Hospital.find({ name: { $regex: ".*" + search + ".*" } });
    if (hospitals.length === 0) return res.status(404).send('No Hospitals with that name found');
    res.send(hospitals);

}


module.exports.getNotification = async (req, res) => {

    try {
        const notification = await Notifications.find();
        console.log(notification);
        res.send(notification);
    }
    catch (err) {
        res.status(400).send(err.message);
    }
}

//search be el talata (array w ba push fyha beltartyb 0:drs 1:hospital 2:specialization)
module.exports.patientGeneralSerach = async (req, res) => {
    const search = req.params.search;
    var result = new Array();
    var doctors = await Doctor.find({ name: { $regex: ".*" + search + ".*" } });
    var hospitals = await Hospital.find({ name: { $regex: ".*" + search + ".*" } });
    var specializations = await Doctor.find({ specialization: { $regex: ".*" + search + ".*" } });

    result.push(doctors);
    result.push(hospitals);
    result.push(specializations);

    if (result[0].length === 0 & result[1].length === 0 & result[2].length === 0) return res.status(404).send('No hospitals or doctors or specializations found');
    res.send(result);

}

//function when pressed on specefic hospital it will return its Specialization
module.exports.pressOnHospital = async (req, res) => {
    const id = req.params.id;
    try {
        const specialization = (await Hospital.find({ _id: id }))[0].specialization;
        res.send(specialization);
    } catch (error) {
        res.status(404).send('No specialization found');
    }

}

//return doctors in specefic hospital in specefic Specialization
module.exports.pressOnHospitalThenSpecialization = async (req, res) => {
    const id = req.params.id;
    const search = req.params.search;
    const doctors = await Doctor.find({ hospital_id: id, specialization: search });
    if (doctors.length === 0) return res.status(404).send('No doctors here');
    res.send(doctors);
}


//Display Homepage 
module.exports.displayHomepage = async (req, res) => {
    try {
        const doctor = await Doctor.aggregate([{ $project: { _id: 0, "name": 1, "specialization": 1, "rating": 1 } }, { '$sample': { 'size': 5 } }]);
        const hospital = await Hospital.aggregate([{ $project: { _id: 0, "Name": 1, "Address": 1 } }, { '$sample': { 'size': 5 } }]);
        const homepage_data = [doctor, hospital];
        res.status(200).send(homepage_data);
    } catch (err) {
        res.status(400).send(err.message);
    }
}

//See More
module.exports.seeMore = async (req, res) => {
    try {
        const doctor_data = await Doctor.find().select({ name: 1, specialization: 1, rating: 1, _id: 0 });
        const hospital_data = await Hospital.find().select({ name: 1, address: 1, _id: 0 });
        const homepage_data = [doctor_data, hospital_data];
        res.status(200).send(homepage_data);
    } catch {
        res.status(400).send(err.message);
    }
}

//Get Report
module.exports.selectReport = async (req, res) => {
    const { appointmentID } = req.body;
    try {
        const appointment = await Appointment.findOne({ _id: appointmentID });
        const doctor = await Doctor.findOne({ _id: appointment.doctor });
        const hospital = await Hospital.findOne({ _id: appointment.hospital });
        const appointment_details = [{ dname: doctor.name }, { specialization: doctor.specialization }, { hname: hospital.name }, { date: appointment.date }, { report: appointment.report }, { prescription: appointment.prescription }];
        res.status(200).send(appointment_details);
    } catch (err) {
        res.status(400).send(err.message);
    }
}

module.exports.editProfile = async (req, res) => {
    // takes id from the reqest body
    const {
        id,
        name,
        phoneNumber,
        dateOfBirth,
        questions,
    } = req.body;
    const patient = await Patient.findByIdAndUpdate(id, { name: name, phoneNumber: phoneNumber, dateOfBirth: dateOfBirth, questions: questions });
    if (!patient) return res.status(404).send("Patient not found");
    res.send(await Patient.findById(id));
}

