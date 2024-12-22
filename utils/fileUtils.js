const fs = require('fs').promises;
const crypto = require('crypto');

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32);
const IV_LENGTH = 16;
const ALGORITHM = 'aes-256-cbc';

function encrypt(data) {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
    
    let encrypted = cipher.update(JSON.stringify(data));
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    
    return {
        iv: iv.toString('hex'),
        data: encrypted.toString('hex')
    };
}

function decrypt(encryptedData) {
    const iv = Buffer.from(encryptedData.iv, 'hex');
    const encrypted = Buffer.from(encryptedData.data, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
    
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return JSON.parse(decrypted.toString());
}

// Función para leer archivos JSON
async function readJsonFile(filePath) {
    try {
        const data = await fs.readFile(filePath, 'utf-8');
        const parsedData = JSON.parse(data);
        
        if (parsedData.iv && parsedData.data) {
            return decrypt(parsedData);
        }
        
        return parsedData; 
    } catch (error) {
        console.error(`Error al leer el archivo: ${filePath}`);
        throw error;
    }
}

async function writeJsonFile(filePath, content) {
    try {
        const encryptedContent = encrypt(content);
        await fs.writeFile(
            filePath, 
            JSON.stringify(encryptedContent, null, 2), 
            'utf-8'
        );
    } catch (error) {
        console.error(`Error al escribir el archivo: ${filePath}`);
        throw error;
    }
}

module.exports = { readJsonFile, writeJsonFile };