const fs = require('fs');
const path = require('path');

function readJsonFile(fileName) {
    const filePath = path.join(__dirname, '..', 'data', fileName);
    if (!fs.existsSync(filePath)) {
        return [];
    }
    const data = fs.readFileSync(filePath, 'utf-8');
    try {
        return JSON.parse(data);
    } catch (err) {
        console.error("Error parseando JSON:", err);
        return [];
    }
}

function writeJsonFile(fileName, data) {
    const filePath = path.join(__dirname, '..', 'data', fileName);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

module.exports = {
    readJsonFile,
    writeJsonFile
};
