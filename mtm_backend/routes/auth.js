const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Patient = require('../models/Patient');
const router = express.Router();

// Register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ msg: "User already exists" });

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({ name, email, password: hashedPassword, role });
        await newUser.save();

        res.status(201).json({ msg: "User registered successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Login

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1d" });

    // Check if patient has complete profile
    let hasCompleteProfile = true;
    if (user.role === 'patient' && user.patientProfile) {
      const patient = await Patient.findById(user.patientProfile);
      hasCompleteProfile = patient && patient.dob && patient.gender && patient.contact;
    }

    res.json({ 
      token, 
      role: user.role, 
      userId: user._id,
      hasCompleteProfile 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// router.post('/login', async (req, res) => {
//     try {
//         const { email, password } = req.body;

//         const user = await User.findOne({ email });
//         if (!user) return res.status(400).json({ msg: "User not found" });

//         const isMatch = await bcrypt.compare(password, user.password);
//         if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

//         const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1d" });

//         res.json({ token, role: user.role });
//     } catch (err) {
//         res.status(500).json({ error: err.message });
//     }
// });


// router.post('/register-with-patient', async (req, res) => {
//   try {
//     const { name, email, password, role, dob, gender, contact, address } = req.body;

//     // Check if user already exists
//     const existingUser = await User.findOne({ email });
//     if (existingUser) return res.status(400).json({ msg: "User already exists" });

//     // Hash password
//     const hashedPassword = await bcrypt.hash(password, 10);

//     // Create user
//     const newUser = new User({ name, email, password: hashedPassword, role });
//     await newUser.save();

//     // If patient, create patient record
//     if (role === 'patient') {
//       const newPatient = new Patient({
//         name,
//         dob: dob || new Date(),
//         gender: gender || 'unknown',
//         contact: contact || '',
//         address: address || '',
//         createdBy: newUser._id // Link to the user who created this
//       });
//       await newPatient.save();
      
//       // Link patient record to user
//       newUser.patientProfile = newPatient._id;
//       await newUser.save();
//     }

//     res.status(201).json({ msg: "User registered successfully" });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });


router.post('/register-with-patient', async (req, res) => {
  try {
    const { name, email, password, role, patientDetails } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: "User already exists" });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = new User({ 
      name, 
      email, 
      password: hashedPassword, 
      role 
    });

    // If patient, create patient record
    if (role === 'patient' && patientDetails) {
      const newPatient = new Patient({
        name,
        dob: patientDetails.dob || new Date(),
        gender: patientDetails.gender || 'unknown',
        contact: patientDetails.contact || '',
        address: patientDetails.address || '',
        createdBy: newUser._id
      });
      
      await newPatient.save();
      newUser.patientProfile = newPatient._id;
    }

    await newUser.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: err.message });
  }
});
module.exports = router;
