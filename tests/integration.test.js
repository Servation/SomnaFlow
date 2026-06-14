const request = require('supertest');
const fs = require('fs');
const path = require('path');
const app = require('../server');
const cryptoUtils = require('../src/cryptoUtils');

const TEST_LEDGER = path.join(__dirname, '../sleep_records.enc');

// We use supertest to test the express app.
describe('SomnaFlow Integration Tests', () => {
    beforeEach(() => {
        // Ensure clean state
        cryptoUtils.setPassword(null);
        if (fs.existsSync(TEST_LEDGER)) fs.unlinkSync(TEST_LEDGER);
    });

    afterAll(() => {
        if (fs.existsSync(TEST_LEDGER)) fs.unlinkSync(TEST_LEDGER);
    });

    it('should boot into System Locked state when no password is provided', async () => {
        const res = await request(app).get('/status');
        expect(res.body.locked).toBe(true);

        const uploadRes = await request(app).post('/import-csv');
        expect(uploadRes.status).toBe(403);
    });

    it('should reject malformed CSVs safely', async () => {
        cryptoUtils.setPassword('testpass');
        
        const res = await request(app)
            .post('/import-csv')
            .attach('file', Buffer.from('invalid,csv,format\n1,2,3'), 'bad.csv');

        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/Malformed CSV/);
    });

    it('should process valid CSV, encrypt write to disk, and reconstruct history accurately', async () => {
        cryptoUtils.setPassword('testpass');
        
        const validCsv = `timestamp,heart_rate,hrv,sleep_phase\n2023-10-01T00:00:00Z,60,65,light\n2023-10-01T00:01:00Z,58,68,deep\n2023-10-01T00:02:00Z,59,66,rem\n`;
        
        // 1. Upload valid CSV
        const uploadRes = await request(app)
            .post('/import-csv')
            .attach('file', Buffer.from(validCsv), 'valid.csv');

        expect(uploadRes.status).toBe(200);
        expect(uploadRes.body.success).toBe(true);
        expect(uploadRes.body.record.is_partial_data).toBe(false);
        expect(uploadRes.body.record.total_hours).toBe(0.05); // 3 mins = 3/60 = 0.05

        // 2. Verify encrypted file exists
        expect(fs.existsSync(TEST_LEDGER)).toBe(true);

        // 3. Verify history recreation
        const historyRes = await request(app).get('/history');
        expect(historyRes.status).toBe(200);
        expect(historyRes.body.length).toBe(1);
        expect(historyRes.body[0].sleep_score).toBe(uploadRes.body.record.sleep_score);
    });

    it('should handle /unlock endpoint behavior correctly', async () => {
        // 1. Missing password
        const noPassRes = await request(app).post('/unlock').send({});
        expect(noPassRes.status).toBe(400);

        // 2. Unlock success when no ledger exists
        const unlockRes = await request(app).post('/unlock').send({ password: 'test' });
        expect(unlockRes.status).toBe(200);

        // 3. Create a ledger, then try to unlock with wrong password
        const validCsv = `timestamp,heart_rate,hrv,sleep_phase\n2023-10-01T00:00:00Z,60,65,light\n`;
        await request(app).post('/import-csv').attach('file', Buffer.from(validCsv), 'valid.csv');

        cryptoUtils.setPassword(null); // lock it again
        const wrongPassRes = await request(app).post('/unlock').send({ password: 'wrong' });
        expect(wrongPassRes.status).toBe(401);
    });

    it('cryptoUtils should throw if trying to encrypt/decrypt while locked', () => {
        cryptoUtils.setPassword(null);
        expect(() => cryptoUtils.encrypt('test')).toThrow('System is locked');
        expect(() => cryptoUtils.decrypt('test')).toThrow('System is locked');
    });

    it('dataProcessor should throw if no data provided', () => {
        const dataProcessor = require('../src/dataProcessor');
        expect(() => dataProcessor.processSleepData([])).toThrow('No data found');
        expect(() => dataProcessor.processSleepData(null)).toThrow('No data found');
    });
});
