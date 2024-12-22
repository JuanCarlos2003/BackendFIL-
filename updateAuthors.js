const fs = require('fs').promises;
const path = require('path');

const initialData = {
  "authors": [
    {
      "userId": "1",
      "username": "emilio",
      "name": "Emilio Sánchez",
      "shortBio": "Poeta y escritor emergente, especializado en poesía contemporánea y narrativa experimental. Participante activo en talleres literarios y festivales de poesía.",
      "genre": "Poesía",
      "publications": [
        "1",
        "4"
      ]
    },
    // ... aquí van todos tus autores actuales ...
  ],
  "authorizationCodes": [
    {
      "code": "FIL2024AUTH",
      "usedBy": []
    },
    {
      "code": "FILAUTOR2024",
      "usedBy": []
    }
  ]
};

async function resetAuthorsFile() {
    try {
        const authorsFile = path.join(__dirname, 'data', 'authors.json');
        
        // Crear backup del archivo actual
        try {
            const currentContent = await fs.readFile(authorsFile, 'utf8');
            await fs.writeFile(
                path.join(__dirname, 'data', 'authors_backup.json'),
                currentContent
            );
            console.log('Backup creado exitosamente');
        } catch (error) {
            console.log('No se pudo crear backup (archivo posiblemente no existe)');
        }

        // Escribir el nuevo archivo
        await fs.writeFile(
            authorsFile,
            JSON.stringify(initialData, null, 2),
            'utf8'
        );
        
        console.log('Archivo authors.json reinicializado exitosamente');
    } catch (error) {
        console.error('Error:', error);
    }
}

resetAuthorsFile();