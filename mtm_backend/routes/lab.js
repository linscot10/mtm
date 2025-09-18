const express = require('express');
const LabResult = require('../models/LabResult');
const MedicalRecord = require('../models/MedicalRecord');
const auth = require('../middlewares/auth');

const router = express.Router();

// Get all test orders (Lab technicians only)
router.get('/orders', auth(['lab']), async (req, res) => {
    try {
        const orders = await MedicalRecord.find({ testsOrdered: { $exists: true, $ne: "" } })
            .populate('patient', 'name dob')
            .populate('doctor', 'name email');

        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Upload lab result (Lab technicians only)
router.post('/', auth(['lab']), async (req, res) => {
    try {
        const { medicalRecord, resultDetails } = req.body;

        const newResult = new LabResult({
            medicalRecord: medicalRecord,
            technician: req.user.id,
            resultDetails
        });

        await newResult.save();

        res.status(201).json(newResult);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// View lab results for a medical record (Doctors & Lab techs)
router.get('/:medicalRecordId', auth(['doctor', 'lab']), async (req, res) => {
    try {
        const results = await LabResult.find({ medicalRecord: req.params.medicalRecordId })
            .populate('technician', 'name email')
            .sort({ createdAt: -1 });

        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
