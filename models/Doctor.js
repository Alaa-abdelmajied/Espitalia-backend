const Joi = require("joi");
const mongoose = require("mongoose");
const { isEmail } = require("validator");
const bcrypt = require("bcrypt");
const jsonwebtoken = require("jsonwebtoken");

//deh ma3mola embedded schema gwa doctor w gwaha hena feh el appointment list
const scheduleSchema = new mongoose.Schema({
  date: Date,
  from: String,
  to: String,
  AppointmentList: {
    type: [mongoose.Types.ObjectId],
  },
});

const doctorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "name is required"],
  },
  // userName: {
  //   type: String,
  //   required: [true, "userName is required"],
  // },
  specialization: {
    type: String,
    required: [true, "specialization is required"],
  },
  rating: {
    type: Number,
    default: 0,
  },
  reviews: {
    type: [
      {
        name: String,
        rating: Number,
        review: String,
        date: Date,
      },
    ],
  },
  email: {
    type: String,
    required: [true, "Please enter an email"],
    unique: true,
    lowercase: true,
    validate: [isEmail, "Please enter a valid email"],
  },
  schedule: {
    type: [scheduleSchema],
    //FIXME: return me required again
    //required: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: [true, "Please enter a password"],
  },
  hospitalID: {
    type: mongoose.Types.ObjectId,
    //required: true,
  },
  currentFlowNumber: {
    type: Number,
    default: 0,
  },
  workingDays: {
    type: [
      {
        day: String,
        to: String,
        from: String,
      },
    ],
  },
  isActive: {
    type: Boolean,
    default: true,
  },
});

// doctorSchema.methods.generateAuthToken = function () {
//   /*
//     FIXME:
//         the private key should be an environment variable
//     */
//   const token = jsonwebtoken.sign({ _id: this._id }, "PrivateKey");
//   return token;
// };

// doctorSchema.methods.decodeToken = function (token) {
//   const decodedToken = jsonwebtoken.verify(token, "PrivateKey");
//   return decodedToken;
// };


function validate(doctor) {
  const schema = {
    name: Joi.string().min(3).max(255).required(),
    userName: Joi.string().min(3).max(255).required(),
    email: Joi.string().min(3).max(255).email().required(),
    specialization: Joid.string().min(3).max(255).required(),
  };
  return Joi.validate(doctor, schema);
}

doctorSchema.pre("save", async function (next) {
  const salt = await bcrypt.genSalt();
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

doctorSchema.statics.doctorLogin = async function (email, password) {
  const dr = await this.findOne({ email });
  if (dr) {
    const validPassword = await bcrypt.compare(password, dr.password);
    if (validPassword) {
      return dr;
    }
    throw Error("Incorrect email or password");
  }
  throw Error("Incorrect email or password");
};

doctorSchema.statics.changePassword = async function (
  drId,
  oldPassword,
  newPassword
) {
  const dr = await this.findOne({ _id: drId });
  const validPassword = await bcrypt.compare(oldPassword, dr.password);
  if (validPassword) {
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    await Doctor.updateOne(dr, {
      password: hashedPassword,
    });
    return "done";
  }
  throw Error("Incorrect password");
};

doctorSchema.statics.forgotPassword = async function (drId, newpassword) {
  const dr = await this.findOne({ _id: drId });
  const salt = await bcrypt.genSalt();
  const hashedPassword = await bcrypt.hash(newpassword, salt);
  await Doctor.updateOne(dr, {
    password: hashedPassword,
  });
  return "done";
};

const Doctor = mongoose.model("doctor", doctorSchema);
const Schedule = mongoose.model("Schedule", scheduleSchema);

module.exports = {
  Doctor: Doctor,
  Schedule: Schedule,
};
