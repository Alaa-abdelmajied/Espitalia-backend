const express = require('express');

const patientRouters = require('./routes/PatientRoutes')

const app = express();


app.use(express.json());
app.listen(3000);
app.use('/patient', patientRouters);