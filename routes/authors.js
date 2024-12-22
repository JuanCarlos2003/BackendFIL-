const express = require('express');
const { readJsonFile, writeJsonFile } = require('../utils/fileUtils');
const path = require('path');
const jwt = require('jsonwebtoken');

const router = express.Router();
const authorsFile = path.join(__dirname, '..', 'data', 'authors.json');
const usersFile = path.join(__dirname, '..', 'data', 'users.json');

// Middleware para verificar si es autor
const isAuthor = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: "Token no proporcionado." });
    }

    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Verificar que el token sea válido y corresponda al usuario actual
        const users = await readJsonFile(usersFile);
        const user = users.find(u => u.id === decoded.id);
        
        if (!user || user.securityToken !== decoded.securityToken) {
            return res.status(401).json({ error: "Sesión inválida." });
        }

        if (!decoded.isAuthor) {
            return res.status(403).json({ error: "Acceso no autorizado." });
        }
        
        req.user = {
            ...decoded,
            securityToken: user.securityToken
        };
        next();
    } catch (err) {
        console.error('Error en verificación de autor:', err);
        res.status(401).json({ error: "Token inválido." });
    }
};

// Obtener todos los autores
router.get('/', async (req, res) => {
    try {
        const data = await readJsonFile(authorsFile);
        // Filtrar información sensible antes de enviar
        const filteredAuthors = data.authors.map(author => ({
            userId: author.userId,
            username: author.username,
            name: author.name,
            shortBio: author.shortBio,
            genre: author.genre,
            publications: author.publications
        }));
        res.json(filteredAuthors);
    } catch (error) {
        console.error('Error al obtener autores:', error);
        res.status(500).json({ error: "Error al obtener autores." });
    }
});

// Obtener un autor específico
router.get('/:userId', async (req, res) => {
    try {
        const data = await readJsonFile(authorsFile);
        const author = data.authors.find(a => a.userId === req.params.userId);
        
        if (!author) {
            return res.status(404).json({ error: "Autor no encontrado." });
        }
        
        // Filtrar información sensible antes de enviar
        const filteredAuthor = {
            userId: author.userId,
            username: author.username,
            name: author.name,
            shortBio: author.shortBio,
            genre: author.genre,
            publications: author.publications
        };
        
        res.json(filteredAuthor);
    } catch (error) {
        console.error('Error al obtener autor:', error);
        res.status(500).json({ error: "Error al obtener el autor." });
    }
});

// Crear o actualizar perfil de autor
router.post('/profile', isAuthor, async (req, res) => {
    try {
        const { name, shortBio, genre } = req.body;
        
        if (!name || !shortBio || !genre) {
            return res.status(400).json({ 
                error: "Todos los campos son requeridos (name, shortBio, genre)." 
            });
        }

        const data = await readJsonFile(authorsFile);
        
        const authorIndex = data.authors.findIndex(a => a.userId === req.user.id.toString());
        const authorProfile = {
            userId: req.user.id.toString(),
            username: req.user.username,
            name,
            shortBio,
            genre,
            publications: authorIndex === -1 ? [] : data.authors[authorIndex].publications,
            updatedAt: new Date().toISOString()
        };

        if (authorIndex === -1) {
            authorProfile.createdAt = new Date().toISOString();
            data.authors.push(authorProfile);
        } else {
            data.authors[authorIndex] = {
                ...data.authors[authorIndex],
                ...authorProfile
            };
        }

        await writeJsonFile(authorsFile, data);

        // Filtrar información sensible antes de enviar la respuesta
        const filteredProfile = {
            userId: authorProfile.userId,
            username: authorProfile.username,
            name: authorProfile.name,
            shortBio: authorProfile.shortBio,
            genre: authorProfile.genre,
            publications: authorProfile.publications
        };

        res.json(filteredProfile);
    } catch (error) {
        console.error('Error al actualizar perfil de autor:', error);
        res.status(500).json({ error: "Error al actualizar perfil de autor." });
    }
});

// Nueva ruta para verificar código de autorización
router.post('/verify-code', async (req, res) => {
    const { authorCode } = req.body;

    if (!authorCode) {
        return res.status(400).json({ error: "Código de autorización requerido." });
    }

    try {
        const data = await readJsonFile(authorsFile);
        const validCode = data.authorizationCodes.find(c => c.code === authorCode && !c.used);

        if (!validCode) {
            return res.status(400).json({ error: "Código inválido o ya utilizado." });
        }

        res.json({ valid: true, message: "Código válido." });
    } catch (error) {
        console.error('Error al verificar código:', error);
        res.status(500).json({ error: "Error al verificar código de autorización." });
    }
});

module.exports = router;