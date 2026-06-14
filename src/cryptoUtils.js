const crypto = require('crypto');
const fs = require('fs');

let encryptionKey = null;

function setPassword(password) {
    if (!password) {
        encryptionKey = null;
        return;
    }
    // Derive a 32-byte key using SHA-256 for AES-256-CBC
    encryptionKey = crypto.createHash('sha256').update(String(password)).digest();
}

function isLocked() {
    return encryptionKey === null;
}

function encrypt(text) {
    if (isLocked()) throw new Error("System is locked");
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', encryptionKey, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
}

function decrypt(text) {
    if (isLocked()) throw new Error("System is locked");
    const parts = text.split(':');
    const iv = Buffer.from(parts.shift(), 'hex');
    const encryptedText = parts.join(':');
    const decipher = crypto.createDecipheriv('aes-256-cbc', encryptionKey, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

function appendRecordSync(filePath, recordObj) {
    const jsonStr = JSON.stringify(recordObj);
    const encryptedLine = encrypt(jsonStr);
    fs.appendFileSync(filePath, encryptedLine + '\n', 'utf8');
}

function readHistorySync(filePath) {
    if (!fs.existsSync(filePath)) return [];
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n').filter(line => line.trim() !== '');
    return lines.map(line => {
        const decrypted = decrypt(line);
        return JSON.parse(decrypted);
    });
}

module.exports = {
    setPassword,
    isLocked,
    encrypt,
    decrypt,
    appendRecordSync,
    readHistorySync
};
