const express = require('express');
const MedicalRecord = require('../models/MedicalRecord');
const Patient = require('../models/Patient');
const auth = require('../middlewares/auth');

const router = express.Router();

// Create a medical record (Doctors only)
// router.post('/', auth(['doctor']), async (req, res) => {
//     try {
//         const { patientId, symptoms, diagnosis, prescription, testsOrdered } = req.body;

//         const newRecord = new MedicalRecord({
//             patient: patientId,
//             doctor: req.user.id,
//             symptoms,
//             diagnosis,
//             prescription,
//             testsOrdered
//         });

//         const savedRecord = await newRecord.save();

//         // Add record reference to patient
//         await Patient.findByIdAndUpdate(patientId, { $push: { medicalHistory: savedRecord._id } });

//         res.status(201).json(savedRecord);
//     } catch (err) {
//         res.status(500).json({ error: err.message });
//     }
// });
router.post('/', auth(['doctor']), async (req, res) => {
    try {
        const { patientId, symptoms, diagnosis, prescription, testsOrdered } = req.body;

        // Check if patient exists
        const patient = await Patient.findById(patientId);
        if (!patient) {
            return res.status(404).json({ error: "Patient not found" });
        }

        const newRecord = new MedicalRecord({
            patient: patientId,
            doctor: req.user.id,
            symptoms,
            diagnosis: diagnosis || '',
            prescription: prescription || '',
            testsOrdered: testsOrdered || ''
        });

        const savedRecord = await newRecord.save();

        // Add record reference to patient
        await Patient.findByIdAndUpdate(patientId, { 
            $push: { medicalHistory: savedRecord._id } 
        });

        res.status(201).json(savedRecord);
    } catch (err) {
        console.error('Error creating medical record:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get all medical records for a patient
router.get('/patient/:patientId', auth(['doctor', 'nurse']), async (req, res) => {
    try {
        const records = await MedicalRecord.find({ patient: req.params.patientId })
            .populate('doctor', 'name email')
            .sort({ createdAt: -1 });

        res.json(records);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get a single medical record
router.get('/:id', auth(['doctor', 'nurse']), async (req, res) => {
    try {
        const record = await MedicalRecord.findById(req.params.id).populate('doctor', 'name email');
        if (!record) return res.status(404).json({ msg: "Medical record not found" });

        res.json(record);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update a medical record (Doctors only)
router.put('/:id', auth(['doctor']), async (req, res) => {
    try {
        const updatedRecord = await MedicalRecord.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedRecord) return res.status(404).json({ msg: "Medical record not found" });

        res.json(updatedRecord);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete a medical record (Doctors only)
router.delete('/:id', auth(['doctor']), async (req, res) => {
    try {
        const deleted = await MedicalRecord.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ msg: "Medical record not found" });

        res.json({ msg: "Medical record deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
