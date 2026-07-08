import express from 'express';
import crypto from 'crypto';
import multer from 'multer';
import path from 'path';
import Vehicle from '../model/vehicle.js';
import GateLog from '../model/gateLog.js';
import userAuth from '../controller/userAuth.js';
import Upload from '../multer.js'

const router = express.Router();
const MAX_VEHICLES_PER_USER = 3;



// Signs a permanent payload for an approved vehicle's QR code.
// HMAC, not JWT — this token never expires, so a JWT's built-in exp handling isn't useful here.
function signVehiclePayload(vehicleId, plateNumber) {
    const payload = JSON.stringify({ vehicleId: vehicleId.toString(), plateNumber });
    const signature = crypto
        .createHmac('sha256', process.env.VEHICLE_QR_SECRET)
        .update(payload)
        .digest('hex');
    // Encode as base64 so it's compact inside the QR image
    return Buffer.from(`${payload}.${signature}`).toString('base64');
}

function verifyVehiclePayload(token) {
    try {
        const decoded = Buffer.from(token, 'base64').toString('utf8');
        const [payload, signature] = decoded.split('.').length === 2
            ? [decoded.slice(0, decoded.lastIndexOf('.')), decoded.slice(decoded.lastIndexOf('.') + 1)]
            : [null, null];

        if (!payload || !signature) return null;

        const expectedSignature = crypto
            .createHmac('sha256', process.env.VEHICLE_QR_SECRET)
            .update(payload)
            .digest('hex');

        if (signature !== expectedSignature) return null; // tampered or forged

        return JSON.parse(payload); // { vehicleId, plateNumber }
    } catch (err) {
        return null;
    }
}


// 1. POST: Request a new vehicle — matches the updated Vehicle Registration form
// (owner name, matric/staff ID, department/faculty, make & model, plate, colour,
// phone number, plus an optional proof-of-ownership upload).
router.post('/api/vehicles/request', userAuth, Upload.single('proofOfOwnership'), async (req, res) => {
    const {
        ownerName,
        idNumber,          // matriculation number (student) or staff ID (staff)
        department,        // department or faculty
        vehicleMake,
        vehicleModel,
        plateNumber,
        vehicleColour,
        phoneNumber,
    } = req.body;
    const owner = req.user.userId;

    const requiredFields = { ownerName, idNumber, department, vehicleMake, vehicleModel, plateNumber, vehicleColour, phoneNumber };
    const missing = Object.entries(requiredFields)
        .filter(([, value]) => !value || !value.toString().trim())
        .map(([key]) => key);

    try {
        if (missing.length) {
            return res.status(400).json({ message: `Missing required field(s): ${missing.join(', ')}` });
        }

        const existingCount = await Vehicle.countDocuments({ owner });
        if (existingCount >= MAX_VEHICLES_PER_USER) {
            return res.status(403).json({ message: `You can only register up to ${MAX_VEHICLES_PER_USER} vehicles` });
        }

        const vehicle = new Vehicle({
            owner,
            ownerName: ownerName.trim(),
            idNumber: idNumber.trim().toUpperCase(),
            department: department.trim(),
            vehicleMake: vehicleMake.trim(),
            vehicleModel: vehicleModel.trim(),
            plateNumber: plateNumber.trim().toUpperCase(),
            vehicleColour: vehicleColour.trim(),
            phoneNumber: phoneNumber.trim(),
            proofOfOwnershipUrl: req.file ? `/uploads/proof-of-ownership/${req.file.filename}` : null,
            status: 'pending',
        });

        await vehicle.save();
        res.status(201).json(vehicle);

    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ message: 'You already registered this plate number' });
        }
        console.error('vehicle request error:', error);
        res.status(500).json({ message: 'Failed to submit request' });
    }
});


// 2. GET: My vehicles — matches QrCodePage's vehicle list
router.get('/api/vehicles/mine', userAuth, async (req, res) => {
    try {
        const vehicles = await Vehicle.find({ owner: req.user.userId })
            .sort({ createdAt: -1 })
            .lean();

        res.status(200).json(vehicles);

    } catch (error) {
        console.error('fetch vehicles error:', error);
        res.status(500).json({ message: 'Failed to fetch vehicles' });
    }
});


