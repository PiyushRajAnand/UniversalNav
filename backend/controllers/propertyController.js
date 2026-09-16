const mongoose = require("mongoose");

const Property = require("../models/Property");
const {
  PROPERTY,
} = require("../constants/responseMessages");

/*
====================================================
HELPERS
====================================================
*/

const getUserId = (req) => {
  return req.user?._id || req.user?.id || null;
};

const isAdmin = (req) => {
  return req.user?.role === "Admin";
};

/*
====================================================
GET ALL PROPERTIES
====================================================

Public read operation.

Supports:
- category
- search
====================================================
*/

const getProperties = async (
  req,
  res,
  next
) => {
  try {
    const {
      category,
      search,
    } = req.query;

    const filter = {};

    /*
    ----------------------------------------------------
    CATEGORY
    ----------------------------------------------------
    */

    if (
      typeof category === "string" &&
      category.trim()
    ) {
      filter.category =
        category.trim();
    }

    /*
    ----------------------------------------------------
    SEARCH
    ----------------------------------------------------
    */

    if (
      typeof search === "string" &&
      search.trim()
    ) {
      filter.name = {
        $regex: search.trim(),
        $options: "i",
      };
    }

    /*
    ----------------------------------------------------
    FETCH
    ----------------------------------------------------
    */

    const properties =
      await Property.find(filter)
        .populate("floors")
        .sort({
          createdAt: -1,
        });

    return res.status(200).json({
      success: true,
      count: properties.length,
      properties,
    });
  } catch (error) {
    console.error(
      "Error fetching properties:",
      error
    );

    return next(error);
  }
};

/*
====================================================
CREATE PROPERTY
====================================================

Property creation requires authentication.

The authenticated user becomes the creator.
====================================================
*/

const createProperty = async (
  req,
  res,
  next
) => {
  try {
    /*
    ----------------------------------------------------
    AUTHENTICATION
    ----------------------------------------------------
    */

    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Login required.",
      });
    }

    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Login required.",
      });
    }

    /*
    ----------------------------------------------------
    REQUEST DATA
    ----------------------------------------------------
    */

    const {
      name,
      description,
      category,
      address,
    } = req.body;

    /*
    ----------------------------------------------------
    BASIC VALIDATION
    ----------------------------------------------------
    */

    if (
      typeof name !== "string" ||
      !name.trim()
    ) {
      return res.status(400).json({
        success: false,
        error: "Property name is required.",
      });
    }

    /*
    ----------------------------------------------------
    COVER IMAGE
    ----------------------------------------------------
    */

    const coverImage = req.file
      ? `/uploads/covers/${req.file.filename}`
      : "";

    /*
    ----------------------------------------------------
    CREATE
    ----------------------------------------------------
    */

    const property =
      await Property.create({
        name: name.trim(),

        description:
          typeof description === "string"
            ? description.trim()
            : "",

        category:
          typeof category === "string"
            ? category.trim()
            : "",

        address,

        coverImage,

        createdBy: userId,
      });

    return res.status(201).json({
      success: true,
      message: PROPERTY.CREATED,
      property,
    });
  } catch (error) {
    console.error(
      "Error creating property:",
      error
    );

    return next(error);
  }
};

/*
====================================================
GET PROPERTY BY ID
====================================================
*/

const getPropertyById = async (
  req,
  res,
  next
) => {
  try {
    /*
    ----------------------------------------------------
    VALIDATE ID
    ----------------------------------------------------
    */

    if (
      !mongoose.Types.ObjectId.isValid(
        req.params.id
      )
    ) {
      return res.status(400).json({
        success: false,
        error: "Invalid property ID.",
      });
    }

    /*
    ----------------------------------------------------
    FETCH PROPERTY
    ----------------------------------------------------
    */

    const property =
      await Property.findById(
        req.params.id
      )
        .populate("floors")
        .populate(
          "reviews.user",
          "name"
        );

    if (!property) {
      return res.status(404).json({
        success: false,
        error: PROPERTY.NOT_FOUND,
      });
    }

    return res.status(200).json({
      success: true,
      property,
    });
  } catch (error) {
    console.error(
      "Error fetching property:",
      error
    );

    return next(error);
  }
};

