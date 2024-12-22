const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { readJsonFile, writeJsonFile } = require('../utils/fileUtils');

const shelfFile = './data/shelf.json';

// GET /api/shelf?category=
router.get('/', auth, async (req, res) => {
    const userId = req.user.id.toString();
    const { category } = req.query;
    const shelf = await readJsonFile(shelfFile);
    let userShelf = shelf[userId] || [];
    if (category) {
        userShelf = userShelf.filter(book => book.tags && book.tags.includes(category));
    }
    res.json(userShelf);
});

// POST /api/shelf - Agregar un libro
router.post('/', auth, async (req, res) => {
    const userId = req.user.id.toString();
    const { book } = req.body;
    if (!book || !book.id) return res.status(400).json({ error: "Datos incompletos." });

    const shelf = await readJsonFile(shelfFile);
    if (!shelf[userId]) shelf[userId] = [];

    const existe = shelf[userId].some(b => b.book_id === book.id);
    if (existe) return res.status(400).json({ error: "El libro ya está en la estantería." });

    shelf[userId].push({
        book_id: book.id,
        title: book.title,
        authors: book.authors,
        thumbnail: book.thumbnail,
        pages: book.pages || 0,
        rating: 0,
        tags: [],
        review: "",
        finishedDate: null
    });

    await writeJsonFile(shelfFile, shelf);
    res.json({ message: "Libro agregado a la biblioteca." });
});

// POST /api/shelf/rate - Calificar un libro
router.post('/rate', auth, async (req, res) => {
    const userId = req.user.id.toString();
    const { bookId, rating } = req.body;
    if (!bookId || typeof rating !== 'number') return res.status(400).json({ error: "Datos incompletos." });
    if (rating < 1 || rating > 5) return res.status(400).json({ error: "Rating inválido." });

    const shelf = await readJsonFile(shelfFile);
    const userShelf = shelf[userId] || [];
    const bookIndex = userShelf.findIndex(b => b.book_id === bookId);
    if (bookIndex === -1) return res.status(404).json({ error: "Libro no encontrado en la biblioteca." });

    userShelf[bookIndex].rating = rating;
    shelf[userId] = userShelf;
    await writeJsonFile(shelfFile, shelf);
    res.json({ message: "Calificación actualizada." });
});

// POST /api/shelf/review - Agregar/actualizar reseña
router.post('/review', auth, async (req, res) => {
    const userId = req.user.id.toString();
    const { bookId, review } = req.body;
    if (!bookId) return res.status(400).json({ error: "Falta bookId." });

    const shelf = await readJsonFile(shelfFile);
    const userShelf = shelf[userId] || [];
    const bookIndex = userShelf.findIndex(b => b.book_id === bookId);
    if (bookIndex === -1) return res.status(404).json({ error: "Libro no encontrado." });

    userShelf[bookIndex].review = review || "";
    shelf[userId] = userShelf;
    await writeJsonFile(shelfFile, shelf);
    res.json({ message: "Reseña actualizada." });
});

// POST /api/shelf/finish - Marcar libro como terminado
router.post('/finish', auth, async (req, res) => {
    const userId = req.user.id.toString();
    const { bookId } = req.body;
    if (!bookId) return res.status(400).json({ error: "Falta bookId." });

    const shelf = await readJsonFile(shelfFile);
    const userShelf = shelf[userId] || [];
    const bookIndex = userShelf.findIndex(b => b.book_id === bookId);
    if (bookIndex === -1) return res.status(404).json({ error: "Libro no encontrado." });

    userShelf[bookIndex].finishedDate = new Date().toISOString().split('T')[0];
    shelf[userId] = userShelf;
    await writeJsonFile(shelfFile, shelf);
    res.json({ message: "Libro marcado como terminado." });
});

// POST /api/shelf/tags - Agregar/actualizar etiquetas
router.post('/tags', auth, async (req, res) => {
    const userId = req.user.id.toString();
    const { bookId, tags } = req.body;
    if (!bookId || !Array.isArray(tags)) return res.status(400).json({ error: "Datos incompletos." });

    const shelf = await readJsonFile(shelfFile);
    const userShelf = shelf[userId] || [];
    const bookIndex = userShelf.findIndex(b => b.book_id === bookId);
    if (bookIndex === -1) return res.status(404).json({ error: "Libro no encontrado." });

    userShelf[bookIndex].tags = tags;
    shelf[userId] = userShelf;
    await writeJsonFile(shelfFile, shelf);
    res.json({ message: "Etiquetas actualizadas." });
});

// DELETE /api/shelf/:bookId - Eliminar libro
router.delete('/:bookId', auth, async (req, res) => {
    const userId = req.user.id.toString();
    const { bookId } = req.params;

    const shelf = await readJsonFile(shelfFile);
    const userShelf = shelf[userId] || [];
    const filtered = userShelf.filter(b => b.book_id !== bookId);

    if (filtered.length === userShelf.length) {
        return res.status(404).json({ error: "Libro no encontrado." });
    }

    shelf[userId] = filtered;
    await writeJsonFile(shelfFile, shelf);
    res.json({ message: "Libro eliminado de la biblioteca." });
});

module.exports = router;
