// middlewares/errorMiddlewares.js

// 1. טיפול בנתיב לא נמצא (404)
const notFoundHandler = (req, res, next) => {
  const error = new Error(`הנתיב המבוקש לא נמצא: ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// 2. טיפול בשגיאות כלליות (500)
const globalErrorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  
  const errorResponse = {
    error: {
      massage: err.message || 'שגיאת שרת פנימית',
      type: 'server error',
      ...(isDevelopment && { stack: err.stack }) // מציג stack רק במצב פיתוח
    }
  };

  res.status(statusCode).json(errorResponse);
};

module.exports = { notFoundHandler, globalErrorHandler };