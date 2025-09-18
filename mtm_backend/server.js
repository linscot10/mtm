const express = require('express')
const cors = require('cors')
require('dotenv').config()
const connectDB = require('./db/db')

const authRoutes = require('./routes/auth');
const patientRoutes = require('./routes/patient');
const medicalRecordRoutes = require('./routes/medicalRecords');
const labRoutes = require('./routes/lab');
const pharmacyRoutes = require('./routes/pharmacy');
const dashboardRoutes = require('./routes/dashboard');







const PORT = process.env.PORT
const app = express()
connectDB()

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/medical-records', medicalRecordRoutes);
app.use('/api/lab-results', labRoutes);
app.use('/api/prescriptions', pharmacyRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.listen(PORT, () => {
    console.log(`server running on port http://localhost:${PORT}`)
})

