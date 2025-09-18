    const mongoose = require('mongoose');

    const MedicalRecordSchema = new mongoose.Schema({
        patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
        doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        symptoms: { type: String, required: true },
        diagnosis: { type: String },
        prescription: { type: String },
        testsOrdered: { type: String }, // e.g., "Blood test, X-ray"
        createdAt: { type: Date, default: Date.now }
    });

    module.exports = mongoose.model('MedicalRecord', MedicalRecordSchema);
