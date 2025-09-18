const mongoose = require('mongoose');

const PrescriptionSchema = new mongoose.Schema({
    medicalRecord: { type: mongoose.Schema.Types.ObjectId, ref: 'MedicalRecord', required: true },
    pharmacist: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    drugName: { type: String, required: true },
    dosage: { type: String, required: true },
    status: { type: String, enum: ['Pending', 'Administered'], default: 'Pending' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Prescription', PrescriptionSchema);
