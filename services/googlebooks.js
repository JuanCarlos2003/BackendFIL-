const axios = require('axios');

async function searchBooks(query, filterAuthor, startIndex=0) {
    let q = encodeURIComponent(query);
    if (filterAuthor) {
        q += `+inauthor:${encodeURIComponent(filterAuthor)}`;
    }

    const url = `https://www.googleapis.com/books/v1/volumes?q=${q}&startIndex=${startIndex}&maxResults=10`;
    const response = await axios.get(url);
    if (!response.data.items) return { books: [], total: 0 };
    const total = response.data.totalItems || 0;
    const books = response.data.items.map(item => ({
        id: item.id,
        title: item.volumeInfo.title || "Título no disponible",
        authors: (item.volumeInfo.authors || []).join(", ") || "Autor no disponible",
        thumbnail: item.volumeInfo.imageLinks?.thumbnail || "",
        pages: item.volumeInfo.pageCount || null,
        publisher: item.volumeInfo.publisher || null,
        publishedDate: item.volumeInfo.publishedDate || null
    }));
    return { books, total };
}

module.exports = { searchBooks };
