const express = require('express');
const Patient = require('../models/Patient');
const auth = require('../middlewares/auth');
const MedicalRecord = require('../models/MedicalRecord');

const router = express.Router();

// Create a new patient (Nurses only)
router.post('/', auth(['nurse']), async (req, res) => {
    try {
        const { name, dob, gender, contact, address } = req.body;

        const newPatient = new Patient({
            name,
            dob,
            gender,
            contact,
            address,
            createdBy: req.user.id
        });

        await newPatient.save();
        res.status(201).json(newPatient);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all patients (Doctors, Nurses)
router.get('/', auth(['doctor', 'nurse']), async (req, res) => {
  try {
    // Get all patients, not just those created by staff
    const patients = await Patient.find()
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    res.json(patients);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.put('/user/:userId', auth(['patient', 'nurse', 'doctor']), async (req, res) => {
  try {
    // Find patient by user ID
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ msg: "User not found" });
    
    // Find patient record linked to this user
    let patient = await Patient.findOne({ _id: user.patientProfile });
    
    if (!patient) {
      // Create new patient record if it doesn't exist
      patient = new Patient({
        name: user.name,
        dob: req.body.dob,
        gender: req.body.gender,
        contact: req.body.contact,
        address: req.body.address,
        createdBy: req.params.userId
      });
      await patient.save();
      
      // Link patient record to user
      user.patientProfile = patient._id;
      await user.save();
    } else {
      // Update existing patient record
      patient.dob = req.body.dob || patient.dob;
      patient.gender = req.body.gender || patient.gender;
      patient.contact = req.body.contact || patient.contact;
      patient.address = req.body.address || patient.address;
      await patient.save();
    }
    
    res.json(patient);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a single patient by ID
router.get('/:id', auth(['doctor', 'nurse']), async (req, res) => {
    try {
        const patient = await Patient.findById(req.params.id).populate('medicalHistory');
        if (!patient) return res.status(404).json({ msg: "Patient not found" });

        res.json(patient);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update patient info (Nurses only)
router.put('/:id', auth(['nurse']), async (req, res) => {
    try {
        const updatedPatient = await Patient.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedPatient) return res.status(404).json({ msg: "Patient not found" });

        res.json(updatedPatient);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete patient (Nurses only)
router.delete('/:id', auth(['nurse']), async (req, res) => {
    try {
        const deleted = await Patient.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ msg: "Patient not found" });

        res.json({ msg: "Patient deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
