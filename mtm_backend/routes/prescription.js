const express = require('express');
const Prescription = require('../models/Prescription');
const MedicalRecord = require('../models/MedicalRecord');
const Patient = require('../models/Patient');
const User = require('../models/User');
const auth = require('../middlewares/auth');

const router = express.Router();

// Get all prescriptions (for doctors and pharmacists)
router.get('/', auth(['doctor', 'pharmacist']), async (req, res) => {
    try {
        let query = {};
        
        // If user is a pharmacist, show all prescriptions
        // If user is a doctor, show only prescriptions from their medical records
        if (req.user.role === 'doctor') {
            // Get medical records created by this doctor
            const doctorMedicalRecords = await MedicalRecord.find({ 
                doctor: req.user.id 
            }).select('_id');
            
            const recordIds = doctorMedicalRecords.map(record => record._id);
            query.medicalRecord = { $in: recordIds };
        }
        
        const prescriptions = await Prescription.find(query)
            .populate({
                path: 'medicalRecord',
                populate: [
                    { path: 'patient', select: 'name dob gender' },
                    { path: 'doctor', select: 'name specialization' }
                ]
            })
            .populate('pharmacist', 'name')
            .sort({ createdAt: -1 });

        res.json(prescriptions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add prescription (Doctors only)
router.post('/', auth(['doctor']), async (req, res) => {
    try {
        const { medicalRecord, drugName, dosage } = req.body;

        // Check if medical record exists and belongs to this doctor
        const record = await MedicalRecord.findById(medicalRecord);
        if (!record) {
            return res.status(404).json({ error: "Medical record not found" });
        }
        
        // Verify the doctor owns this medical record
        if (record.doctor.toString() !== req.user.id && req.user.role === 'doctor') {
            return res.status(403).json({ error: "Not authorized to add prescription to this record" });
        }

        const newPrescription = new Prescription({
            medicalRecord: medicalRecord,
            drugName,
            dosage
        });

        await newPrescription.save();
        
        // Populate before returning
        const populatedPrescription = await Prescription.findById(newPrescription._id)
            .populate({
                path: 'medicalRecord',
                populate: [
                    { path: 'patient', select: 'name dob gender' },
                    { path: 'doctor', select: 'name specialization' }
                ]
            });

        res.status(201).json(populatedPrescription);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update prescription status (Pharmacists only)
router.put('/:id/administer', auth(['pharmacist']), async (req, res) => {
    try {
        const updated = await Prescription.findByIdAndUpdate(
            req.params.id,
            { status: 'Administered', pharmacist: req.user.id },
            { new: true }
        );

        if (!updated) return res.status(404).json({ msg: "Prescription not found" });

        // Populate before returning
        const populatedPrescription = await Prescription.findById(updated._id)
            .populate({
                path: 'medicalRecord',
                populate: [
                    { path: 'patient', select: 'name dob gender' },
                    { path: 'doctor', select: 'name specialization' }
                ]
            })
            .populate('pharmacist', 'name');

        res.json(populatedPrescription);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get medical records for creating prescription (Doctors only)
router.get('/medical-records', auth(['doctor']), async (req, res) => {
    try {
        const records = await MedicalRecord.find({ doctor: req.user.id })
            .populate('patient', 'name dob gender')
            .sort({ createdAt: -1 });
        
        res.json(records);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;