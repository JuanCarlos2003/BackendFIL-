const express = require("express");
const router = express.Router();
const { searchBooks } = require("../services/googlebooks");

// Ruta para buscar libros
router.get("/", async (req, res) => {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: "Por favor, proporciona un término de búsqueda." });

    try {
        const books = await searchBooks(q);
        res.json(books);
    } catch (error) {
        res.status(500).json({ error: "Error al buscar libros." });
    }
});

module.exports = router;
