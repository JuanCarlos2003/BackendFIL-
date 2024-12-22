const express = require('express');
const { readJsonFile, writeJsonFile } = require('../utils/fileUtilsComments');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();
const commentsFile = path.join(__dirname, '..', 'data', 'comments.json');

// Get comments for a specific forum
router.get('/forum/:forumId', async (req, res) => {
    try {
        const data = await readJsonFile(commentsFile);
        const forumComments = data.comments
            .filter(c => c.forumId === req.params.forumId)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        res.json(forumComments);
    } catch (error) {
        console.error('Error al obtener comentarios:', error);
        res.status(500).json({ error: 'Error al obtener los comentarios' });
    }
});

// Create new comment in a forum
router.post('/', async (req, res) => {
    try {
        const { forumId, text, username } = req.body;

        // Validaciones
        if (!forumId || !text || !username) {
            return res.status(400).json({ 
                error: 'forumId, text y username son campos requeridos' 
            });
        }

        if (text.length > 1000) {
            return res.status(400).json({ 
                error: 'El comentario no puede exceder los 1000 caracteres' 
            });
        }

        const newComment = {
            id: uuidv4(),
            forumId,
            username,
            text: text.trim(),
            timestamp: new Date().toISOString()
        };

        const data = await readJsonFile(commentsFile);
        data.comments.push(newComment);
        await writeJsonFile(commentsFile, data);

        res.status(201).json(newComment);
    } catch (error) {
        console.error('Error al crear comentario:', error);
        res.status(500).json({ error: 'Error al crear el comentario' });
    }
});

// Opcional: Obtener todos los comentarios (para administración)
router.get('/', async (req, res) => {
    try {
        const data = await readJsonFile(commentsFile);
        res.json(data.comments);
    } catch (error) {
        console.error('Error al obtener todos los comentarios:', error);
        res.status(500).json({ error: 'Error al obtener los comentarios' });
    }
});

module.exports = router;