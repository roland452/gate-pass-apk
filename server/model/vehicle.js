import mongoose from 'mongoose';



const vehicleSchema = new mongoose.Schema(
    {
        owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

        // --- Fields collected on the registration form ---
        ownerName: { type: String, required: true, trim: true },
        idNumber: { type: String, required: true, trim: true, uppercase: true }, // matric no. or staff ID
        department: { type: String, required: true, trim: true }, // department or faculty
        vehicleMake: { type: String, required: true, trim: true },
        vehicleModel: { type: String, required: true, trim: true },
        plateNumber: { type: String, required: true, trim: true, uppercase: true },
        vehicleColour: { type: String, required: true, trim: true },
        phoneNumber: { type: String, required: true, trim: true },
        proofOfOwnershipUrl: { type: String, default: null }, // optional upload

        // --- Approval workflow ---
        status: { type: String, enum: ['pending', 'approved', 'denied'], default: 'pending' },
        qrToken: { type: String, default: null },
        approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        approvedAt: { type: Date, default: null },
        deniedReason: { type: String, default: null },

        // --- Gate tracking ---
        currentLocation: { type: String, enum: ['in', 'out'], default: 'out' },
    },
    { timestamps: true }
);

// One plate per owner — mirrors the 409 duplicate-plate handling in routes/vehicle.js
vehicleSchema.index({ owner: 1, plateNumber: 1 }, { unique: true });

export default mongoose.model('Vehicle', vehicleSchema);
