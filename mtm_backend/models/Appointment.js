const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
  patient: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Patient', 
    required: true 
  },
  doctor: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  date: { 
    type: Date, 
    required: true 
  },
  time: { 
    type: String, 
    required: true 
  },
  duration: { 
    type: Number, 
    default: 30, // minutes
    min: 15,
    max: 120
  },
  reason: { 
    type: String, 
    required: true 
  },
  type: {
    type: String,
    enum: ['consultation', 'follow-up', 'emergency', 'routine-check', 'vaccination', 'other'],
    default: 'consultation'
  },
  status: { 
    type: String, 
    enum: ['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'], 
    default: 'scheduled' 
  },
  notes: { 
    type: String 
  },
  reminderSent: {
    type: Boolean,
    default: false
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Index for faster queries
AppointmentSchema.index({ date: 1, time: 1, doctor: 1 });
AppointmentSchema.index({ patient: 1, date: -1 });
AppointmentSchema.index({ doctor: 1, date: -1 });
AppointmentSchema.index({ status: 1, date: 1 });

module.exports = mongoose.model('Appointment', AppointmentSchema);                        