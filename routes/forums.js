const express = require('express');
const { readJsonFile, writeJsonFile } = require('../utils/fileUtilsForums');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();
const forumsFile = path.join(__dirname, '..', 'data', 'forums.json');

// Get all forums
router.get('/', async (req, res) => {
    try {
        const data = await readJsonFile(forumsFile);
        const sortedForums = data.forums.sort((a, b) => 
            new Date(b.createdAt) - new Date(a.createdAt)
        );
        res.json(sortedForums);
    } catch (error) {
        console.error('Error al obtener foros:', error);
        res.status(500).json({ error: 'Error al obtener los foros' });
    }
});

// Get a specific forum
router.get('/:id', async (req, res) => {
    try {
        const data = await readJsonFile(forumsFile);
        const forum = data.forums.find(f => f.id === req.params.id);
        
        if (!forum) {
            return res.status(404).json({ error: 'Foro no encontrado' });
        }
        
        res.json(forum);
    } catch (error) {
        console.error('Error al obtener foro específico:', error);
        res.status(500).json({ error: 'Error al obtener el foro' });
    }
});

// Create new forum
router.post('/', async (req, res) => {
    try {
        const { name, category, description, username } = req.body;

        // Validaciones
        if (!name || !category || !description || !username) {
            return res.status(400).json({ 
                error: 'Todos los campos son requeridos (name, category, description, username)'
            });
        }

        // Convertir a string y validar
        const nameStr = String(name);
        const categoryStr = String(category);
        const descriptionStr = String(description);
        const usernameStr = String(username);

        if (nameStr.length > 100) {
            return res.status(400).json({ 
                error: 'El nombre del foro no puede exceder los 100 caracteres'
            });
        }

        if (descriptionStr.length > 500) {
            return res.status(400).json({ 
                error: 'La descripción no puede exceder los 500 caracteres'
            });
        }

        const newForum = {
            id: uuidv4(),
            name: nameStr.trim(),
            category: categoryStr.trim(),
            description: descriptionStr.trim(),
            createdBy: usernameStr.trim(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const data = await readJsonFile(forumsFile);
        
        // Asegurarse de que data.forums existe
        if (!data.forums) {
            data.forums = [];
        }
        
        data.forums.push(newForum);
        await writeJsonFile(forumsFile, data);

        res.status(201).json(newForum);
    } catch (error) {
        console.error('Error al crear foro:', error);
        res.status(500).json({ error: 'Error al crear el foro' });
    }
});

// Actualizar un foro
router.put('/:id', async (req, res) => {
    try {
        const { name, category, description } = req.body;
        const data = await readJsonFile(forumsFile);
        const forumIndex = data.forums.findIndex(f => f.id === req.params.id);

        if (forumIndex === -1) {
            return res.status(404).json({ error: 'Foro no encontrado' });
        }

        // Actualizar solo los campos proporcionados
        if (name) data.forums[forumIndex].name = String(name).trim();
        if (category) data.forums[forumIndex].category = String(category).trim();
        if (description) data.forums[forumIndex].description = String(description).trim();
        
        data.forums[forumIndex].updatedAt = new Date().toISOString();

        await writeJsonFile(forumsFile, data);
        res.json(data.forums[forumIndex]);
    } catch (error) {
        console.error('Error al actualizar foro:', error);
        res.status(500).json({ error: 'Error al actualizar el foro' });
    }
});

// Eliminar un foro
router.delete('/:id', async (req, res) => {
    try {
        const data = await readJsonFile(forumsFile);
        const forumIndex = data.forums.findIndex(f => f.id === req.params.id);

        if (forumIndex === -1) {
            return res.status(404).json({ error: 'Foro no encontrado' });
        }

        data.forums.splice(forumIndex, 1);
        await writeJsonFile(forumsFile, data);
        
        res.json({ message: 'Foro eliminado exitosamente' });
    } catch (error) {
        console.error('Error al eliminar foro:', error);
        res.status(500).json({ error: 'Error al eliminar el foro' });
    }
});

module.exports = router;