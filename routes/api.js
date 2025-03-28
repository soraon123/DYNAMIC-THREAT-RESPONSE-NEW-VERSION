const express = require('express');
const router = express.Router();
const processMonitor = require('../utils/processMonitor');
const db = require('../models/database');

// Get current processes
router.get('/processes', async (req, res) => {
    try {
        const processes = await processMonitor.getProcessList();
        res.json(processes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get system stats
router.get('/stats', async (req, res) => {
    try {
        const stats = await processMonitor.getSystemStats();
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get history
router.get('/history', async (req, res) => {
    try {
        const history = await db.getHistory();
        res.json(history);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update settings
router.post('/settings', async (req, res) => {
    try {
        const { cpuThreshold } = req.body;
        if (cpuThreshold && !isNaN(cpuThreshold)) {
            await db.updateSetting('cpuThreshold', cpuThreshold);
            processMonitor.updateThreshold(cpuThreshold);
            res.json({ success: true });
        } else {
            res.status(400).json({ error: 'Invalid threshold value' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;