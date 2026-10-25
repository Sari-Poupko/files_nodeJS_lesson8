const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { books } = require('./db');
// ייבוא מנהלי השגיאות שיצרנו קודם
const { notFoundHandler, globalErrorHandler } = require('./middlewares/errorMiddlewares');

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

// הדפסת תיעוד לכל בקשה במצב פיתוח
if (isDevelopment) {
  app.use((req, res, next) => {
    console.log(`[DEV Log] Method: ${req.method}, URL: ${req.url}, Time: ${new Date().toISOString()}`);
    next();
  });
}

// --- Middleware מותאם אישית לחסימת פעילות בזמנים מוגדרים (כגון שבת) ---
const checkWorkingHoursAndDate = (restrictedDays = []) => {
  return (req, res, next) => {
    const now = new Date();
    req.currentDate = now; 

    const dayOfWeek = now.getDay(); // 0 = ראשון, ..., 5 = שישי, 6 = שבת
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const currentTimeVal = hours * 60 + minutes;

    if (restrictedDays.includes(dayOfWeek)) {
      const isFridayAfternoon = (dayOfWeek === 5 && currentTimeVal >= 12 * 60);
      const isSaturday = (dayOfWeek === 6);

      if (isFridayAfternoon || isSaturday) {
        return res.status(403).json({
          message: 'השירות אינו פעיל בזמנים אלו.',
          currentDate: req.currentDate
        });
      }
    }

    next();
  };
};

// הפעלת ה־middleware עבור ימים 5 ו-6 (שישי ושבת)
app.use(checkWorkingHoursAndDate([5, 6]));

// --- נתיבים (Routes) ---
app.get('/', (req, res) => {
  res.send('Server is running successfully!');
});

// דוגמה לנתיב קבלת ספרים
app.get('/books', (req, res) => {
  res.json(books);
});

// ==========================================
// חשוב מאוד: רישום ה־Middlewares לשגיאות בסוף!
// ==========================================
// 1. טיפול בנתיב שלא נמצא (חייב להיות אחרי כל הנתיבים הרגילים)
app.use(notFoundHandler);

// 2. טיפול בשגיאות כלליות בשרת (חייב להיות אחרון מכולם)
app.use(globalErrorHandler);

// הפעלת השרת
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});