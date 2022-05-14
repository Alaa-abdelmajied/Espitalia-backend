const Hospital = require('../models/Hospital');
const _ = require('lodash');
const { Doctor, Schedule } = require('../models/Doctor');
const Receptionist = require('../models/Receptionist');
const jsonwebtoken = require('jsonwebtoken');
const date = require('date-and-time');


/*
DONE:
*/
module.exports.Login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const hospital = await Hospital.hospitalLogin(email, password);
        const token = hospital.generateAuthToken();
        res.header('x-auth-token', token).send("Done");
    } catch (e) {
        res.status(400).send(e.message);
    }
}

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
    if (error) return res.status(400).send(error.details[0].message);
    //console.log(`ID: ${req.hospital._id}`);
    //console.log(req.body.email);
    let doctor = await Doctor.findOne({ email: req.body.email });
    //console.log({doctor});
    if (doctor) {
        if (!doctor.isActive) {
            doctor.isActive = true;
            doctor.schedule = GenerateSchedule(req.body.workingDays);
            doctor.hospitalID = req.hospital._id;
            doctor.workingDays = req.body.workingDays;
            doctor.save();
            //console.log({doctor});
            res.send(`${doctor} is already exists but we added it to your hospital`);
            //res.send(doctor);
        }
        else if (doctor.hospital == req.hospital._id) return res.status(400).send(`${doctor.name} is already working in your hospital`);
        else {
            return res.status(400).send(`${doctor} is already exists and not available`);
        }
    } else {
        doctor = new Doctor(_.pick(req.body, ['name', 'userName', 'specialization', 'email', 'password', 'workingDays']));
        doctor.hospitalID = req.hospital._id;
        //console.log({doctor});
        doctor.schedule = GenerateSchedule(req.body.workingDays);
        await doctor.save();
        res.send(_.pick(doctor, ['name', 'userName', 'specialization', 'email', 'schedule', 'hospitalID', 'workingDays']));
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
    let receptionist = await Receptionist.findOne({ email: req.body.email });
    if (receptionist) {
        if (!receptionist.isActive) {
            receptionist.isActive = true;
            receptionist.hospitalID = req.hospital._id;
            receptionist.workingDays = req.body.workingDays;
            receptionist.save();
            res.send(`${receptionist.name} is activated and added to your hospital`);
        }
        else if (receptionist.hospitalID == req.hospital._id) {
            return res.status(400).send(`${receptionist.name} is already working in your hospital`);
        } else {
            return res.status(400).send(`${receptionist.name} is not available`);
        }
    } else {
        receptionist = new Receptionist(_.pick(req.body, ['name', 'username', 'email', 'password', 'phoneNumber', 'education', 'from', 'workingDays']));
        receptionist.hospitalID = req.hospital._id;
        receptionist.save();
        res.send(`${receptionist.name} is created and added to your hospital`);
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

function GenerateSchedule(workingdays) {
    let counter = 1;
    let NewSchedule = [];

    let datenow = new Date(Date.now());
    let dateItr = date.addDays(datenow, counter);
    let newDateForm = date.format(dateItr, 'ddd, MMM DD YYYY');
    let dayName = newDateForm.split(",");
    var nextDay = dateItr ;

    while (counter < 15) {
        for (var i = 0; i < workingdays.length; i++) {
            if (dayName[0] == workingdays[i].day) {
                addedSchedule = new Schedule({
                    date: nextDay,   //2022-09-24
                    to: workingdays[i].to,
                    from: workingdays[i].from,
                    AppointmentList: [],
                });
                NewSchedule.push(addedSchedule);
            }
        }
        nextDay = date.addDays(datenow, counter);
        var nextDayII = date.format(nextDay, 'ddd, MMM DD YYYY');
        nextDayName = nextDayII.split(",");
        dayName = nextDayName;
        counter++;
    }
    return NewSchedule;
}

module.exports.hospitalSearchDoctor = async(req,res) =>{
    const search = req.params.search;
    const hospitalID = req.hospital._id;
    try {
        const drs = await Doctor.find({
            name: { $regex: ".*" + search + ".*" },
            hospitalID: hospitalID,
            isActive:true
        });
        res.status(200).send(drs);
    } catch (error) {
        res.status(404).send("No doctors found");
    }
   
}

// lesa mesh sha8ala
// module.exports.hospitalSearchReceptionist = async(req,res)=>{
//     const search = req.params.search;
//     const hospitalID = req.hospital._id;
//     console.log(search);
//     console.log(hospitalID);
//     try {
//         const recepitionists = Receptionist.find({
//             name: { $regex: ".*" + search + ".*" },
//             hospitalID: hospitalID, 
//         });
//         res.status(200).send(recepitionists);
//     } catch (error) {
//         res.status(404).send("No recepitionists found");
//     }

// }