/*
====================================================
DELETE PROPERTY
====================================================

Only:
- property creator
- Admin

can delete the property.
====================================================
*/

const deleteProperty = async (
  req,
  res,
  next
) => {
  try {
    /*
    ----------------------------------------------------
    AUTHENTICATION
    ----------------------------------------------------
    */

    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Login required.",
      });
    }

    /*
    ----------------------------------------------------
    VALIDATE ID
    ----------------------------------------------------
    */

    if (
      !mongoose.Types.ObjectId.isValid(
        req.params.id
      )
    ) {
      return res.status(400).json({
        success: false,
        error: "Invalid property ID.",
      });
    }

    /*
    ----------------------------------------------------
    FIND PROPERTY
    ----------------------------------------------------
    */

    const property =
      await Property.findById(
        req.params.id
      );

    if (!property) {
      return res.status(404).json({
        success: false,
        error: PROPERTY.NOT_FOUND,
      });
    }

    /*
    ----------------------------------------------------
    AUTHORIZATION
    ----------------------------------------------------
    */

    const userId = getUserId(req);

    const isCreator =
      property.createdBy &&
      userId &&
      property.createdBy.toString() ===
        userId.toString();

    if (
      !isAdmin(req) &&
      !isCreator
    ) {
      return res.status(403).json({
        success: false,
        error: "Not authorized.",
      });
    }

    /*
    ----------------------------------------------------
    DELETE
    ----------------------------------------------------
    */

    await property.deleteOne();

    return res.status(200).json({
      success: true,
      message: PROPERTY.DELETED,
    });
  } catch (error) {
    console.error(
      "Error deleting property:",
      error
    );

    return next(error);
  }
};

/*
====================================================
ADD REVIEW
====================================================
*/

const addReview = async (
  req,
  res,
  next
) => {
  try {
    /*
    ----------------------------------------------------
    AUTHENTICATION
    ----------------------------------------------------
    */

    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Login required.",
      });
    }

    /*
    ----------------------------------------------------
    VALIDATE PROPERTY ID
    ----------------------------------------------------
    */

    if (
      !mongoose.Types.ObjectId.isValid(
        req.params.id
      )
    ) {
      return res.status(400).json({
        success: false,
        error: "Invalid property ID.",
      });
    }

    /*
    ----------------------------------------------------
    REQUEST DATA
    ----------------------------------------------------
    */

    const {
      rating,
      comment,
    } = req.body;

    const numericRating =
      Number(rating);

    if (
      !Number.isInteger(
        numericRating
      ) ||
      numericRating < 1 ||
      numericRating > 5
    ) {
      return res.status(400).json({
        success: false,
        error:
          "Rating must be an integer between 1 and 5.",
      });
    }

    if (
      comment !== undefined &&
      typeof comment !== "string"
    ) {
      return res.status(400).json({
        success: false,
        error:
          "Review comment must be text.",
      });
    }

    /*
    ----------------------------------------------------
    FIND PROPERTY
    ----------------------------------------------------
    */

    const property =
      await Property.findById(
        req.params.id
      );

    if (!property) {
      return res.status(404).json({
        success: false,
        error: PROPERTY.NOT_FOUND,
      });
    }

    /*
    ----------------------------------------------------
    CREATE REVIEW
    ----------------------------------------------------
    */

    const userId =
      getUserId(req);

    const newReview = {
      user: userId,
      userName: req.user.name,
      rating: numericRating,
      comment:
        typeof comment === "string"
          ? comment.trim()
          : "",
    };

    property.reviews.push(
      newReview
    );

    /*
    ----------------------------------------------------
    RECALCULATE AVERAGE
    ----------------------------------------------------
    */

    const totalRating =
      property.reviews.reduce(
        (total, review) =>
          total +
          Number(review.rating || 0),
        0
      );

    property.averageRating =
      property.reviews.length > 0
        ? totalRating /
          property.reviews.length
        : 0;

    await property.save();

    return res.status(201).json({
      success: true,
      message: "Review added.",
      property,
    });
  } catch (error) {
    console.error(
      "Error adding review:",
      error
    );

    return next(error);
  }
};

module.exports = {
  getProperties,
  createProperty,
  getPropertyById,
  deleteProperty,
  addReview,
};