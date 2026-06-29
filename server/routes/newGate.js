import express from 'express';
import GateLog from '../model/gateLog.js';
import userAuth from '../controller/userAuth.js';

const router = express.Router();


router.get('/api/gate-logs/my-history', userAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { filter = 'all', page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

  
    if (filter === 'pending') {
      const Vehicle = (await import('../model/vehicle.js')).default;

      const stillIn = await Vehicle.find({
        status: 'approved',
        currentLocation: 'in',
      }).lean();

      // For each still-checked-in vehicle, find its most recent "in" log for context
      const vehicleIds = stillIn.map(v => v._id);
      const lastInLogs = await GateLog.find({
        vehicle: { $in: vehicleIds },
        direction: 'in',
      })
        .sort({ scannedAt: -1 })
        .lean();

      // Map each vehicle to its latest "in" scan
      const latestByVehicle = {};
      lastInLogs.forEach(log => {
        const key = log.vehicle.toString();
        if (!latestByVehicle[key]) latestByVehicle[key] = log;
      });

      const pendingList = stillIn.map(v => ({
        _id: latestByVehicle[v._id.toString()]?._id || v._id,
        direction: 'in',
        result: 'granted',
        denialReason: null,
        gate: latestByVehicle[v._id.toString()]?.gate || 'main',
        scannedAt: latestByVehicle[v._id.toString()]?.scannedAt || v.updatedAt,
        plateNumber: v.plateNumber,
        vehicleId: v._id,
      }));

      return res.status(200).json({
        success: true,
        data: [{ date: 'Currently checked in', logs: pendingList }],
        hasMore: false,
        total: pendingList.length,
      });
    }

    // Build direction filter
    const directionFilter = filter === 'in'
      ? { direction: 'in' }
      : filter === 'out'
      ? { direction: 'out' }
      : {};

    const logs = await GateLog.find({
      ...directionFilter
    })
      .populate('vehicle', 'plateNumber') 
      .populate('scannedBy', 'name')
      .sort({ scannedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await GateLog.countDocuments({
      ...directionFilter
    });

    // Group by date
    const grouped = {};
    logs.forEach(log => {
      const date = new Date(log.scannedAt);
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);

      let dateKey;
      if (date.toDateString() === today.toDateString()) {
        dateKey = 'Today';
      } else if (date.toDateString() === yesterday.toDateString()) {
        dateKey = 'Yesterday';
      } else {
        dateKey = date.toLocaleDateString('en-GB', {
          day: 'numeric', month: 'short', year: 'numeric'
        });
      }

      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push({
        _id: log._id,
        direction: log.direction,
        result: log.result,
        denialReason: log.denialReason,
        gate: log.gate,
        scannedAt: log.scannedAt,
        plateNumber: log.vehicle?.plateNumber || 'Unknown',
      });
    });

    // Convert to array for frontend
    const groupedArray = Object.entries(grouped).map(([date, logs]) => ({
      date,
      logs
    }));

    res.status(200).json({
      success: true,
      data: groupedArray,
      hasMore: skip + logs.length < total,
      total
    });

  } catch (error) {
    console.error('Gate logs history error:', error);
    res.status(500).json({ message: 'Failed to fetch history' });
  }
});

// GET stats summary
router.get('/api/gate-logs/stats', userAuth, async (req, res) => {
  try {
    const userId = req.user.userId;

    const [totalIn, totalOut, totalDenied, todayLogs] = await Promise.all([
      GateLog.countDocuments({ direction: 'in', result: 'granted' }),
      GateLog.countDocuments({ direction: 'out', result: 'granted' }),
      GateLog.countDocuments({ result: 'denied' }),
      GateLog.countDocuments({
        scannedAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
      })
    ]);

    res.status(200).json({
      success: true,
      data: { totalIn, totalOut, totalDenied, todayLogs }
    });

  } catch (error) {
    console.error('Gate logs stats error:', error);
    res.status(500).json({ message: 'Failed to fetch stats' });
  }
});

// GET full detail for a single gate log — shown when a card is tapped
router.get('/api/gate-logs/:id/detail', userAuth, async (req, res) => {
  try {
    const log = await GateLog.findById(req.params.id)
      .populate({
        path: 'vehicle',
        select: 'plateNumber owner currentLocation status',
        populate: { path: 'owner', select: 'name email photoUrl type' },
      })
      .populate('scannedBy', 'name email')
      .lean();

    if (!log) return res.status(404).json({ message: 'Log not found' });

    res.status(200).json({
      success: true,
      data: {
        _id: log._id,
        direction: log.direction,
        result: log.result,
        denialReason: log.denialReason,
        gate: log.gate,
        scannedAt: log.scannedAt,
        plateNumber: log.vehicle?.plateNumber || 'Unknown',
        currentLocation: log.vehicle?.currentLocation,
        scannedBy: log.scannedBy ? { name: log.scannedBy.name, email: log.scannedBy.email } : null,
        owner: log.vehicle?.owner
          ? {
              name: log.vehicle.owner.name,
              email: log.vehicle.owner.email,
              photoUrl: log.vehicle.owner.photoUrl,
              type: log.vehicle.owner.type,
            }
          : null,
      },
    });

  } catch (error) {
    console.error('Gate log detail error:', error);
    res.status(500).json({ message: 'Failed to fetch log detail' });
  }
});



export default router;