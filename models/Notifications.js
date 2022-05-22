const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    title: {
        type: String,
    },
    body: {
        type: String,
    },
    date: {
        type: Date,
    },
    userID: {
        type: mongoose.Types.ObjectId,
    },


})

const Notification = mongoose.model('notification', notificationSchema);
module.exports = Notification;
