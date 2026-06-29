import mongoose from 'mongoose';

const GateLogSchema = new mongoose.Schema({
  
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },

  direction: { type: String, enum: ['in', 'out'], required: true },

  scannedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, 

  result: { type: String, enum: ['granted', 'denied'], required: true },

  denialReason: { type: String, default: null }, 

  gate: { type: String, default: 'main' }, 

}, { timestamps: { createdAt: 'scannedAt', updatedAt: false } });

const GateLog = mongoose.model('GateLog', GateLogSchema);
export default GateLog;


