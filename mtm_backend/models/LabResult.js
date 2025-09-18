const mongoose = require('mongoose');

const LabResultSchema = new mongoose.Schema({
    medicalRecord: { type: mongoose.Schema.Types.ObjectId, ref: 'MedicalRecord', required: true },
    technician: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    resultDetails: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('LabResult', LabResultSchema);
