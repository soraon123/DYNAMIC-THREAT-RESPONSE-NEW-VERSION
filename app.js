const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const apiRoutes = require('./routes/api');
const { initializeDatabase } = require('./models/database');

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api', apiRoutes);

// Start server
initializeDatabase().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
        require('./utils/processMonitor').startMonitoring();
    });
});