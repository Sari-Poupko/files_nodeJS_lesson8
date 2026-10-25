const Joi = require('joi');

const bookSchema = Joi.object({
  title: Joi.string().min(2).required(),
  category: Joi.string().required(),
  price: Joi.number().positive().required()
});

const userSchema = Joi.object({
  userId: Joi.number().integer().required(),
  name: Joi.string().min(2)
});

module.exports = { bookSchema, userSchema };