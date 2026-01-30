const mongoose = require('mongoose');

const VitalsSchema = new mongoose.Schema({
    patient: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Patient', 
        required: true 
    },
    recordedBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    // Vital Signs
    bloodPressure: {
        systolic: { type: Number, min: 50, max: 250 },
        diastolic: { type: Number, min: 30, max: 150 }
    },
    heartRate: { type: Number, min: 30, max: 250 }, // BPM
    respiratoryRate: { type: Number, min: 8, max: 60 }, // Breaths per minute
    temperature: { type: Number, min: 30, max: 45 }, // Celsius
    oxygenSaturation: { type: Number, min: 50, max: 100 }, // SpO2 percentage
    height: { type: Number }, // cm
    weight: { type: Number }, // kg
    bmi: { type: Number }, // Calculated BMI
    painLevel: { 
        type: Number, 
        min: 0, 
        max: 10 
    }, // 0-10 scale
    // Additional notes
    notes: { type: String },
    // Status flags
    isCritical: { type: Boolean, default: false },
    requiresAttention: { type: Boolean, default: false },
    // Metadata
    recordedAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Calculate BMI before saving
VitalsSchema.pre('save', function(next) {
    if (this.height && this.weight) {
        // Convert height from cm to meters
        const heightInMeters = this.height / 100;
        this.bmi = (this.weight / (heightInMeters * heightInMeters)).toFixed(2);
    }
    
    // Check for critical values
    this.isCritical = this.checkCriticalValues();
    this.requiresAttention = this.checkAttentionRequired();
    
    next();
});

// Method to check for critical values
VitalsSchema.methods.checkCriticalValues = function() {
    const criticalConditions = [
        (this.bloodPressure?.systolic > 180 || this.bloodPressure?.systolic < 90),
        (this.bloodPressure?.diastolic > 120 || this.bloodPressure?.diastolic < 60),
        (this.heartRate > 120 || this.heartRate < 50),
        (this.respiratoryRate > 24 || this.respiratoryRate < 12),
        (this.temperature > 38.5 || this.temperature < 35),
        (this.oxygenSaturation < 92),
        (this.painLevel >= 8)
    ];
    
    return criticalConditions.some(condition => condition === true);
};

// Method to check if attention is required
VitalsSchema.methods.checkAttentionRequired = function() {
    const attentionConditions = [
        (this.bloodPressure?.systolic > 160 || this.bloodPressure?.systolic < 100),
        (this.bloodPressure?.diastolic > 100 || this.bloodPressure?.diastolic < 70),
        (this.heartRate > 100 || this.heartRate < 60),
        (this.respiratoryRate > 20 || this.respiratoryRate < 14),
        (this.temperature > 37.8 || this.temperature < 36),
        (this.oxygenSaturation < 95),
        (this.painLevel >= 5)
    ];
    
    return attentionConditions.some(condition => condition === true);
};

module.exports = mongoose.model('Vitals', VitalsSchema);