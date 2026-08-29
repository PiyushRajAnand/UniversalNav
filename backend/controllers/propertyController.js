const Property = require('../models/Property');
const { PROPERTY } = require('../constants/responseMessages');

const getProperties = async (req, res, next) => {
  try {
    const { category, search } = req.query;
    const filter = {};

    if (category) filter.category = category;
    if (search) filter.name = { $regex: search, $options: 'i' };

    const properties = await Property.find(filter).populate('floors');
    res.json({ success: true, count: properties.length, properties });
  } catch (err) {
    next(err);
  }
};

const createProperty = async (req, res, next) => {
  try {
    const { name, description, category, address } = req.body;
    const coverImage = req.file ? `/uploads/covers/${req.file.filename}` : '';

    const property = await Property.create({
      name,
      description,
      category,
      address,
      coverImage,
      createdBy: req.user._id
    });

    res.status(201).json({ success: true, message: PROPERTY.CREATED, property });
  } catch (err) {
    next(err);
  }
};

const getPropertyById = async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id)
      .populate({ path: 'floors', populate: { path: 'nodes' } })
      .populate('reviews.user', 'name');

    if (!property) {
      res.status(404);
      throw new Error(PROPERTY.NOT_FOUND);
    }

    res.json({ success: true, property });
  } catch (err) {
    next(err);
  }
};

const deleteProperty = async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      res.status(404);
      throw new Error(PROPERTY.NOT_FOUND);
    }

    await property.deleteOne();
    res.json({ success: true, message: PROPERTY.DELETED });
  } catch (err) {
    next(err);
  }
};

const addReview = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    const property = await Property.findById(req.params.id);

    if (!property) {
      res.status(404);
      throw new Error(PROPERTY.NOT_FOUND);
    }

    const newReview = {
      user: req.user._id,
      userName: req.user.name,
      rating: Number(rating),
      comment
    };

    property.reviews.push(newReview);
    property.averageRating =
      property.reviews.reduce((acc, item) => item.rating + acc, 0) / property.reviews.length;

    await property.save();
    res.status(201).json({ success: true, message: 'Review added', property });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getProperties,
  createProperty,
  getPropertyById,
  deleteProperty,
  addReview
};
