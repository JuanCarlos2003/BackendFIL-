const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const eventosPath = path.join(__dirname, '../data/events.json');

// Función para leer y parsear el archivo eventos.json
function getEvents() {
try {
const data = fs.readFileSync(eventosPath, 'utf-8');
return JSON.parse(data);
} catch (error) {
console.error('Error al leer el archivo events.json:', error.message);
return [];
}
}

// GET /api/eventos
// Permite filtrar por query params: ?fecha=YYYY-MM-DD&hora=HH:MM%20AM/PM
router.get('/', (req, res) => {
let events = getEvents();

const { fecha, hora } = req.query;

if (fecha) {
events = events.filter(e => e.fecha === fecha);
}

if (hora) {
events = events.filter(e => e.hora === hora);
}

res.json(events);
});

// GET /api/events/:id - obtiene un evento por ID
router.get('/:id', (req, res) => {
    const events = getEvents();
    const id = parseInt(req.params.id, 10);
    const event = events.find(e => e.id === id);
    if (!event) {
        return res.status(404).json({ error: 'Evento no encontrado' });
    }
    res.json(event);
});

module.exports = router;

