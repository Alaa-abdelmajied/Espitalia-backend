const express = require('express');

// if(!config.get('jwtPrivateKey')){
//     console.log("FATAL ERROR: jwtPrivateKey not found");
//     process.exit(1);
// }
const patientRouters = require('./routes/PatientRoutes');
const hospitalRouters = require('./routes/HospitalRoutes');
const receptionistRouters = require('./routes/ReceptionistRoutes');

const app = express();



app.use(express.json());
app.listen(3000);
app.use('/patient', patientRouters);
app.use('/hospital', hospitalRouters);
app.use('/receptionist', receptionistRouters);