const express = require('express');
const Prescription = require('../models/Prescription');
const MedicalRecord = require('../models/MedicalRecord');
const Patient = require('../models/Patient');
const auth = require('../middlewares/auth');
const router = express.Router();

// Get all prescriptions (with filtering based on role)
router.get('/', auth(['doctor', 'nurse', 'pharmacist', 'patient']), async (req, res) => {
  try {
    let query = {};
    let populateOptions = [
      { 
        path: 'medicalRecord',
        populate: [
          { path: 'patient', select: 'name dob gender contact' },
          { path: 'doctor', select: 'name email' }
        ]
      },
      { path: 'pharmacist', select: 'name email' }
    ];

    if (req.user.role === 'patient') {
      // Get patient's medical records first
      const patientRecords = await MedicalRecord.find({ 
        patient: req.user.id 
      }).select('_id');
      
      const recordIds = patientRecords.map(record => record._id);
      query.medicalRecord = { $in: recordIds };
    } 
    else if (req.user.role === 'pharmacist') {
      // Pharmacists see all prescriptions
      // No additional filtering
    }
    else if (req.user.role === 'doctor') {
      // Doctors see their own prescriptions
      const doctorRecords = await MedicalRecord.find({ 
        doctor: req.user.id 
      }).select('_id');
      
      const recordIds = doctorRecords.map(record => record._id);
      query.medicalRecord = { $in: recordIds };
    }

    const prescriptions = await Prescription.find(query)
      .populate(populateOptions)
      .sort({ createdAt: -1 });

    res.json(prescriptions);
  } catch (err) {
    console.error('Error fetching prescriptions:', err);
    res.status(500).json({ error: err.message });
  }
});

// Create a new prescription
router.post('/', auth(['doctor']), async (req, res) => {
  try {
    const { medicalRecord, drugName, dosage, instructions, duration } = req.body;

    // Verify the medical record exists and belongs to the doctor
    const record = await MedicalRecord.findOne({
      _id: medicalRecord,
      doctor: req.user.id
    }).populate('patient doctor');

    if (!record) {
      return res.status(404).json({ 
        error: 'Medical record not found or you are not authorized to prescribe for this record' 
      });
    }

    const newPrescription = new Prescription({
      medicalRecord,
      drugName,
      dosage,
      instructions: instructions || '',
      duration: duration || '',
      status: 'Pending'
    });

    const savedPrescription = await newPrescription.save();
    
    // Populate the response
    const populated = await Prescription.findById(savedPrescription._id)
      .populate({
        path: 'medicalRecord',
        populate: [
          { path: 'patient', select: 'name dob gender' },
          { path: 'doctor', select: 'name email' }
        ]
      });

    res.status(201).json(populated);
  } catch (err) {
    console.error('Error creating prescription:', err);
    res.status(500).json({ error: err.message });
  }
});

// Update prescription status to Administered (Pharmacist only)
router.put('/:id/administer', auth(['pharmacist']), async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate('medicalRecord');
    
    if (!prescription) {
      return res.status(404).json({ error: 'Prescription not found' });
    }

    if (prescription.status === 'Administered') {
      return res.status(400).json({ error: 'Prescription already administered' });
    }

    prescription.status = 'Administered';
    prescription.pharmacist = req.user.id;
    prescription.updatedAt = Date.now();

    const updated = await prescription.save();
    
    // Populate the response
    const populated = await Prescription.findById(updated._id)
      .populate({
        path: 'medicalRecord',
        populate: [
          { path: 'patient', select: 'name' },
          { path: 'doctor', select: 'name' }
        ]
      })
      .populate('pharmacist', 'name');

    res.json(populated);
  } catch (err) {
    console.error('Error updating prescription:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get prescriptions by patient
router.get('/patient/:patientId', auth(['doctor', 'nurse', 'pharmacist', 'patient']), async (req, res) => {
  try {
    // Check if user has permission
    if (req.user.role === 'patient' && req.user.id !== req.params.patientId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get all medical records for this patient
    const records = await MedicalRecord.find({ 
      patient: req.params.patientId 
    }).select('_id');
    
    const recordIds = records.map(record => record._id);

    const prescriptions = await Prescription.find({
      medicalRecord: { $in: recordIds }
    })
      .populate({
        path: 'medicalRecord',
        populate: [
          { path: 'patient', select: 'name' },
          { path: 'doctor', select: 'name' }
        ]
      })
      .populate('pharmacist', 'name')
      .sort({ createdAt: -1 });

    res.json(prescriptions);
  } catch (err) {
    console.error('Error fetching patient prescriptions:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get prescriptions by medical record
router.get('/record/:recordId', auth(['doctor', 'nurse', 'pharmacist']), async (req, res) => {
  try {
    const prescriptions = await Prescription.find({
      medicalRecord: req.params.recordId
    })
      .populate({
        path: 'medicalRecord',
        populate: [
          { path: 'patient', select: 'name' },
          { path: 'doctor', select: 'name' }
        ]
      })
      .populate('pharmacist', 'name')
      .sort({ createdAt: -1 });

    res.json(prescriptions);
  } catch (err) {
    console.error('Error fetching record prescriptions:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;