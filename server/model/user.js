import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },

  type: {
    type: String,
    enum: ['student', 'lecturer', 'other'],
    required: true,
  },

  photoUrl: { type: String, default: null },

  role: {
    type: String,
    enum: ['user', 'admin', 'gate_officer'],
    default: 'user',
  },

}, { timestamps: true });

UserSchema.virtual('approvedVehicleCount', {
  ref: 'Vehicle',
  localField: '_id',
  foreignField: 'owner',
  count: true,
  match: { status: 'approved' },
});

UserSchema.set('toJSON', { virtuals: true });
UserSchema.set('toObject', { virtuals: true });

const User = mongoose.model('User', UserSchema);
export default User;
