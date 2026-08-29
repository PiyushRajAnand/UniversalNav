const Floor = require('../models/Floor');
const Property = require('../models/Property');

const createFloor = async (req, res, next) => {
  try {
    const { propertyId, floorLevel, floorName } = req.body;
    const mapImage = req.file ? `/uploads/floors/${req.file.filename}` : '';

    const property = await Property.findById(propertyId);
    if (!property) {
      res.status(404);
      throw new Error('Associated property not found');
    }

    const floor = await Floor.create({
      property: propertyId,
      floorLevel,
      floorName,
      mapImage
    });

    property.floors.push(floor._id);
    await property.save();

    res.status(201).json({ success: true, floor });
  } catch (err) {
    next(err);
  }
};

module.exports = { createFloor };
