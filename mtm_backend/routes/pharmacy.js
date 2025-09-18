const express = require('express');
const Prescription = require('../models/Prescription');
const MedicalRecord = require('../models/MedicalRecord');
const auth = require('../middlewares/auth');

const router = express.Router();

// Get all prescriptions (Pharmacists only)
router.get('/', auth(['pharmacist']), async (req, res) => {
    try {
        const prescriptions = await Prescription.find()
            .populate('medicalRecord', 'patient doctor diagnosis')
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

        const newPrescription = new Prescription({
            medicalRecord: medicalRecord,
            drugName,
            dosage
        });

        await newPrescription.save();

        res.status(201).json(newPrescription);
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

        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
