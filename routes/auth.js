const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { readJsonFile, writeJsonFile } = require('../utils/fileUtils');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config();

const router = express.Router();
const usersFile = path.join(__dirname, '..', 'data', 'users.json');
const authorsFile = path.join(__dirname, '..', 'data', 'authors.json');

function generateSecureToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
}

router.post('/register', async (req, res) => {
    const { username, password, isAuthor, authorCode } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: "Usuario y contraseña son obligatorios." });
    }

    try {
        // Leer usuarios (ahora automáticamente desencriptados)
        const users = await readJsonFile(usersFile);
        
        // Verificar si el usuario ya existe
        if (users.some(u => u.username === username)) {
            return res.status(400).json({ error: "El usuario ya existe." });
        }

        // Si es autor, verificar el código de autorización
        if (isAuthor) {
            if (!authorCode) {
                return res.status(400).json({ error: "Código de autorización requerido para registro de autor." });
            }

            const authorsData = await readJsonFile(authorsFile);
            const validCode = authorsData.authorizationCodes.find(c => c.code === authorCode);

            if (!validCode) {
                return res.status(400).json({ error: "Código de autorización inválido." });
            }

            if (!validCode.usedBy) {
                validCode.usedBy = [];
            }
            validCode.usedBy.push({
                username,
                date: new Date().toISOString()
            });
            
            await writeJsonFile(authorsFile, authorsData);
        }
        const newId = users.length > 0 ? Math.max(...users.map(u => u.id || 0)) + 1 : 1;
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = {
            id: newId,
            username,
            password: hashedPassword,
            isAuthor: isAuthor || false,
            securityToken: generateSecureToken(), // Token adicional de seguridad
            createdAt: new Date().toISOString(),
            lastLogin: null
        };

        users.push(newUser);
        await writeJsonFile(usersFile, users);

        // Si es autor, crear perfil inicial
        if (isAuthor) {
            const authorsData = await readJsonFile(authorsFile);
            const authorProfile = {
                userId: newId.toString(),
                username,
                name: "",
                shortBio: "",
                genre: "",
                publications: [],
                createdAt: new Date().toISOString()
            };
            authorsData.authors.push(authorProfile);
            await writeJsonFile(authorsFile, authorsData);
        }

        res.status(201).json({ 
            message: "Usuario registrado exitosamente.", 
            userId: newId,
            isAuthor: isAuthor || false
        });

    } catch (err) {
        console.error('Error en registro:', err);
        res.status(500).json({ error: "Error al registrar usuario." });
    }
});

// Inicio de sesión
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const users = await readJsonFile(usersFile);
        const user = users.find(u => u.username === username);

        if (!user) {
            return res.status(400).json({ error: "Usuario no encontrado." });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(400).json({ error: "Contraseña incorrecta." });
        }

        // Actualizar último login
        user.lastLogin = new Date().toISOString();
        user.securityToken = generateSecureToken(); // Renovar token de seguridad
        await writeJsonFile(usersFile, users);

        // Generar JWT con información adicional de seguridad
        const token = jwt.sign(
            {
                id: user.id,
                username: user.username,
                isAuthor: user.isAuthor,
                securityToken: user.securityToken,
                timestamp: Date.now()
            },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({
            token,
            username: user.username,
            isAuthor: user.isAuthor,
            lastLogin: user.lastLogin
        });

    } catch (err) {
        console.error('Error en login:', err);
        res.status(500).json({ error: "Error en el inicio de sesión." });
    }
});

// Verificar si un usuario es autor
router.get('/check-author', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: "Token no proporcionado." });
    }

    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        const users = await readJsonFile(usersFile);
        const user = users.find(u => u.id === decoded.id);
        
        if (!user || user.securityToken !== decoded.securityToken) {
            return res.status(401).json({ error: "Sesión inválida." });
        }

        res.json({ 
            isAuthor: decoded.isAuthor,
            username: decoded.username,
            lastLogin: user.lastLogin
        });
    } catch (err) {
        console.error('Error en verificación:', err);
        res.status(401).json({ error: "Token inválido." });
    }
});

module.exports = router;