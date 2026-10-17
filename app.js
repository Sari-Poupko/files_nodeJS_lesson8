const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { books } = require('./db');

const app = express();
const PORT = 5000;

// הגדרת מצב הפיתוח (development)
const isDevelopment = process.env.NODE_ENV !== 'production';

// --- Middlewares כלליים ---
app.use(express.json());
app.use(cors());
app.use(helmet()); // אבטחת כותרות HTTP

// הגבלת בקשות (rate-limit)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 דקות
  max: 100 // הגבלה ל-100 בקשות לכל כתובת IP
});
app.use(limiter);

// הדפסת תיעוד לכל בקשה שמגיעה במצב פיתוח (development)[cite: 1]
if (isDevelopment) {
  app.use((req, res, next) => {
    console.log(`[DEV Log] Method: ${req.method}, URL: ${req.url}, Time: ${new Date().toISOString()}`);
    next();
  });
}

// --- Middleware מותאם אישית להוספת currentDate ולחסימת שבת ---
const checkWorkingHoursAndDate = (restrictedDays = []) => {
  return (req, res, next) => {
    const now = new Date();
    req.currentDate = now; // הוספת התאריך והשעה הנוכחיים לאובייקט הבקשה[cite: 1]

    const dayOfWeek = now.getDay(); // 0 = ראשון, ..., 5 = שישי, 6 = שבת
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const currentTimeVal = hours * 60 + minutes;

    if (restrictedDays.includes(dayOfWeek)) {
      const isFridayAfternoon = (dayOfWeek === 5 && currentTimeVal >= 12 * 60);
      const isSaturday = (dayOfWeek === 6);

      if (isFridayAfternoon || isSaturday) {
        return res.status(403).json({
          message: 'השירות אינו פעיל בזמנים אלו (כניסת שבת / שבת קודש).',
          currentDate: req.currentDate
        });
      }
    }

    next();
  };
};

// הפעלת ה-middleware עבור ימים 5 ו-6 (שישי ושבת)
app.use(checkWorkingHoursAndDate([5, 6]));

// 1. נתיב בסיסי
app.get('/', (req, res) => {
  res.send('Server is running successfully!');
});

// 2. קבלת כל הספרים - כולל Pagination וחיפוש לפי שם ספר או קטגוריה
app.get('/books', (req, res) => {
  const { title, category, page, limit } = req.query;
  let filteredBooks = [...books];

  if (title) {
    filteredBooks = filteredBooks.filter(b => 
      b.title.toLowerCase().includes(title.toLowerCase())
    );
  }

  if (category) {
    filteredBooks = filteredBooks.filter(b => 
      b.category.toLowerCase().includes(category.toLowerCase())
    );
  }

  if (page || limit) {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 5;

    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = pageNum * limitNum;
    const paginatedBooks = filteredBooks.slice(startIndex, endIndex);

    return res.json({
      totalResults: filteredBooks.length,
      totalPages: Math.ceil(filteredBooks.length / limitNum),
      currentPage: pageNum,
      limitPerPage: limitNum,
      data: paginatedBooks,
      requestTime: req.currentDate
    });
  }

  res.json(filteredBooks);
});

// 3. קבלת ספר לפי קוד (ID)
app.get('/books/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const book = books.find(b => b.id === id);

  if (!book) {
    return res.status(404).json({ message: 'Book not found' });
  }

  res.json(book);
});

// 4. הוספת ספר
app.post('/books', (req, res) => {
  const { title, category, price } = req.body;

  const newBook = {
    id: books.length > 0 ? Math.max(...books.map(b => b.id)) + 1 : 1,
    title,
    category,
    price,
    isBorrowed: false,
    borrowHistory: []
  };

  books.push(newBook);
  res.status(201).json(newBook);
});

// 5. עדכון פרטי ספר
app.put('/books/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const bookIndex = books.findIndex(b => b.id === id);

  if (bookIndex === -1) {
    return res.status(404).json({ message: 'Book not found' });
  }

  const { title, category, price } = req.body;

  books[bookIndex] = {
    ...books[bookIndex],
    ...(title && { title }),
    ...(category && { category }),
    ...(price && { price })
  };

  res.json(books[bookIndex]);
});

// 6. ביצוע השאלה
app.patch('/books/:id/borrow', (req, res) => {
  const id = parseInt(req.params.id);
  const { userId } = req.body;

  const book = books.find(b => b.id === id);

  if (!book) {
    return res.status(404).json({ message: 'Book not found' });
  }

  if (book.isBorrowed) {
    return res.status(400).json({ message: 'Book is already borrowed' });
  }

  book.isBorrowed = true;
  book.borrowHistory.push({
    borrowDate: new Date().toISOString().split('T')[0],
    userId: userId
  });

  res.json({ message: 'Book borrowed successfully', book });
});

// 7. ביצוע החזרה
app.patch('/books/:id/return', (req, res) => {
  const id = parseInt(req.params.id);
  const book = books.find(b => b.id === id);

  if (!book) {
    return res.status(404).json({ message: 'Book not found' });
  }

  if (!book.isBorrowed) {
    return res.status(400).json({ message: 'Book is not currently borrowed' });
  }

  book.isBorrowed = false;
  res.json({ message: 'Book returned successfully', book });
});

// 8. מחיקת ספר לפי קוד
app.delete('/books/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const bookIndex = books.findIndex(b => b.id === id);

  if (bookIndex === -1) {
    return res.status(404).json({ message: 'Book not found' });
  }

  const deletedBook = books.splice(bookIndex, 1);
  res.json({ message: 'Book deleted successfully', book: deletedBook[0] });
});

// הפעלת השרת
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});