const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { readJsonFile } = require('../utils/fileUtils');

const shelfFile = './data/shelf.json';

// GET /api/stats - número de libros leídos y páginas totales
router.get('/', auth, async (req, res) => {
    const userId = req.user.id.toString();
    const shelf = await readJsonFile(shelfFile);
    const userShelf = shelf[userId] || [];

    const finishedBooks = userShelf.filter(b => b.finishedDate != null);
    const totalBooksRead = finishedBooks.length;
    const totalPages = finishedBooks.reduce((sum, b) => sum + (b.pages || 0), 0);

    res.json({ totalBooksRead, totalPages });
});

module.exports = router;
