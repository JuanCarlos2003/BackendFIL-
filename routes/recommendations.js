const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { readJsonFile } = require('../utils/fileUtils');
const { searchBooks } = require('../services/googlebooks');

const shelfFile = './data/shelf.json';

// Lógica simple: obtiene los autores de mayor calificación promedio y sugiere libros de uno de ellos
router.get('/', auth, async (req, res) => {
    const userId = req.user.id.toString();
    const shelf = await readJsonFile(shelfFile);
    const userShelf = shelf[userId] || [];

    if (userShelf.length === 0) return res.json([]);

    // Agrupar por autor y calcular rating promedio
    const authorRatings = {};
    userShelf.forEach(book => {
        const authorsArr = book.authors ? book.authors.split(",") : [];
        authorsArr.forEach(a => {
            const author = a.trim();
            if (!authorRatings[author]) authorRatings[author] = { sum:0, count:0 };
            authorRatings[author].sum += book.rating;
            authorRatings[author].count += 1;
        });
    });

    const avgAuthors = Object.entries(authorRatings).map(([author, data]) => ({
        author,
        avg: data.count > 0 ? data.sum/data.count : 0
    }));

    avgAuthors.sort((a,b)=> b.avg - a.avg);
    const topAuthor = avgAuthors[0];

    if (!topAuthor || topAuthor.avg === 0) {
        return res.json([]); // No hay suficiente data
    }

    // Buscar libros de este autor (salteándose títulos que ya están en la shelf)
    const { books } = await searchBooks("", topAuthor.author);
    const userBookIds = userShelf.map(b=>b.book_id);
    const filtered = books.filter(b=>!userBookIds.includes(b.id));

    // Devolver hasta 4 recomendaciones
    res.json(filtered.slice(0,4));
});

module.exports = router;
