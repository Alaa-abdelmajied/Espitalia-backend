const mongoose = require('mongoose');
const { isEmail } = require('validator');

const bcrypt = require('bcrypt');
const jsonwebtoken = require('jsonwebtoken');

const receptionistSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please enter a receptionist name']
    },
    username: {
        type: String,
        required: [true]
    },
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
    hospitalID: {
        type: mongoose.Types.ObjectId,
        //required: [true, 'Please enter a hospital name']
    },
    phoneNumber: {
        type: String,       // better as a string or number?
        required: [true, 'Please enter a valid phone number'],
        minlength: [11, 'Minimum phone number length is 11']
    },
    education: {
        type: String
    },
    from: {
        type: String
    },

    workingDays: {
        type: [{
            day: String,
            to: String,
            from: String
        }]
    },
    isActive: {
        type: Boolean,
        default: true
    }

});


//test
// async function createReceptionist() {
//     const user = new Receptionist({
//         name: 'Maram',
//         username: 'maram98',
//         email: 'maram_98@gmail.com',
//         password: 'hiiiiiii',
//         hospital_name: 'Al Andalusia',
//         phone_number: 12345678910,
//         education: 'Faculty of Commerce',
//         from: 'Alexandria, Egypt'

//     });

//     const result = await user.save();
//     console.log(result);
// }

receptionistSchema.methods.generateAuthToken = function() {
    const token = jsonwebtoken.sign({_id: this._id}, 'PrivateKey');
    return token;
}

//createReceptionist(); 
receptionistSchema.pre('save', async function (next) {
    const salt = await bcrypt.genSalt();
    this.password = await bcrypt.hash(this.password, salt);
    console.log(this.password);
    next();
});

receptionistSchema.statics.receptionistLogin = async function (email, password) {
    const receptionist = await this.findOne({ email });
    if (receptionist) {
        const validPassword = await bcrypt.compare(password, receptionist.password);
        //console.log(password, this.password);
        if (validPassword) {
            return receptionist;
        }
        throw Error('Incorrect email or password');

    }
    throw Error('Incorrect email or password');
}

receptionistSchema.statics.changePassword = async function (receptionistId, oldPassword, newPassword) {
    const receptionist = await this.findOne({ _id: receptionistId });
    const validPassword = await bcrypt.compare(oldPassword, receptionist.password);
    if (validPassword) {
        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        await Receptionist.updateOne(receptionist, {
            password: hashedPassword
        });
        return ('done');
    }
    throw Error('Incorrect password');
}

receptionistSchema.statics.forgotPassword = async function (receptionistId, newpassword) {
    const receptionist = await this.findOne({ _id: receptionistId });
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(newpassword, salt);
    await Receptionist.updateOne(receptionist, {
        password: hashedPassword,
    });
    return "done";
};

const Receptionist = mongoose.model('receptionist', receptionistSchema);
module.exports = Receptionist;