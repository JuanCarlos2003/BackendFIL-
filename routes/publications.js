const express = require('express');
const { readJsonFile, writeJsonFile } = require('../utils/fileUtilsPublications');
const path = require('path');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const fs = require('fs').promises;

const router = express.Router();
const publicationsFile = path.join(__dirname, '..', 'data', 'publications.json');
const authorsFile = path.join(__dirname, '..', 'data', 'authors.json');

// Configuración de multer para el almacenamiento de imágenes
const storage = multer.diskStorage({
    destination: async function (req, file, cb) {
        const uploadDir = path.join(__dirname, '..', 'public', 'uploads');
        try {
            await fs.mkdir(uploadDir, { recursive: true });
            cb(null, uploadDir);
        } catch (error) {
            cb(error, null);
        }
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
        const filetypes = /jpeg|jpg|png|gif/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Solo se permiten imágenes (jpeg, jpg, png, gif)'));
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 5 MB
    }
});

// Middleware para verificar token
const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: "Token no proporcionado" });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: "Token inválido" });
    }
};

// Obtener todas las publicaciones
router.get('/', async (req, res) => {
    try {
        const data = await readJsonFile(publicationsFile);
        const sortedPublications = data.publications.sort((a, b) => 
            new Date(b.createdAt) - new Date(a.createdAt)
        );
        res.json(sortedPublications);
    } catch (error) {
        console.error('Error al obtener publicaciones:', error);
        res.status(500).json({ error: "Error al obtener publicaciones" });
    }
});

// Crear nueva publicación
router.post('/', verifyToken, upload.single('image'), async (req, res) => {
    try {
        if (!req.user.isAuthor) {
            return res.status(403).json({ error: "Solo los autores pueden crear publicaciones" });
        }

        const { title, description, genre } = req.body;
        
        // Validaciones
        if (!title || !description || !genre) {
            return res.status(400).json({ 
                error: "Título, descripción y género son campos requeridos" 
            });
        }

        const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

        // Cargar datos de autores
        const authorsData = await readJsonFile(authorsFile);
        const userId = req.user.id.toString();
        let author = authorsData.authors.find(a => a.userId === userId);

        // Si no existe el perfil del autor, lo creamos
        if (!author) {
            author = {
                userId: userId,
                username: req.user.username,
                name: req.user.username, // Usar username como nombre por defecto
                shortBio: "",
                genre: genre, // Usar el género de la publicación
                publications: []
            };
            authorsData.authors.push(author);
            await writeJsonFile(authorsFile, authorsData);
        }

        // Cargar datos de publicaciones
        let data;
        try {
            data = await readJsonFile(publicationsFile);
        } catch (error) {
            data = { publications: [] };
        }

        const newPublication = {
            id: Date.now().toString(),
            authorId: userId,
            authorName: author.name || req.user.username,
            title: title.trim(),
            description: description.trim(),
            genre,
            imageUrl,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Agregar la publicación
        data.publications.push(newPublication);
        await writeJsonFile(publicationsFile, data);

        // Actualizar las publicaciones del autor
        author.publications.push(newPublication.id);
        await writeJsonFile(authorsFile, authorsData);

        res.status(201).json(newPublication);
    } catch (error) {
        console.error('Error al crear publicación:', error);
        res.status(500).json({ error: "Error al crear publicación" });
    }
});

// Obtener publicaciones por autor
router.get('/author/:authorId', async (req, res) => {
    try {
        const data = await readJsonFile(publicationsFile);
        const authorPublications = data.publications
            .filter(pub => pub.authorId === req.params.authorId)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        res.json(authorPublications);
    } catch (error) {
        console.error('Error al obtener publicaciones del autor:', error);
        res.status(500).json({ error: "Error al obtener publicaciones del autor" });
    }
});

// Obtener una publicación específica
router.get('/:id', async (req, res) => {
    try {
        const data = await readJsonFile(publicationsFile);
        const publication = data.publications.find(p => p.id === req.params.id);
        
        if (!publication) {
            return res.status(404).json({ error: "Publicación no encontrada" });
        }
        
        res.json(publication);
    } catch (error) {
        console.error('Error al obtener la publicación:', error);
        res.status(500).json({ error: "Error al obtener la publicación" });
    }
});

// ... código existente ...

// Eliminar una publicación
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        // Verificar si el usuario es autor
        if (!req.user.isAuthor) {
            return res.status(403).json({ error: "Solo los autores pueden eliminar publicaciones" });
        }

        // Obtener datos de las publicaciones
        const data = await readJsonFile(publicationsFile);
        const publicationIndex = data.publications.findIndex(p => p.id === req.params.id);

        if (publicationIndex === -1) {
            return res.status(404).json({ error: "Publicación no encontrada" });
        }

        const publication = data.publications[publicationIndex];

        // Verificar que el usuario sea el autor de la publicación
        if (publication.authorId !== req.user.id.toString()) {
            return res.status(403).json({ error: "No tienes permiso para eliminar esta publicación" });
        }

        // Si hay una imagen, eliminarla del servidor
        if (publication.imageUrl) {
            const imagePath = path.join(__dirname, '..', 'public', publication.imageUrl);
            try {
                await fs.unlink(imagePath);
            } catch (error) {
                console.error('Error al eliminar la imagen:', error);
            }
        }

        // Eliminar la publicación del array
        data.publications.splice(publicationIndex, 1);
        await writeJsonFile(publicationsFile, data);

        // Actualizar el archivo de autores
        const authorsData = await readJsonFile(authorsFile);
        const authorIndex = authorsData.authors.findIndex(a => a.userId === req.user.id.toString());
        
        if (authorIndex !== -1) {
            const publicationsList = authorsData.authors[authorIndex].publications;
            const pubIndex = publicationsList.indexOf(req.params.id);
            if (pubIndex !== -1) {
                publicationsList.splice(pubIndex, 1);
                await writeJsonFile(authorsFile, authorsData);
            }
        }

        res.json({ message: "Publicación eliminada correctamente" });
    } catch (error) {
        console.error('Error al eliminar publicación:', error);
        res.status(500).json({ error: "Error al eliminar la publicación" });
    }
});

module.exports = router;