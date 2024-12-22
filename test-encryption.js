const fs = require('fs').promises;
const path = require('path');
const { readJsonFile, writeJsonFile } = require('./utils/fileUtils');

async function testEncryption() {
    const testFile = path.join(__dirname, 'data', 'authors.json');
    
    // 1. Crear datos de prueba
    const testData = {
        message: "Si puedes leer esto, los datos NO están encriptados",
        timestamp: new Date().toISOString()
    };

    try {
        // 2. Escribir datos usando nuestro sistema
        console.log('Escribiendo datos de prueba...');
        await writeJsonFile(testFile, testData);

        // 3. Leer el archivo directamente
        console.log('\nLeyendo archivo raw...');
        const rawData = await fs.readFile(testFile, 'utf-8');
        console.log('Contenido raw del archivo:');
        console.log(rawData);

        // 4. Leer usando nuestro sistema
        console.log('\nLeyendo con nuestro sistema...');
        const decryptedData = await readJsonFile(testFile);
        console.log('Datos descifrados:');
        console.log(decryptedData);

        // 5. Verificar estructura
        const fileContent = JSON.parse(rawData);
        console.log('\nVerificación de encriptación:');
        console.log('¿Tiene IV?:', fileContent.hasOwnProperty('iv'));
        console.log('¿Tiene datos encriptados?:', fileContent.hasOwnProperty('data'));
        
        // 6. Limpiar
        await fs.unlink(testFile);
        console.log('\nPrueba completada y archivo de prueba eliminado.');
        
    } catch (error) {
        console.error('Error durante la prueba:', error);
    }
}

testEncryption();