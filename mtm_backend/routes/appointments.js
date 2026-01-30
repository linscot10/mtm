const express = require('express');
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const User = require('../models/User');
const auth = require('../middlewares/auth');

const router = express.Router();

// Get all appointments (with filtering)
router.get('/', auth(['doctor', 'nurse', 'patient']), async (req, res) => {
  try {
    const { 
      patientId, 
      doctorId, 
      date, 
      status, 
      type,
      startDate,
      endDate 
    } = req.query;
    
    let filter = {};
    
    // Role-based filtering
    if (req.user.role === 'patient') {
      filter.patient = req.user.id;
    } else if (req.user.role === 'doctor') {
      filter.doctor = req.user.id;
    }
    
    // Additional filters
    if (patientId) filter.patient = patientId;
    if (doctorId) filter.doctor = doctorId;
    if (date) {
      const selectedDate = new Date(date);
      const nextDay = new Date(selectedDate);
      nextDay.setDate(nextDay.getDate() + 1);
      filter.date = { $gte: selectedDate, $lt: nextDay };
    }
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (startDate && endDate) {
      filter.date = { 
        $gte: new Date(startDate), 
        $lte: new Date(endDate) 
      };
    }
    
    const appointments = await Appointment.find(filter)
      .populate('patient', 'name dob gender contact')
      .populate('doctor', 'name email specialization')
      .sort({ date: 1, time: 1 });
    
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get today's appointments
router.get('/today', auth(['doctor', 'nurse', 'patient']), async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    let filter = { date: { $gte: today, $lt: tomorrow } };
    
    if (req.user.role === 'patient') {
      filter.patient = req.user.id;
    } else if (req.user.role === 'doctor') {
      filter.doctor = req.user.id;
    }
    
    const appointments = await Appointment.find(filter)
      .populate('patient', 'name dob gender contact')
      .populate('doctor', 'name email specialization')
      .sort({ time: 1 });
    
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get upcoming appointments
router.get('/upcoming', auth(['doctor', 'nurse', 'patient']), async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let filter = { 
      date: { $gte: today },
      status: { $in: ['scheduled', 'confirmed'] }
    };
    
    if (req.user.role === 'patient') {
      filter.patient = req.user.id;
    } else if (req.user.role === 'doctor') {
      filter.doctor = req.user.id;
    }
    
    const appointments = await Appointment.find(filter)
      .populate('patient', 'name dob gender contact')
      .populate('doctor', 'name email specialization')
      .sort({ date: 1, time: 1 })
      .limit(20);
    
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get appointment by ID
router.get('/:id', auth(['doctor', 'nurse', 'patient']), async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('patient', 'name dob gender contact address')
      .populate('doctor', 'name email specialization phone');
    
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    // Check permission
    if (req.user.role === 'patient' && appointment.patient._id.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    if (req.user.role === 'doctor' && appointment.doctor._id.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.json(appointment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new appointment (Doctors & Nurses)
router.post('/', auth(['doctor', 'nurse', 'patient']), async (req, res) => {
  try {
    const { patientId, doctorId, date, time, reason, type, duration, notes } = req.body;
    
    // Validate required fields
    if (!patientId || !date || !time || !reason) {
      return res.status(400).json({ error: 'Patient ID, date, time, and reason are required' });
    }
    
    // Check if patient exists
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    // Check if doctor exists
    const doctor = await User.findById(doctorId || req.user.id);
    if (!doctor || !['doctor'].includes(doctor.role)) {
      return res.status(400).json({ error: 'Valid doctor is required' });
    }
    
    // Check for time slot conflicts
    const appointmentDate = new Date(date);
    const appointmentTime = time;
    
    const existingAppointment = await Appointment.findOne({
      doctor: doctorId || req.user.id,
      date: appointmentDate,
      time: appointmentTime,
      status: { $in: ['scheduled', 'confirmed'] }
    });
    
    if (existingAppointment) {
      return res.status(400).json({ error: 'Time slot already booked' });
    }
    
    // Create appointment
    const appointment = new Appointment({
      patient: patientId,
      doctor: doctorId || req.user.id,
      date: appointmentDate,
      time: appointmentTime,
      reason,
      type: type || 'consultation',
      duration: duration || 30,
      notes: notes || '',
      status: 'scheduled',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    await appointment.save();
    
    // Populate before returning
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('patient', 'name dob gender contact')
      .populate('doctor', 'name email specialization');
    
    res.status(201).json(populatedAppointment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update appointment (Doctors & Nurses)
router.put('/:id', auth(['doctor', 'nurse']), async (req, res) => {
  try {
    const { date, time, reason, type, duration, notes, status } = req.body;
    
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    // Check permission (doctor can only update their own appointments)
    if (req.user.role === 'doctor' && appointment.doctor.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Update fields
    if (date) appointment.date = new Date(date);
    if (time) appointment.time = time;
    if (reason) appointment.reason = reason;
    if (type) appointment.type = type;
    if (duration) appointment.duration = duration;
    if (notes !== undefined) appointment.notes = notes;
    if (status) appointment.status = status;
    
    appointment.updatedAt = new Date();
    
    await appointment.save();
    
    // Populate before returning
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('patient', 'name dob gender contact')
      .populate('doctor', 'name email specialization');
    
    res.json(populatedAppointment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update appointment status
router.patch('/:id/status', auth(['doctor', 'nurse', 'patient']), async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status || !['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'].includes(status)) {
      return res.status(400).json({ error: 'Valid status is required' });
    }
    
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    // Check permission
    if (req.user.role === 'patient' && appointment.patient.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    if (req.user.role === 'doctor' && appointment.doctor.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Validate status transitions
    const validTransitions = {
      'scheduled': ['confirmed', 'cancelled'],
      'confirmed': ['in-progress', 'cancelled'],
      'in-progress': ['completed'],
      'completed': [],
      'cancelled': [],
      'no-show': []
    };
    
    if (!validTransitions[appointment.status]?.includes(status)) {
      return res.status(400).json({ 
        error: `Cannot change status from ${appointment.status} to ${status}` 
      });
    }
    
    appointment.status = status;
    appointment.updatedAt = new Date();
    
    await appointment.save();
    
    res.json({ 
      message: `Appointment ${status} successfully`,
      appointment: await Appointment.findById(appointment._id)
        .populate('patient', 'name dob gender contact')
        .populate('doctor', 'name email specialization')
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete appointment (Doctors & Nurses only)
router.delete('/:id', auth(['doctor', 'nurse']), async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    // Check permission (doctor can only delete their own appointments)
    if (req.user.role === 'doctor' && appointment.doctor.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Only allow deletion of future appointments
    const appointmentDate = new Date(appointment.date);
    appointmentDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (appointmentDate <= today) {
      return res.status(400).json({ 
        error: 'Cannot delete past or today\'s appointments. Use cancel instead.' 
      });
    }
    
    await appointment.deleteOne();
    
    res.json({ message: 'Appointment deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get available time slots for a doctor on a specific date
router.get('/availability/:doctorId', auth(['doctor', 'nurse', 'patient']), async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({ error: 'Date is required' });
    }
    
    // Check if doctor exists
    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== 'doctor') {
      return res.status(404).json({ error: 'Doctor not found' });
    }
    
    const selectedDate = new Date(date);
    const nextDay = new Date(selectedDate);
    nextDay.setDate(nextDay.getDate() + 1);
    
    // Get doctor's working hours (you could store this in User model)
    const workingHours = {
      start: '09:00',
      end: '17:00',
      breakStart: '12:00',
      breakEnd: '13:00'
    };
    
    // Get booked appointments for the day
    const bookedAppointments = await Appointment.find({
      doctor: doctorId,
      date: { $gte: selectedDate, $lt: nextDay },
      status: { $in: ['scheduled', 'confirmed'] }
    }).select('time duration');
    
    // Generate available time slots (30-minute intervals)
    const timeSlots = [];
    const slotDuration = 30; // minutes
    
    // Parse working hours
    const [startHour, startMinute] = workingHours.start.split(':').map(Number);
    const [endHour, endMinute] = workingHours.end.split(':').map(Number);
    const [breakStartHour, breakStartMinute] = workingHours.breakStart.split(':').map(Number);
    const [breakEndHour, breakEndMinute] = workingHours.breakEnd.split(':').map(Number);
    
    let currentTime = new Date(selectedDate);
    currentTime.setHours(startHour, startMinute, 0, 0);
    
    const endTime = new Date(selectedDate);
    endTime.setHours(endHour, endMinute, 0, 0);
    
    while (currentTime < endTime) {
      const currentHours = currentTime.getHours();
      const currentMinutes = currentTime.getMinutes();
      
      // Skip break time
      const isBreakTime = 
        (currentHours > breakStartHour || (currentHours === breakStartHour && currentMinutes >= breakStartMinute)) &&
        (currentHours < breakEndHour || (currentHours === breakEndHour && currentMinutes < breakEndMinute));
      
      if (!isBreakTime) {
        const timeString = `${currentHours.toString().padStart(2, '0')}:${currentMinutes.toString().padStart(2, '0')}`;
        
        // Check if time slot is available
        const isBooked = bookedAppointments.some(appointment => {
          const [appointmentHour, appointmentMinute] = appointment.time.split(':').map(Number);
          return appointmentHour === currentHours && appointmentMinute === currentMinutes;
        });
        
        if (!isBooked) {
          timeSlots.push(timeString);
        }
      }
      
      // Move to next slot
      currentTime.setMinutes(currentTime.getMinutes() + slotDuration);
    }
    
    res.json({
      doctor: {
        id: doctor._id,
        name: doctor.name,
        specialization: doctor.specialization
      },
      date: selectedDate.toISOString().split('T')[0],
      availableSlots: timeSlots,
      workingHours
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get appointment statistics
router.get('/stats/overview', auth(['doctor', 'nurse']), async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    let filter = {};
    
    if (req.user.role === 'doctor') {
      filter.doctor = req.user.id;
    }
    
    // Today's appointments
    const todayFilter = { ...filter, date: { $gte: today, $lt: tomorrow } };
    const todayAppointments = await Appointment.find(todayFilter);
    
    // Upcoming appointments
    const upcomingFilter = { ...filter, date: { $gte: tomorrow } };
    const upcomingAppointments = await Appointment.find(upcomingFilter);
    
    // Status breakdown
    const statusStats = await Appointment.aggregate([
      { $match: filter },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    // Monthly appointments (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const monthlyStats = await Appointment.aggregate([
      { $match: { ...filter, date: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 6 }
    ]);
    
    res.json({
      today: {
        total: todayAppointments.length,
        byStatus: todayAppointments.reduce((acc, app) => {
          acc[app.status] = (acc[app.status] || 0) + 1;
          return acc;
        }, {})
      },
      upcoming: upcomingAppointments.length,
      statusBreakdown: statusStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
      monthlyTrend: monthlyStats.map(stat => ({
        month: `${stat._id.year}-${stat._id.month.toString().padStart(2, '0')}`,
        count: stat.count
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// routes/users.js or add to existing auth routes
router.get('/doctors', auth(['nurse', 'doctor', 'patient']), async (req, res) => {
  try {
    const doctors = await User.find({ role: 'doctor' })
      .select('name email specialization phone')
      .sort({ name: 1 });
    
    res.json(doctors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;