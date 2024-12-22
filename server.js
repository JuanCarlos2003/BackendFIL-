require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Importación de rutas
const authRoutes = require('./routes/auth');
const booksRoutes = require('./routes/books');
const shelfRoutes = require('./routes/shelf');
const statsRoutes = require('./routes/stats');
const eventsRoutes = require('./routes/events');
const userEventsRoutes = require('./routes/userEvents');
const recommendationsRoutes = require('./routes/recommendations');
const commentsRoutes = require('./routes/comments');
const forumsRoutes = require('./routes/forums');
const authorsRoutes = require('./routes/authors');
const publicationsRoutes = require('./routes/publications');
const errorHandler = require('./middleware/errorHandler');
const app = express();

// Verificar y crear archivos JSON necesarios
const initializeDataFiles = () => {
    const dataDir = path.join(__dirname, 'data');
    const publicDir = path.join(__dirname, 'public');
    const uploadsDir = path.join(publicDir, 'uploads');
    
    // Crear directorios si no existen
    [dataDir, publicDir, uploadsDir].forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    });

    const files = {
        'authors.json': { authors: [], authorizationCodes: [] },
        'publications.json': { publications: [] }
    };

    Object.entries(files).forEach(([filename, defaultContent]) => {
        const filepath = path.join(dataDir, filename);
        if (!fs.existsSync(filepath)) {
            fs.writeFileSync(filepath, JSON.stringify(defaultContent, null, 2));
        }
    });
};

initializeDataFiles();

app.use(cors({
    origin: '*'
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/books', booksRoutes);
app.use('/api/shelf', shelfRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/recommendations', recommendationsRoutes);
app.use('/api/comments', commentsRoutes);
app.use('/api/forums', forumsRoutes);
app.use('/api/authors', authorsRoutes);
app.use('/api/publications', publicationsRoutes);
app.use('/api/events', eventsRoutes); 
app.use('/api/userevents', userEventsRoutes);

app.use(errorHandler)

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor corriendo en http://0.0.0.0:${PORT}`);
});

function readJsonFile(filename) {
  const filePath = path.join(__dirname, '..', filename);
  if (!fs.existsSync(filePath)) {
      return [];
  }
  const data = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(data);
}

function writeJsonFile(filename, data) {
  const filePath = path.join(__dirname, '..', filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

module.exports = { readJsonFile, writeJsonFile };