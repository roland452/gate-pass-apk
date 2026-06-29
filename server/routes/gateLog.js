import express from 'express';
import GateLog from '../model/gateLog.js';
import userAuth from '../controller/userAuth.js';

const router = express.Router();

// 1. GET: All gate logs — admin audit trail, newest first
router.get('/api/gate-logs', userAuth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }

        const { limit = 50, vehicleId } = req.query;
        const filter = vehicleId ? { vehicle: vehicleId } : {};

        const logs = await GateLog.find(filter)
            .populate('vehicle', 'plateNumber owner')
            .populate('scannedBy', 'name email')
            .sort({ scannedAt: -1 })
            .limit(Number(limit))
            .lean();

        res.status(200).json(logs);

    } catch (error) {
        console.error('fetch gate logs error:', error);
        res.status(500).json({ message: 'Failed to fetch gate logs' });
    }
});


// 2. GET: Logs for a single vehicle 
router.get('/api/gate-logs/vehicle/:vehicleId', userAuth, async (req, res) => {
    try {
        const logs = await GateLog.find({ vehicle: req.params.vehicleId })
            .sort({ scannedAt: -1 })
            .limit(50)
            .lean();

        res.status(200).json(logs);

    } catch (error) {
        console.error('fetch vehicle logs error:', error);
        res.status(500).json({ message: 'Failed to fetch vehicle logs' });
    }
});


export default router;