// 3. GET: All pending requests — for admin review screen
router.get('/api/vehicles/pending', userAuth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }

        const pending = await Vehicle.find({ status: 'pending' })
            .populate('owner', 'name email type')
            .sort({ createdAt: 1 })
            .lean();

        res.status(200).json(pending);

    } catch (error) {
        console.error('fetch pending error:', error);
        res.status(500).json({ message: 'Failed to fetch pending requests' });
    }
});


// 4. PATCH: Approve a vehicle — generates the permanent QR token
router.patch('/api/vehicles/:id/approve', userAuth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }

        const vehicle = await Vehicle.findById(req.params.id);
        if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });

        vehicle.status = 'approved';
        vehicle.qrToken = signVehiclePayload(vehicle._id, vehicle.plateNumber);
        vehicle.approvedBy = req.user.userId;
        vehicle.approvedAt = new Date();

        await vehicle.save();
        res.status(200).json(vehicle);

    } catch (error) {
        console.error('approve vehicle error:', error);
        res.status(500).json({ message: 'Failed to approve vehicle' });
    }
});


// 5. PATCH: Deny a vehicle
router.patch('/api/vehicles/:id/deny', userAuth, async (req, res) => {
    const { reason } = req.body;

    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }

        const vehicle = await Vehicle.findById(req.params.id);
        if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });

        vehicle.status = 'denied';
        vehicle.deniedReason = reason || 'Not specified';

        await vehicle.save();
        res.status(200).json(vehicle);

    } catch (error) {
        console.error('deny vehicle error:', error);
        res.status(500).json({ message: 'Failed to deny vehicle' });
    }
});


// 6. POST: Verify a scan — called by the gate officer's RN app
router.post('/api/vehicles/verify-scan', userAuth, async (req, res) => {
    const { qrToken, gate } = req.body;
    const scannedBy = req.user.userId;

    try {
        const decoded = verifyVehiclePayload(qrToken);

        if (!decoded) {
            return res.status(400).json({ result: 'denied', reason: 'invalid_signature' });
        }

        const vehicle = await Vehicle.findById(decoded.vehicleId).populate('owner', 'name photoUrl');

        if (!vehicle || vehicle.status !== 'approved') {
            await GateLog.create({
                vehicle: decoded.vehicleId,
                direction: 'in',
                scannedBy,
                result: 'denied',
                denialReason: !vehicle ? 'vehicle_not_found' : 'not_approved',
                gate,
            });
            return res.status(403).json({ result: 'denied', reason: !vehicle ? 'vehicle_not_found' : 'not_approved' });
        }

        // Toggle: if currently out, this scan means entering; if in, this scan means exiting
        const direction = vehicle.currentLocation === 'out' ? 'in' : 'out';
        vehicle.currentLocation = direction;
        await vehicle.save();

        await GateLog.create({
            vehicle: vehicle._id,
            direction,
            scannedBy,
            result: 'granted',
            gate,
        });

        res.status(200).json({
            result: 'granted',
            direction,
            owner: { name: vehicle.owner.name, photoUrl: vehicle.owner.photoUrl },
            plateNumber: vehicle.plateNumber,
            vehicleMake: vehicle.vehicleMake,
            vehicleModel: vehicle.vehicleModel,
            vehicleColour: vehicle.vehicleColour,
        });

    } catch (error) {
        console.error('verify-scan error:', error);
        res.status(500).json({ result: 'denied', reason: 'server_error' });
    }
});







// DELETE: Remove a vehicle — matches QrCodePage's trash icon
router.delete('/api/vehicles/:id', userAuth, async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    // Only the owner can delete their own vehicle — never trust the :id alone
    if (vehicle.owner.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'You can only delete your own vehicles' });
    }

    await Vehicle.findByIdAndDelete(req.params.id);

    // Note: this does NOT delete past GateLog entries for this vehicle — that history
    // stays intact for audit purposes even after the vehicle itself is removed.

    res.status(200).json({ message: 'Vehicle deleted', id: req.params.id });

  } catch (error) {
    console.error('delete vehicle error:', error);
    res.status(500).json({ message: 'Failed to delete vehicle' });
  }
});






export default router;
