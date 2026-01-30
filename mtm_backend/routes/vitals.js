const express = require('express');
const Vitals = require('../models/Vitals');
const Patient = require('../models/Patient');
const auth = require('../middlewares/auth');

const router = express.Router();

// Get all vitals (Nurses and Doctors)
router.get('/', auth(['nurse', 'doctor']), async (req, res) => {
    try {
        const vitals = await Vitals.find()
            .populate('patient', 'name dob gender')
            .populate('recordedBy', 'name email')
            .sort({ recordedAt: -1 });
        
        res.json(vitals);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get vitals for a specific patient
router.get('/patient/:patientId', auth(['nurse', 'doctor']), async (req, res) => {
    try {
        const vitals = await Vitals.find({ patient: req.params.patientId })
            .populate('recordedBy', 'name email')
            .sort({ recordedAt: -1 });
        
        res.json(vitals);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get latest vitals for a patient
router.get('/patient/:patientId/latest', auth(['nurse', 'doctor']), async (req, res) => {
    try {
        const vitals = await Vitals.findOne({ patient: req.params.patientId })
            .populate('recordedBy', 'name email')
            .sort({ recordedAt: -1 });
        
        if (!vitals) {
            return res.status(404).json({ error: "No vitals found for this patient" });
        }
        
        res.json(vitals);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Record new vitals (Nurses only)
router.post('/', auth(['nurse']), async (req, res) => {
    try {
        const {
            patientId,
            bloodPressure,
            heartRate,
            respiratoryRate,
            temperature,
            oxygenSaturation,
            height,
            weight,
            painLevel,
            notes
        } = req.body;

        // Validate required fields
        if (!patientId) {
            return res.status(400).json({ error: "Patient ID is required" });
        }

        // Check if patient exists
        const patient = await Patient.findById(patientId);
        if (!patient) {
            return res.status(404).json({ error: "Patient not found" });
        }

        const newVitals = new Vitals({
            patient: patientId,
            recordedBy: req.user.id,
            bloodPressure,
            heartRate,
            respiratoryRate,
            temperature,
            oxygenSaturation,
            height,
            weight,
            painLevel,
            notes
        });

        await newVitals.save();
        
        // Populate before sending response
        const populatedVitals = await Vitals.findById(newVitals._id)
            .populate('patient', 'name dob gender')
            .populate('recordedBy', 'name email');

        res.status(201).json(populatedVitals);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update vitals (Nurses only)
router.put('/:id', auth(['nurse']), async (req, res) => {
    try {
        const updatedVitals = await Vitals.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        )
        .populate('patient', 'name dob gender')
        .populate('recordedBy', 'name email');

        if (!updatedVitals) {
            return res.status(404).json({ error: "Vitals record not found" });
        }

        res.json(updatedVitals);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete vitals (Nurses only)
router.delete('/:id', auth(['nurse']), async (req, res) => {
    try {
        const deleted = await Vitals.findByIdAndDelete(req.params.id);
        if (!deleted) {
            return res.status(404).json({ error: "Vitals record not found" });
        }

        res.json({ message: "Vitals record deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get vitals requiring attention (Nurses only)
router.get('/attention-required', auth(['nurse']), async (req, res) => {
    try {
        const vitals = await Vitals.find({ requiresAttention: true })
            .populate('patient', 'name dob gender')
            .populate('recordedBy', 'name email')
            .sort({ recordedAt: -1 });
        
        res.json(vitals);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get critical vitals (Nurses and Doctors)
router.get('/critical', auth(['nurse', 'doctor']), async (req, res) => {
    try {
        const vitals = await Vitals.find({ isCritical: true })
            .populate('patient', 'name dob gender')
            .populate('recordedBy', 'name email')
            .sort({ recordedAt: -1 });
        
        res.json(vitals);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get vitals statistics (For dashboard)
router.get('/stats', auth(['nurse', 'doctor']), async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const totalVitals = await Vitals.countDocuments();
        const vitalsToday = await Vitals.countDocuments({ 
            recordedAt: { $gte: today } 
        });
        const criticalVitals = await Vitals.countDocuments({ 
            isCritical: true,
            recordedAt: { $gte: today } 
        });
        const attentionRequired = await Vitals.countDocuments({ 
            requiresAttention: true,
            recordedAt: { $gte: today } 
        });

        res.json({
            totalVitals,
            vitalsToday,
            criticalVitals,
            attentionRequired
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;