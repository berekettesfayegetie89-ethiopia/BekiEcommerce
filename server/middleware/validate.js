const Joi = require('joi');
const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) return res.status(400).json({ message: error.details.map(d => d.message).join(', ') });
  next();
};
const schemas = {
  register: Joi.object({ name: Joi.string().min(2).max(100).required(), email: Joi.string().email().required(), password: Joi.string().min(6).required() }),
  login: Joi.object({ email: Joi.string().email().required(), password: Joi.string().required() }),
  product: Joi.object({
    name: Joi.string().min(2).max(300).required(),
    description: Joi.string().min(10).required(),
    price: Joi.number().min(0).required(),
    originalPrice: Joi.number().min(0).default(0),
    category: Joi.string().valid('Electronics','Clothing','Home','Sports','Books','Beauty','Toys','Automotive').required(),
    brand: Joi.string().allow('').default('Generic'),
    image: Joi.string().required(),
    images: Joi.array().items(Joi.string()).default([]),
    stock: Joi.number().integer().min(0).required(),
    rating: Joi.number().min(0).max(5).default(4.0),
    isFeatured: Joi.boolean().default(false),
    isFlashSale: Joi.boolean().default(false),
    flashSalePrice: Joi.number().min(0).allow(null),
    flashSaleEnds: Joi.date().allow(null),
    tags: Joi.array().items(Joi.string()).default([]),
    variants: Joi.array().default([]),
  }),
  order: Joi.object({
    shippingAddress: Joi.object({ fullName: Joi.string().required(), address: Joi.string().required(), city: Joi.string().required(), postalCode: Joi.string().required(), country: Joi.string().required(), phone: Joi.string().required() }).required(),
    paymentMethod: Joi.string().valid('chapa','telebirr','cbebirr','mpesa','amole','cod').required(),
    couponCode: Joi.string().allow('').default(''),
    notes: Joi.string().allow('').default(''),
  }),
  review: Joi.object({ rating: Joi.number().integer().min(1).max(5).required(), title: Joi.string().allow(''), comment: Joi.string().min(5).required() }),
  coupon: Joi.object({ code: Joi.string().min(3).max(50).required(), type: Joi.string().valid('percentage','fixed').required(), value: Joi.number().min(0).required(), minOrderAmount: Joi.number().min(0).default(0), maxUsage: Joi.number().integer().min(1).default(100), expiresAt: Joi.date().allow(null), isActive: Joi.boolean().default(true) }),
  forgotPassword: Joi.object({ email: Joi.string().email().required() }),
  resetPassword: Joi.object({ password: Joi.string().min(6).required() }),
};
module.exports = { validate, schemas };
