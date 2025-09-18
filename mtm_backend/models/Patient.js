const mongoose = require('mongoose');




const PatientSchema = new mongoose.Schema({
    name: { type: String, required: true },
    dob: { type: Date, required: true },
    gender: { type: String, enum: ['male', 'female'], required: true },
    contact: { type: String, required: true },
    address: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Nurse who registered
    medicalHistory: [{ type: mongoose.Schema.Types.ObjectId, ref: 'MedicalRecord' }]
}, { timestamps: true });

module.exports = mongoose.model('Patient', PatientSchema);
