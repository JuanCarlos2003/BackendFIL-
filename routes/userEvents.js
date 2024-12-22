const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { readJsonFile, writeJsonFile } = require('../utils/fileUtils');

const userEventsFile = './data/userEvents.json';

// GET /api/userevents - Obtener eventos del usuario autenticado
router.get('/', auth, async (req, res) => {
    const userId = req.user.id.toString();
    const data = await readJsonFile(userEventsFile);
    const userEvents = data[userId] || [];
    res.json(userEvents);
});

// POST /api/userevents - Agregar un evento a la lista del usuario
// Body: { "eventoId": <number> }
router.post('/', auth, async (req, res) => {
    const userId = req.user.id.toString();
    const { eventoId } = req.body;

    if (!eventoId) return res.status(400).json({ error: "Falta eventoId." });

    const data = await readJsonFile(userEventsFile);
    if (!data[userId]) data[userId] = [];

    // Verificar que el evento no esté ya en la lista
    const existe = data[userId].some(e => e.eventoId === eventoId);
    if (existe) return res.status(400).json({ error: "El evento ya está en tu lista." });

    data[userId].push({
        eventoId,
        estado: "pendiente" // Estado inicial
    });

    await writeJsonFile(userEventsFile, data);
    res.json({ message: "Evento agregado a tu lista." });
});

// PUT /api/userevents/:eventoId - Actualizar estado de un evento
// Body: { "estado": "pendiente" o "asistió" }
router.put('/:eventoId', auth, async (req, res) => {
    const userId = req.user.id.toString();
    const eventoId = parseInt(req.params.eventoId, 10);
    const { estado } = req.body;

    if (!estado || !["pendiente", "asistió"].includes(estado)) {
        return res.status(400).json({ error: "Estado inválido. Debe ser 'pendiente' o 'asistió'." });
    }

    const data = await readJsonFile(userEventsFile);
    const userEvents = data[userId] || [];
    const index = userEvents.findIndex(e => e.eventoId === eventoId);
    if (index === -1) return res.status(404).json({ error: "Evento no encontrado en tu lista." });

    userEvents[index].estado = estado;
    data[userId] = userEvents;
    await writeJsonFile(userEventsFile, data);

    res.json({ message: "Estado actualizado." });
});

// DELETE /api/userevents/:eventoId - Eliminar un evento de la lista del usuario
router.delete('/:eventoId', auth, async (req, res) => {
    const userId = req.user.id.toString();
    const eventoId = parseInt(req.params.eventoId, 10);

    const data = await readJsonFile(userEventsFile);
    const userEvents = data[userId] || [];
    const filtered = userEvents.filter(e => e.eventoId !== eventoId);

    if (filtered.length === userEvents.length) {
        return res.status(404).json({ error: "Evento no encontrado en tu lista." });
    }

    data[userId] = filtered;
    await writeJsonFile(userEventsFile, data);
    res.json({ message: "Evento eliminado de tu lista." });
});

module.exports = router;
