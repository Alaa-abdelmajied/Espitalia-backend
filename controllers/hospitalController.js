const Hospital = require('../models/Hospital');
const _ = require('lodash');
const { Doctor, Schedule } = require('../models/Doctor');
const Receptionist = require('../models/Receptionist');
const Specialization = require('../models/Specialization');
const WaitingVerfication = require("../models/WaitingVerfication");
const ObjectId = require("mongodb").ObjectId;

const jsonwebtoken = require('jsonwebtoken');
const jwt = require('jsonwebtoken');
const date = require('date-and-time');
const nodemailer = require("nodemailer");
const otpGenerator = require("otp-generator");
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

const sendOtp = async (hospitalId, hospitalName, email) => {
    const otp = otpGenerator.generate(5, {
        digits: true,
        upperCaseAlphabets: false,
        lowerCaseAlphabets: false,
        specialChars: false,
    });
    const account = await WaitingVerfication.findOne({ user: hospitalId });
    console;
    if (account) {
        await WaitingVerfication.updateOne(account, {
            otp: otp,
        });
    } else {
        await WaitingVerfication.create({
            user: hospitalId,
            otp: otp,
        });
    }
    const confirmationMail = {
        from: "espitalia.app.gp@gmail.com",
        to: email,
        subject: "Forgot Password",
        html:
            hospitalName +
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


/*
DONE:
*/
module.exports.Login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const hospital = await Hospital.hospitalLogin(email, password);
        const token = hospital.generateAuthToken();
        res.header('x-auth-token', token).send(hospital);
    } catch (e) {
        res.status(400).send(e.message);
    }
}

