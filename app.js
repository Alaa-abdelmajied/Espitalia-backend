const express = require('express');

const patientRouters = require('./routes/PatientRoutes');
const hospitalRouters = require('./routes/HospitalRoutes');

const app = express();


app.use(express.json());
app.listen(3000);
app.use('/patient', patientRouters);
app.use('/hospital', hospitalRouters);