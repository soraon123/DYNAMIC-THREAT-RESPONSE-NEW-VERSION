const sqlite3 = require('sqlite3').verbose();
const path = require('path');

let db;

const initializeDatabase = () => {
    return new Promise((resolve, reject) => {
        db = new sqlite3.Database(path.join(__dirname, '../data/process-monitor.db'), (err) => {
            if (err) {
                console.error('Database connection error:', err);
                return reject(err);
            }
            
            // Create tables if they don't exist
            db.serialize(() => {
                db.run(`
                    CREATE TABLE IF NOT EXISTS processes (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        pid INTEGER,
                        name TEXT,
                        cpu_usage REAL,
                        memory_usage REAL,
                        status TEXT,
                        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                `);
                
                db.run(`
                    CREATE TABLE IF NOT EXISTS history (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        event_type TEXT,
                        process_name TEXT,
                        process_pid INTEGER,
                        cpu_usage REAL,
                        action_taken TEXT,
                        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                `);
                
                db.run(`
                    CREATE TABLE IF NOT EXISTS settings (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        key TEXT UNIQUE,
                        value TEXT
                    )
                `, () => {
                    // Initialize default settings
                    db.get("SELECT value FROM settings WHERE key = 'cpuThreshold'", (err, row) => {
                        if (!row) {
                            db.run("INSERT INTO settings (key, value) VALUES ('cpuThreshold', '50')");
                        }
                        resolve();
                    });
                });
            });
        });
    });
};

const getHistory = () => {
    return new Promise((resolve, reject) => {
        db.all("SELECT * FROM history ORDER BY timestamp DESC LIMIT 100", (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

const logEvent = (eventType, processName, processPid, cpuUsage, actionTaken) => {
    db.run(
        "INSERT INTO history (event_type, process_name, process_pid, cpu_usage, action_taken) VALUES (?, ?, ?, ?, ?)",
        [eventType, processName, processPid, cpuUsage, actionTaken]
    );
};

const updateSetting = (key, value) => {
    return new Promise((resolve, reject) => {
        db.run(
            "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
            [key, value],
            (err) => {
                if (err) reject(err);
                else resolve();
            }
        );
    });
};

const getSetting = (key) => {
    return new Promise((resolve, reject) => {
        db.get("SELECT value FROM settings WHERE key = ?", [key], (err, row) => {
            if (err) reject(err);
            else resolve(row ? row.value : null);
        });
    });
};

module.exports = {
    initializeDatabase,
    getHistory,
    logEvent,
    updateSetting,
    getSetting
};