module.exports.verifyAccount = async (req, res) => {
    const { otp } = req.body;
    try {
        const waitingVerfication = await WaitingVerfication.findOne({
            user: req.hospital._id,
        });
        if (otp == waitingVerfication.otp) {
            await WaitingVerfication.deleteOne({ user: req.hospital._id });
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
        const { name, email } = await Hospital.findById(req.hospital._id);
        sendOtp(req.hospital._id, name, email);
        res.status(200).send();
    } catch (err) {
        res.status(400).send(err.message);
    }
};

module.exports.changePassword = async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    try {
        const result = await Hospital.changePassword(
            req.hospital._id,
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
        const hospital = await Hospital.findOne({ email });
        if (hospital) {
            sendOtp(hospital.id, hospital.name, hospital.email);
            const token = createToken(hospital.id);
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
        const result = await Hospital.forgotPassword(req.hospital._id, newPassword);
        res.status(200).send(result);
    } catch (err) {
        res.status(400).send(err.message);
    }
};

/*
TODO:
    remove the token which is used to authenticate the user to perform his functionalities 
*/
module.exports.Logout = async (req, res) => {
    const hospital = await Hospital.findById(req.hospital._id);
    const token = req.header('x-auth-token');
    console.log(token);
    const decodedToken = jsonwebtoken.verify(token, "PrivateKey");
    res.send(decodedToken._id);
}

/*
DONE:
    viewDoctors function takes the id of the hospital that called it from the decoded token in the middleware..
    Now, it search for all doctors working in the hospital and return them in array.
FIXME: ther should be pagination to optimize the hospital user waiting time
*/
module.exports.viewDoctors = async (req, res) => {
    const doctors = await Doctor.find({ hospitalID: req.hospital._id, isActive: true });
    if (!doctors) return res.status(404).send("nothing found");
    res.send(doctors);
}
module.exports.getDoctor = async (req, res) => {
    // console.log('id:');
    // console.log(req.params.doctorID);
    const doctor = await Doctor.findOne({ _id: req.params.doctorID });
    if (!doctor) return res.status(404).send("nothing found");
    res.send(doctor);
}

module.exports.getSpecializations = async (req, res) => {
    try {
        const arr = [];
        const specializations = await Specialization.find().select('name -_id');
        for (var i = 0; i < specializations.length; i++) {
            arr.push(specializations[i].name);
        }
        res.send(arr);
    }
    catch (error) {
        res.status(404).send('specializations not found');
    }

}

/*
DONE:
    addDoctor function takes the id of the hospital that called it from the decoded token in the middleware.
    It checks the doctor provided data if it is valid or not using Joi module.
    not it search for the doctor,if he is already exists(his email in the database):
        we check if he is already working in another hospital(active) or not if he do:
            the doctor can not be added to the hospital.
        if not active:
            make the doctor active and add the hospital id to his record and reset his working days with the new ones in the request body.
    if the doctor is new to the application we create him a new account.
FIXME:
    the doctors password is not hashed. we need to implement the hash-salt functions in the doctor's model
*/
module.exports.addDoctor = async (req, res) => {
    const { error } = Doctor.validate(req.body);
    console.log('entered');
    if (error) {
        console.log(error.details[0].message);
        return res.status(400).send(error.details[0].message);
    }
    sortSchedule(req.body.workingDays);
    const generatedPassword = genPasword();
    let doctor = await Doctor.findOne({ email: req.body.email });

    if (doctor) {
        if (!doctor.isActive) {
            doctor.isActive = true;
            doctor.schedule = GenerateSchedule(req.body.workingDays);
            doctor.hospitalID = req.hospital._id;
            doctor.password = generatedPassword;
            doctor.workingDays = req.body.workingDays;
            doctor.save();
            try {
                const session = await conn.startSession();
                await session.withTransaction(async () => {
                    await doctor.save({ session });
                    const hospital = await Hospital.findById(req.hospital._id);
                    if (!hospital.specialization.find((spec) => (spec == doctor.specialization))) {
                        await Hospital.findByIdAndUpdate(
                            req.hospital._id,
                            {
                                $push: {
                                    specialization: doctor.specialization
                                }
                            }, { session }
                        );
                    }
                });
                session.endSession();
                sendPasswordViaMail(generatedPassword, req.body.email);
                //console.log({doctor});
                res.send(`${doctor} is already exists but we added it to your hospital`);
            }
            catch (error) {
                console.log(error);
                res.status(400).send('add failed');
            }
            //res.send(doctor);
        }
        else if (doctor.hospital == req.hospital._id) return res.status(400).send(`${doctor.name} is already working in your hospital`);
        else {
            return res.status(400).send(`${doctor} is already exists and not available`);
        }
    } else {
        doctor = new Doctor(_.pick(req.body, ['name', 'userName', 'specialization', 'email', 'workingDays']));
        doctor._id = ObjectId();
        doctor.hospitalID = req.hospital._id;
        doctor.password = generatedPassword;
        doctor.schedule = GenerateSchedule(req.body.workingDays);
        try {
            const session = await conn.startSession();
            await session.withTransaction(async () => {
                await doctor.save({ session });
                await Specialization.findOneAndUpdate({ name: doctor.specialization }, {
                    $push: {
                        doctorIds: doctor._id
                    }
                }, { session });
                const hospital = await Hospital.findById(req.hospital._id);
                if (!hospital.specialization.find((spec) => (spec == doctor.specialization))) {
                    await Hospital.findByIdAndUpdate(
                        req.hospital._id,
                        {
                            $push: {
                                specialization: doctor.specialization
                            }
                        }, { session }
                    );
                }
            });
            sendPasswordViaMail(generatedPassword, req.body.email);
            session.endSession();
            res.send(_.pick(doctor, ['name', 'userName', 'specialization', 'email', 'schedule', 'hospitalID', 'workingDays']));
        }
        catch (error) {
            console.log(error);
            res.status(400).send('add failed');
        }
        // const x = await Doctor.create(doctor);
    }
}

/*
DONE:
    it takes the id of the hospital that called it from the decoded token in the middleware.
    when hospital send request to activate a Doctor:
        first, we should search for the doctor's ID. If the doctor is assigned to another hospital
        (isActive = false) that's means he is available to be signed for this.hospital
        if the doctor is already active and assigned for a hospital, do nothing or send a response as a bad req.body
*/
module.exports.activateDoctor = async (req, res) => {
    const doctor = await Doctor.findById(req.body.DoctorID);
    if (!doctor) return res.status(404).send("Doctor not found");
    if (doctor.isActive) return res.status(400).send("Doctor is not available");
    doctor.isActive = true;
    doctor.hospitalID = req.hospital._id;
    doctor.save();
    res.send(`${doctor.name}'s account is activated and assigned to your hospital`);
}

/*
DONE:
    it takes the id of the hospital that called it from the decoded token in the middleware.
    when hospital send request to deactivate a Doctor:
        first, we search for the DoctorID and check if the hospitalID matches this.hospital
        if everything is fine then remove hospitalID and make isActive = false
*/
module.exports.deactivateDoctor = async (req, res) => {
    //const hospitalID = req.hospital._id;
    const { DoctorID } = req.body;
    const doctor = await Doctor.findById(DoctorID);
    if (!doctor) return res.status(404).send('Doctor not Found!');
    if (doctor.hospitalID != req.hospital._id) return res.status(400).send('You are not autheraized to deactivate him');
    doctor.hospitalID = null;
    doctor.isActive = false;
    doctor.save();
    res.send(`${doctor.name}'s account is deactivated and removed from your hospital`);
}
/*
DONE:
    it takes doctor's id and the working day id, then it look for the doctor and remove his working day
*/
module.exports.removeWorkingDay = async (req, res) => {
    const { doctorID, workingDay } = req.body;
    try {
        const doctor = await Doctor.update(
            { _id: doctorID },
            {
                $pull: {
                    workingDays: { _id: workingDay }
                }
            }
        );

        res.send("removed successfully");
    }
    catch (error) {
        console.log(error);
        res.status(400).send(error);
    }
}

module.exports.addWorkingDay = async (req, res) => {
    const { doctorID, day, from, to } = req.body;
    const workingDay = {
        day: day,
        from: from,
        to: to,
        _id: ObjectId()
    };

    const workingDays = await Doctor.findById(doctorID).select('workingDays -_id');
    var newWorkingdays = workingDays.workingDays.concat(workingDay);
    sortSchedule(newWorkingdays);
    try {
        const doctor = await Doctor.update(
            { _id: doctorID },
            {
                $set: {
                    workingDays: newWorkingdays
                }
            }
        );
        res.send("added successfully");
    }
    catch (error) {
        res.status(400).send(error);
    }
}

const sortSchedule = (schedule) => {
    const daysMap = {
        "Sat": 0,
        "Sun": 1,
        "Mon": 2,
        "Tue": 3,
        "Wed": 4,
        "Thu": 5,
        "Fri": 6,
    };
    return schedule.sort((a, b) => {
        if (daysMap[a.day] == daysMap[b.day]) {
            return new Date().setHours(a.from.split(":", 1)[0], a.from.split(":", 2)[1]) - new Date().setHours(b.from.split(":", 1)[0], b.from.split(":", 2)[1]);
        }
        return daysMap[a.day] - daysMap[b.day];
    });
}

/*
DONE:
    addReceptionist function takes the id of the hospital that called it from the decoded token in the middleware.
    It checks the recepitionist provided data if it is valid or not using Joi module.
    not it search for the recepitionist,if he is already exists(his email in the database):
        we check if he is already working in another hospital(active) or not if he do:
            the recepitionist can not be added to the hospital.
        if not active:
            make the recepitionist active and add the hospital id to his record and reset his working days with the new ones in the request body.
    if the recepitionist is new to the application we create him a new account.
FIXME:
    the recepitionist password is not hashed. we need to implement the hash-salt functions in the recepitionist's model
*/
module.exports.addReceptionist = async (req, res) => {
    //TODO: make Joi validation for recepitionist
    //const { error } = Receptionist.validate(req.body);
    //if(error) return res.status(400).send(error.details[0].message);
    const generatedPassword = genPasword();

    let receptionist = await Receptionist.findOne({ email: req.body.email });
    if (receptionist) {
        if (!receptionist.isActive) {
            receptionist.isActive = true;
            receptionist.hospitalID = req.hospital._id;
            receptionist.workingDays = req.body.workingDays;
            receptionist.password = generatedPassword;
            receptionist.save();
            sendPasswordViaMail(generatedPassword, req.body.email);
            res.send(`${receptionist.name} is activated and added to your hospital`);
        }
        else if (receptionist.hospitalID == req.hospital._id) {
            return res.status(400).send(`${receptionist.name} is already working in your hospital`);
        } else {
            return res.status(400).send(`${receptionist.name} is not available`);
        }
    } else {
        receptionist = new Receptionist(_.pick(req.body, ['name', 'username', 'email', 'phoneNumber', 'education', 'from', 'workingDays']));
        receptionist.hospitalID = req.hospital._id;
        receptionist.password = generatedPassword;
        receptionist.save();
        sendPasswordViaMail(generatedPassword, req.body.email);
        res.send(`${receptionist.name} is created and added to your hospital`);
    }
}

module.exports.getReceptionist = async (req, res) => {
    const receptionist = await Receptionist.findOne({ _id: req.params.receptID });
    if (!receptionist) return res.status(404).send("nothing found");
    res.send(receptionist);
}
module.exports.addWorkingDayRecept = async (req, res) => {
    const { receptionistID, day, from, to } = req.body;
    const workingDay = {
        day: day,
        from: from,
        to: to
    };
    try {
        const receptionist = await Receptionist.updateOne(
            { _id: receptionistID },
            {
                $push: {
                    workingDays: workingDay
                }
            }
        );

        res.send("added successfully");
    }
    catch (error) {
        console.log(error);
        res.status(400).send('error');
    }
}

module.exports.removeWorkingDayRecept = async (req, res) => {
    const { receptionistID, workingDay } = req.body;
    try {
        const receptionist = await Receptionist.updateOne(
            { _id: receptionistID },
            {
                $pull: {
                    workingDays: { _id: workingDay }
                }
            }
        );

        res.send("removed successfully");
    }
    catch (error) {
        console.log(error);
        res.status(400).send(error);
    }
}

/*
DONE:
    viewReceptionists function takes the id of the hospital that called it from the decoded token in the middleware..
    Now, it search for all receptionists working in the hospital and return them in array.
FIXME: ther should be pagination to optimize the hospital user waiting time
*/
module.exports.viewReceptionists = async (req, res) => {
    const receptionists = await Receptionist.find({ hospitalID: req.hospital._id });
    if (!receptionists) return res.status(404).send("nothing found");
    res.send(receptionists);
}

/*
DONE:
    it takes the id of the hospital that called it from the decoded token in the middleware.
    when hospital send request to deactivate a Receptionist:
        first, we search for the ReceptionistID and check if the hospitalID matches this.hospital
        if everything is fine then remove hospitalID and make isActive = false
*/
module.exports.deactivateReceptionist = async (req, res) => {
    const { receptionistID } = req.body;
    const receptionist = await Receptionist.findById(receptionistID);
    if (!receptionist) return res.status(404).send("Receptionist not Found!");
    if (receptionist.hospitalID != req.hospital._id) return res.status(400).send("You are not authorized");
    receptionist.isActive = false;
    receptionist.hospitalID = null;
    receptionist.save();
    res.send(`${receptionist.name} is deactivated`);
}

/*
DONE:
    it takes the id of the hospital that called it from the decoded token in the middleware.
    when hospital send request to activate a Receptionist:
        first, we should search for the receptionist's ID. If the receptionist is assigned to another hospital
        (isActive = false) that's means he is available to be signed for this.hospital
        if the receptionist is already active and assigned for a hospital, do nothing or send a response as a bad req.body
*/
module.exports.activateReceptionist = async (req, res) => {
    const { receptionistID } = req.body;
    const receptionist = await Receptionist.findById(receptionistID);
    if (!receptionist) return res.status(404).send("Receptionist not found");
    if (receptionist.isActive) return res.status(400).send(`${receptionist.name}is not available`);
    receptionist.hospitalID = req.hospital._id;
    receptionist.isActive = true;
    receptionist.save();
    res.send(`${receptionist.name} is added to your hospital`);

}
function genPasword() {
    var result = '';
    var alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    var nums = '0123456789';
    var symbols = '~`!@#$%^&*()_-+={[}]|\\:;"\'<,>.?/';
    for (var i = 0; i < 5; i++) {
        result += alpha.charAt(Math.floor(Math.random() * alpha.length));
    }
    for (var i = 0; i < 2; i++) {
        result += nums.charAt(Math.floor(Math.random() * nums.length));
    }
    for (var i = 0; i < 1; i++) {
        result += symbols.charAt(Math.floor(Math.random() * symbols.length));
    }
    return result;
}
function sendPasswordViaMail(password, empEmail) {
    const passWordEmail = {
        from: "espitalia.app.gp@gmail.com",
        to: empEmail,
        subject: "Temporary Password: ",
        html:
            "Your new password is " +
            password +
            "<br/>please try to change it ASAP for your security" +
            "<br/><br/>Thanks and regards , <br/>      Espitalia",
    };
    transporter.sendMail(passWordEmail, function (error, info) {
        if (error) {
            console.log("Email" + error);
        } else {
            console.log("Email sent: " + info.response);
        }
    });
}

function GenerateSchedule(workingdays) {
    let counter = 2;
    let NewSchedule = [];
    let datenow = new Date(Date.now());
    console.log({datenow});
    datenow.setHours(0);
    datenow.setMinutes(0);
    datenow.setSeconds(0);
    console.log({datenow});
    let dateItr = date.addDays(datenow, counter);
    console.log({dateItr});
    let newDateForm = date.format(dateItr, 'ddd, MMM DD YYYY');
    let dayName = newDateForm.split(",");
    var nextDay = dateItr;
    counter=1;
    while (counter < 15) {
        console.log(dayName[0]);
        for (var i = 0; i < workingdays.length; i++) {
            if (dayName[0] == workingdays[i].day) {
                addedSchedule = new Schedule({
                    date: nextDay,
                    to: workingdays[i].to,
                    from: workingdays[i].from,
                    AppointmentList: [],
                });
                NewSchedule.push(addedSchedule);
            }
        }
        nextDay = date.addDays(dateItr, counter);
        var nextDayII = date.format(nextDay, 'ddd, MMM DD YYYY');
        nextDayName = nextDayII.split(",");
        dayName = nextDayName;
        counter++;
    }
    return NewSchedule;
}

module.exports.hospitalSearchDoctor = async (req, res) => {
    const search = req.params.search;
    const hospitalID = req.hospital._id;
    try {
        const drs = await Doctor.find({
            name: { $regex: ".*" + search + ".*" },
            hospitalID: hospitalID,
            isActive: true
        });
        res.status(200).send(drs);
    } catch (error) {
        res.status(404).send("No doctors found");
    }

}

module.exports.hospitalSearchReceptionist = async (req, res) => {
    const search = req.params.search;
    const hospitalID = req.hospital._id;
    try {
        const recepitionists = await Receptionist.find({
            name: { $regex: ".*" + search + ".*" },
            hospitalID: hospitalID,
        });
        res.status(200).send(recepitionists);
    } catch (error) {
        res.status(404).send("No recepitionists found");
    }

}

module.exports.getProfile = async (req, res) => {
    try {
        const hospitalData = await Hospital.findById(req.hospital._id);
        res.status(200).send(hospitalData);

    }
    catch (error) {
        res.status(404).send('data not found');
    }
}