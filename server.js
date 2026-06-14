const express = require('express');
const multer = require('multer');
const { parse } = require('csv-parse/sync');
const fs = require('fs');
const path = require('path');
const cryptoUtils = require('./src/cryptoUtils');
const dataProcessor = require('./src/dataProcessor');

const app = express();
const port = process.env.PORT || 3000;
const upload = multer({ storage: multer.memoryStorage() });

const LEDGER_FILE = path.join(__dirname, 'sleep_records.enc');

app.use(express.static('public'));
app.use(express.json());

// Initialize cipher if ENV var present
if (process.env.SOMNA_PASSWORD) {
    cryptoUtils.setPassword(process.env.SOMNA_PASSWORD);
    console.log("Cipher initialized via environment variable.");
}

// Check lock state middleware
function requireUnlocked(req, res, next) {
    if (cryptoUtils.isLocked()) {
        return res.status(403).json({ error: 'System Locked', locked: true });
    }
    next();
}

app.get('/status', (req, res) => {
    res.json({ locked: cryptoUtils.isLocked() });
});

app.post('/unlock', (req, res) => {
    const { password } = req.body;
    if (!password) return res.status(400).json({ error: 'Password required' });
    
    cryptoUtils.setPassword(password);
    
    try {
        if (fs.existsSync(LEDGER_FILE)) {
            cryptoUtils.readHistorySync(LEDGER_FILE);
        }
        res.json({ success: true });
    } catch (err) {
        cryptoUtils.setPassword(null);
        res.status(401).json({ error: 'Invalid password / Decryption failed' });
    }
});

app.post('/import-csv', requireUnlocked, upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    try {
        const csvString = req.file.buffer.toString('utf8');
        req.file.buffer = null; // Drop buffer reference

        const records = parse(csvString, {
            columns: true,
            skip_empty_lines: true
        });

        // Validate basic CSV structure
        if (records.length > 0 && !('timestamp' in records[0] && 'heart_rate' in records[0])) {
            throw new Error('Malformed CSV. Missing required columns.');
        }

        const dailyRecord = dataProcessor.processSleepData(records);

        cryptoUtils.appendRecordSync(LEDGER_FILE, dailyRecord);

        res.json({ success: true, record: dailyRecord });
    } catch (err) {
        console.error(err);
        res.status(400).json({ error: 'Failed to process CSV: ' + err.message });
    }
});

app.get('/history', requireUnlocked, (req, res) => {
    try {
        const history = cryptoUtils.readHistorySync(LEDGER_FILE);
        res.json(history);
    } catch (err) {
        res.status(500).json({ error: 'Failed to read history' });
    }
});

if (require.main === module) {
    app.listen(port, () => {
        console.log(`SomnaFlow running on http://localhost:${port}`);
        if (cryptoUtils.isLocked()) {
            console.log("WARNING: System is LOCKED. Please provide password via UI.");
        }
    });
}

module.exports = app;
