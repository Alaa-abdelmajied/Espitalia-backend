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
    appointments: {
        type: [mongoose.Types.ObjectId]
    },
    verified: {
        type: Boolean,
        default: false
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

patientSchema.statics.changePassword = async function (email, oldPassword, newPassword) {
    const patient = await this.findOne({ email });
    const validPassword = await bcrypt.compare(oldPassword, patient.password);
    if (validPassword) {
        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        await Patient.updateOne(patient, {
            password: hashedPassword
        });
        return('done');
    }
    throw Error('Incorrect password');

    // const salt = await bcrypt.genSalt();
    // return bcrypt.hash(newPassword, salt);
}

const Patient = mongoose.model('patient', patientSchema);

module.exports = Patient;