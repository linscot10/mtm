const mongoose = require('mongoose');



const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['nurse', 'doctor', 'lab', 'pharmacist', 'patient'], required: true },
  patientProfile: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' } // Ensure this exists
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);

