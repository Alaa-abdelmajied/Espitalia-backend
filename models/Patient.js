const mongoose = require('mongoose');
const { isEmail } = require('validator');
const bcrypt = require('bcrypt');

const patientSchema = new mongoose.Schema({
<<<<<<< HEAD
email: {
    type: String,
    required: [true, 'Please enter an email'],
    unique: true,
    lowercase: true,
    validate: [isEmail, 'Please enter a valid email']
},
password: {
    type: String,
    required: [true, 'Please enter a password'],
    minlength: [6, 'Minimum password length is 6 characters']
},
name: {
    type: String,
    required: [true, 'Please enter a name'],
},
age: {
    type: Number,
    required: [true, 'Please enter an age'],
},
phoneNumber: {
    type: Number,
    required: [true, 'Please enter a phone number'],
},
// dateOfBirth: {
//     type: Date,
//     required: [true, 'Please enter a date of birth'],
// },
avatar: {
    type: Buffer
},
unVisits: {
    type: Number,
    default: 0
},
questions: {
    type: Boolean
},
oldAppointments:{
    type: [mongoose.Types.ObjectId]
},
newAppointments:{
    type: [mongoose.Types.ObjectId]
},
verified: {
    type: Boolean,
    default: false
}
=======
    email: {
        type: String,
        required: [true, 'Please enter an email'],
        unique: true,
        lowercase: true,
        validate: [isEmail, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: [true, 'Please enter a password'],
        minlength: [6, 'Minimum password length is 6 characters']
    },
    name: {
        type: String,
        required: [true, 'Please enter a name'],
    },
    phoneNumber: {
        type: String,
        required: [true, 'Please enter a phone number'],
    },
    dateOfBirth: {
        type: Date,
        required: [true, 'Please enter a date of birth'],
    },
    avatar: {
        type: Buffer
    },
    unVisits: {
        type: Number,
        default: 0
    },
    questions: {
        type: Boolean
    },
    oldAppointments:{
        type: [mongoose.Types.ObjectId]
    },
    newAppointments:{
        type: [mongoose.Types.ObjectId]
    },
    verified: {
        type: Boolean,
        default: false
    }
>>>>>>> 15d8539ca7b5dc08c2cdef66031b4d4abc5eb6bd
});

patientSchema.pre('save', async function (next) {
const salt = await bcrypt.genSalt();
this.password = await bcrypt.hash(this.password, salt);
next();
});

<<<<<<< HEAD
patientSchema.statics.login = async function (email, password) {
const patient = await this.findOne({ email });
if (patient) {
    const validPassword = await bcrypt.compare(password, patient.password);
    if (validPassword) {
        return patient;
=======
patientSchema.statics.patientLogin = async function (email, password) {
    const patient = await this.findOne({ email });
    if (patient) {
        const validPassword = await bcrypt.compare(password, patient.password);
        if (validPassword) {
            return patient;
        }
        throw Error('Incorrect email or password');
>>>>>>> 15d8539ca7b5dc08c2cdef66031b4d4abc5eb6bd
    }
    throw Error('Incorrect email or password');
}
throw Error('Incorrect email or password');
};

<<<<<<< HEAD
patientSchema.statics.hashPassword = async function (password) {
const salt = await bcrypt.genSalt();
return bcrypt.hash(this.password, salt);
=======
patientSchema.statics.changePassword = async function (patientId, oldPassword, newPassword) {
    const patient = await this.findOne({ patientId });
    const validPassword = await bcrypt.compare(oldPassword, patient.password);
    if (validPassword) {
        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        await Patient.updateOne(patient, {
            password: hashedPassword
        });
        return ('done');
    }
    throw Error('Incorrect password');

    // const salt = await bcrypt.genSalt();
    // return bcrypt.hash(newPassword, salt);
}

patientSchema.statics.forgotPassword = async function (patientId, password) {
    const patient = await this.findOne({ patientId });
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);
    await Patient.updateOne(patient, {
        password: hashedPassword
    });
    return ('done');
>>>>>>> 15d8539ca7b5dc08c2cdef66031b4d4abc5eb6bd
}

const Patient = mongoose.model('patient', patientSchema);
module.exports = Patient;

async function createPatient(){
const patient= new Patient({
    name:"karim",
    phoneNumber:"01000",
    questions:"true",
    password:"123456",
    email:"karim@gmail.com",
    age:"20",
    //dateOfBirth:"23-3-2002"
});

const result = await patient.save();
console.log(result);
}
//createPatient();