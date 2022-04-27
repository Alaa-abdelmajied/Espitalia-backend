const mongoose = require('mongoose');

const notificationSchema = new mongoose.schema({
    title: {
        type: String,
    },
    body: {
        type: String,
    },
    date: {
        type: Date,
    },
    patientID: {
        type: mongoose.Types.ObjectId,
    }
})

const Notification = mongoose.model('notification', notificationSchema);

module.exports = Notification;

const notification = new Notification({
    title: 'Welcome to Espitalia',
    body: 'Try our application to reserve your appointment immediately'
});
