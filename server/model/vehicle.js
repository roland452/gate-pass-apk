import mongoose from 'mongoose';

const VehicleSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  plateNumber: { type: String, required: true, uppercase: true, trim: true },

  status: {
    type: String,
    enum: ['pending', 'approved', 'denied'],
    default: 'pending',
  },

 
  qrToken: { type: String, default: null },

  deniedReason: { type: String, default: null },

  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  approvedAt: { type: Date, default: null },

 
  currentLocation: {
    type: String,
    enum: ['in', 'out'],
    default: 'out',
  },

}, { timestamps: true });

VehicleSchema.index({ owner: 1, plateNumber: 1 }, { unique: true });

const Vehicle = mongoose.model('Vehicle', VehicleSchema);
export default Vehicle;
