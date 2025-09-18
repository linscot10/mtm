// Backend route for dashboard statistics (add to your routes)
const express = require('express');
const MedicalRecord = require('../models/MedicalRecord');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const LabResult = require('../models/LabResult');
const Prescription = require('../models/Prescription');
const auth = require('../middlewares/auth');

const router = express.Router();

// Get dashboard statistics
router.get('/stats', auth(['nurse', 'doctor', 'lab', 'pharmacist', 'patient']), async (req, res) => {
  try {
    const { role } = req.query;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let stats = {};

    switch(role) {
      case 'doctor':
        // Patients seen today
        const patientsToday = await MedicalRecord.countDocuments({
          doctor: req.user.id,
          createdAt: { $gte: today, $lt: tomorrow }
        }).distinct('patient');

        // Pending records (records without diagnosis)
        const pendingRecords = await MedicalRecord.countDocuments({
          doctor: req.user.id,
          diagnosis: { $in: [null, ''] }
        });

        // Today's appointments
        const todayAppointments = await Appointment.countDocuments({
          doctor: req.user.id,
          date: { $gte: today, $lt: tomorrow },
          status: 'scheduled'
        });

        // Total patients
        const totalPatients = await MedicalRecord.distinct('patient', {
          doctor: req.user.id
        }).then(patients => patients.length);

        stats = {
          patientsToday: patientsToday.length,
          pendingRecords,
          todayAppointments,
          totalPatients
        };
        break;

      case 'nurse':
        // New patients (created today)
        const newPatients = await Patient.countDocuments({
          createdBy: req.user.id,
          createdAt: { $gte: today, $lt: tomorrow }
        });

        // Placeholder for vitals to check (this would need your specific logic)
        const vitalsToCheck = await Appointment.countDocuments({
          status: 'scheduled',
          date: { $gte: today, $lt: tomorrow }
        });

        // Patients with appointments today
        const patientsTodayNurse = await Appointment.countDocuments({
          date: { $gte: today, $lt: tomorrow },
          status: 'scheduled'
        });

        // Total patients
        const totalPatientsNurse = await Patient.countDocuments();

        stats = {
          newPatients,
          vitalsToCheck,
          patientsToday: patientsTodayNurse,
          totalPatients: totalPatientsNurse
        };
        break;

      case 'lab':
        // Pending tests
        const pendingTests = await MedicalRecord.countDocuments({
          testsOrdered: { $exists: true, $ne: '' },
          $expr: {
            $not: {
              $in: [
                "$_id",
                {
                  $map: {
                    input: await LabResult.find().distinct('medicalRecord'),
                    as: "resultRecord",
                    in: "$$resultRecord"
                  }
                }
              ]
            }
          }
        });

        // Completed tests today
        const completedTestsToday = await LabResult.countDocuments({
          technician: req.user.id,
          createdAt: { $gte: today, $lt: tomorrow }
        });

        // Total tests this week
        const weekStart = new Date(today);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);

        const totalTestsThisWeek = await LabResult.countDocuments({
          technician: req.user.id,
          createdAt: { $gte: weekStart, $lt: weekEnd }
        });

        stats = {
          pendingTests,
          completedTestsToday,
          totalTestsThisWeek
        };
        break;

      case 'pharmacist':
        // Pending prescriptions
        const pendingPrescriptions = await Prescription.countDocuments({
          status: 'Pending'
        });

        // Dispensed today
        const dispensedToday = await Prescription.countDocuments({
          pharmacist: req.user.id,
          status: 'Administered',
          updatedAt: { $gte: today, $lt: tomorrow }
        });

        // Total prescriptions this week
        const weekStartPharma = new Date(today);
        weekStartPharma.setDate(weekStartPharma.getDate() - weekStartPharma.getDay());
        const weekEndPharma = new Date(weekStartPharma);
        weekEndPharma.setDate(weekEndPharma.getDate() + 7);

        const totalPrescriptionsThisWeek = await Prescription.countDocuments({
          pharmacist: req.user.id,
          status: 'Administered',
          updatedAt: { $gte: weekStartPharma, $lt: weekEndPharma }
        });

        stats = {
          pendingPrescriptions,
          dispensedToday,
          totalPrescriptionsThisWeek
        };
        break;

      case 'patient':
        // Medical records count
        const medicalRecordsCount = await MedicalRecord.countDocuments({
          patient: req.user.id
        });

        // Upcoming appointments
        const upcomingAppointments = await Appointment.countDocuments({
          patient: req.user.id,
          date: { $gte: today },
          status: 'scheduled'
        });

        // Lab results count
        const labResultsCount = await LabResult.countDocuments({
          $expr: {
            $in: [
              "$medicalRecord",
              await MedicalRecord.find({ patient: req.user.id }).distinct('_id')
            ]
          }
        });

        // Prescriptions count
        const prescriptionsCount = await Prescription.countDocuments({
          $expr: {
            $in: [
              "$medicalRecord",
              await MedicalRecord.find({ patient: req.user.id }).distinct('_id')
            ]
          }
        });

        stats = {
          medicalRecordsCount,
          upcomingAppointments,
          labResultsCount,
          prescriptionsCount
        };
        break;

      default:
        stats = { message: 'No stats available for this role' };
    }

    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;