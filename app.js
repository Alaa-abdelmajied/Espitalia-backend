const express = require('express');
const mongoose = require('mongoose');

const patientRouters = require('./routes/PatientRoutes')

const app = express();
app.use(express.json());
<<<<<<< HEAD
=======

>>>>>>> 0ddcf104474dc605e90970c4d0c0d716f345e60e

const dbURI = 'mongodb+srv://Alaa:FpX3KihZBF5jaCV@espitaliacluster.ozn3j.mongodb.net/espitaliaDb?retryWrites=true&w=majority';
mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then((result) => {
        console.log('Server Connected!');
        app.listen(3000);
    })
    .catch((err) => console.log(err));

app.use('/patient', patientRouters);