const Patient = require('../models/Patient');
const WaitingVerfication = require('../models/WaitingVerfication');

const nodemailer = require('nodemailer');
const otpGenerator = require('otp-generator');
const jwt = require('jsonwebtoken');

// const maxAge = 3 * 24 * 60 * 60;
const createToken = (id) => {
    return jwt.sign({ id }, 'Grad_Proj.Espitalia#SecRet.Application@30132825275'/*, {
        expiresIn: maxAge
    }*/);
};

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'espitalia.app.gp',
        pass: 'Espitalia@app.com'
    }
});

const checkToken = (token) => {
    //check if token is valid and refresh it if its about to expire
    // do i need to refresh it ?

}

// module.exports.test = async (req, res) => {
//     const { token } = req.body;
//     const { id, iat, exp } = jwt.verify(token, 'Grad_Proj.Espitalia#SecRet.Application@30132825275');
//     res.send('id is:' + id + " " + iat + " " + exp);
//     // const d = new Date;
//     // let time = d.getTime();
//     // res.send('time is ' + time + " " + exp*1000);
// }

module.exports.patientSignup = async (req, res) => {
    const { email, password, name, phoneNumber,
        dateOfBirth, questions } = req.body;
    try {
        const patient = await Patient.create({
            email, password, name, phoneNumber,
            dateOfBirth, questions
        });
        const otp = otpGenerator.generate(5, {
            digits: true, upperCaseAlphabets: false,
            lowerCaseAlphabets: false, specialChars: false
        });
        const patientId = patient.id;
        const token = createToken(patientId);
        const waitingVerfication = await WaitingVerfication.create({
            patient: patientId,
            otp: otp
        });
        const confirmationMail = {
            from: 'espitalia.app.gp@gmail.com',
            to: email,
            subject: 'Verify your account',
            html: 'Dear ' + name + ',<br/><br/>Welcome to Espitalia.<br/><br/> Please enter this code in the application: <br/>' + otp + '<br/><br/>Thanks and regards , <br/>      Espitalia'
        }
        transporter.sendMail(confirmationMail, function (error, info) {
            if (error) {
                console.log("Email" + error);
            } else {
                console.log('Email sent: ' + info.response);
            }
        });
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
        res.status(200).send(token);
    } catch (err) {
        res.status(400).send(err.message);
    }
}

module.exports.verifyAccount = async (req, res) => {
    const { otp, token } = req.body;
    try {
        const decodedToken = jwt.verify(token, 'Grad_Proj.Espitalia#SecRet.Application@30132825275');
        const waitingVerfication = await WaitingVerfication.findOne(decodedToken);
        if (otp == waitingVerfication.otp) {
            const patient = await Patient.findOne(waitingVerfication.account);
            await Patient.updateOne(patient, {
                verified: true
            });
            await WaitingVerfication.deleteOne(decodedToken);
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
        const patient = await Patient.findOne(decodedToken);
        const result = await Patient.changePassword(patient.email, oldP, newPassword);
        // const hashedPassword = await Patient.hashPassword(newPassword);
        // await Patient.updateOne(patient, {
        //     password: hashedPassword
        // });
        res.status(200).send(result);
    } catch (err) {
        res.status(400).send(err.message);
    }
}