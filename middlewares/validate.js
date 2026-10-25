// middlewares/validate.js
const validateBody = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      // איסוף כל הודעות השגיאה למערך או אובייקט אחד
      const errorMessages = error.details.map(detail => detail.message);
      const err = new Error(errorMessages.join('; '));
      res.status(400);
      return next(err);
    }
    
    next();
  };
};

module.exports = { validateBody };
