import express from 'express';
import GateLog from '../model/gateLog.js';
import userAuth from '../controller/userAuth.js';

const router = express.Router();

// GET all gate logs for the current user's vehicles
// Grouped by date, with filter support
router.get('/api/gate-logs/my-history', userAuth, async (req, res) => {
  try {
    const userId = req.user._id || req.user.userId;
    const { filter = 'all', page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build direction filter
    const directionFilter = filter === 'in' 
      ? { direction: 'in' } 
      : filter === 'out' 
      ? { direction: 'out' } 
      : {};

    // Find all logs where scannedBy is this user
    // OR vehicle belongs to this user
    const logs = await GateLog.find({
      scannedBy: userId,
      ...directionFilter
    })
    .populate('vehicle', 'plateNumber make model color')
    .populate('scannedBy', 'name')
    .sort({ scannedAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

    const total = await GateLog.countDocuments({
      scannedBy: userId,
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
        vehicleInfo: `${log.vehicle?.make || ''} ${log.vehicle?.model || ''}`.trim(),
        color: log.vehicle?.color || ''
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
    const userId = req.user._id || req.user.userId;

    const [totalIn, totalOut, totalDenied, todayLogs] = await Promise.all([
      GateLog.countDocuments({ scannedBy: userId, direction: 'in', result: 'granted' }),
      GateLog.countDocuments({ scannedBy: userId, direction: 'out', result: 'granted' }),
      GateLog.countDocuments({ scannedBy: userId, result: 'denied' }),
      GateLog.countDocuments({ 
        scannedBy: userId,
        scannedAt: { $gte: new Date(new Date().setHours(0,0,0,0)) }
      })
    ]);

    res.status(200).json({
      success: true,
      data: { totalIn, totalOut, totalDenied, todayLogs }
    });

  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch stats' });
  }
});

export default router;