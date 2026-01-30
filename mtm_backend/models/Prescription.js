const mongoose = require('mongoose');

const PrescriptionSchema = new mongoose.Schema({
    medicalRecord: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'MedicalRecord', 
        required: true 
    },
    pharmacist: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    },
    drugName: { 
        type: String, 
        required: true 
    },
    dosage: { 
        type: String, 
        required: true 
    },
    instructions: { 
        type: String, 
        default: '' 
    },
    duration: { 
        type: String, 
        default: '' 
    },
    status: { 
        type: String, 
        enum: ['Pending', 'Administered'], 
        default: 'Pending' 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    },
    updatedAt: { 
        type: Date 
    }
});

PrescriptionSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Prescription', PrescriptionSchema);