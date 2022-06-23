const mongoose = require('mongoose');
const { isEmail } = require('validator');
const bcrypt = require('bcrypt');

const patientSchema = new mongoose.Schema({
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
    gender: {
        type: String,
        required: [true, 'Please enter a gender']
    },
    avatar: {
        type: Buffer
    },
    unVisits: {
        type: Number,
        default: 0
    },
    // questions: {
    //     type: String
    // },
    oldAppointments: {
        type: [mongoose.Types.ObjectId]
    },
    newAppointments: {
        type: [mongoose.Types.ObjectId]
    },
    verified: {
        type: Boolean,
        default: false
    },
    diabetic: {
        type: String,
        required: [true, 'Please enter an answer']
    },
    bloodType: {
        type: String,
        required: [true, 'Please enter an answer']
    },
    bloodPressure: {
        type: String,
        required: [true, 'Please enter an answer']
    },
    allergic: {
        type: String,
        required: [true, 'Please enter an answer']
    },
    allergies: {
        type: String
    },
    // loggedIn: {
    //     type: Boolean,
    //     default: false
    // },
    unbanIn: {
        type: Date,
        default: new Date('1970-01-01T00:00:00.000')
    },
    notifications: {
        type: [mongoose.Types.ObjectId]
    },
    fcmToken: {
        type: String
    }
});

patientSchema.pre('save', async function (next) {
    const salt = await bcrypt.genSalt();
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

patientSchema.statics.patientLogin = async function (email, password) {
    const patient = await this.findOne({ email });
    if (patient) {
        const validPassword = await bcrypt.compare(password, patient.password);
        if (validPassword) {
            return patient;
        }
        throw Error('Incorrect email or password');
    }
    throw Error('Incorrect email or password');
};

patientSchema.statics.changePassword = async function (patientId, oldPassword, newPassword) {
    const patient = await this.findOne({ _id: patientId });
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
}

patientSchema.statics.forgotPassword = async function (patientId, newpassword) {
    const patient = await this.findOne({ _id: patientId });
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(newpassword, salt);
    await Patient.updateOne(patient, {
        password: hashedPassword
    });
    return ('done');
}

const Patient = mongoose.model('patient', patientSchema);

module.exports = Patient;