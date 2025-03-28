const si = require('systeminformation');
const { exec } = require('child_process');
const db = require('../models/database');

let monitoringInterval;
let cpuThreshold = 50;

// Trusted system processes (whitelist)
const TRUSTED_PROCESSES = [
    'System Idle Process',
    'System',
    'svchost.exe',
    'explorer.exe',
    'node.exe',
    'chrome.exe',
    'Code.exe'
];

const updateThreshold = (newThreshold) => {
    cpuThreshold = parseFloat(newThreshold);
};

const getProcessList = async () => {
    try {
        const processes = await si.processes();
        console.log('Processes:', processes);  // Debugging line
        return processes.list.map(p => ({
            name: p.name,
            pid: p.pid,
            cpu: p.pcpu,
            memory: p.pmem
        }));
    } catch (error) {
        console.error('Error getting process list:', error);
        return [];
    }
};


const getSystemStats = async () => {
    try {
        const [cpu, mem] = await Promise.all([
            si.currentLoad(),
            si.mem()
        ]);
        
        return {
            cpuUsage: cpu.currentLoad.toFixed(2),
            memoryUsage: ((mem.total - mem.free) / mem.total * 100).toFixed(2),
            totalMemory: (mem.total / 1024 / 1024 / 1024).toFixed(2),
            freeMemory: (mem.free / 1024 / 1024 / 1024).toFixed(2),
            uptime: Math.floor(process.uptime() / 60), // minutes
            cpuThreshold
        };
    } catch (error) {
        console.error('Error getting system stats:', error);
        return {};
    }
};

const killProcess = (pid) => {
    return new Promise((resolve) => {
        exec(`taskkill /PID ${pid} /F`, (error) => {
            if (error) {
                console.error(`Failed to kill process ${pid}:`, error);
                resolve(false);
            } else {
                resolve(true);
            }
        });
    });
};

const checkProcesses = async () => {
    try {
        const processes = await getProcessList();
        
        for (const proc of processes) {
            if (proc.cpu > cpuThreshold && !TRUSTED_PROCESSES.includes(proc.name)) {
                console.log(`High CPU usage detected: ${proc.name} (PID: ${proc.pid}) - ${proc.cpu.toFixed(2)}%`);
                
                const killed = await killProcess(proc.pid);
                if (killed) {
                    console.log(`Process ${proc.name} (PID: ${proc.pid}) terminated`);
                    db.logEvent('high_cpu', proc.name, proc.pid, proc.cpu, 'terminated');
                } else {
                    db.logEvent('high_cpu', proc.name, proc.pid, proc.cpu, 'failed_to_terminate');
                }
            }
        }
    } catch (error) {
        console.error('Error monitoring processes:', error);
    }
};

const startMonitoring = async () => {
    // Get initial threshold from database
    const threshold = await db.getSetting('cpuThreshold');
    if (threshold) {
        cpuThreshold = parseFloat(threshold);
    }
    
    // Check processes every 5 seconds
    monitoringInterval = setInterval(checkProcesses, 5000);
    console.log(`Process monitoring started with CPU threshold at ${cpuThreshold}%`);
};

const stopMonitoring = () => {
    if (monitoringInterval) {
        clearInterval(monitoringInterval);
        console.log('Process monitoring stopped');
    }
};

module.exports = {
    getProcessList,
    getSystemStats,
    startMonitoring,
    stopMonitoring,
    updateThreshold
};