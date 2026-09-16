const mongoose = require("mongoose");
const Building = require("../models/Building");

/*
====================================================
GET ALL BUILDINGS
====================================================

Public read operation.

Supports:
- search
- category
- isPublic

Authentication is not required.
====================================================
*/

exports.getBuildings = async (req, res, next) => {
  try {
    const {
      search,
      category,
      isPublic,
    } = req.query;

    const query = {};

    /*
    ----------------------------------------------------
    SEARCH
    ----------------------------------------------------
    Search by title OR name.
    */

    if (search && search.trim()) {
      const safeSearch = search.trim();

      query.$or = [
        {
          title: {
            $regex: safeSearch,
            $options: "i",
          },
        },
        {
          name: {
            $regex: safeSearch,
            $options: "i",
          },
        },
      ];
    }

    /*
    ----------------------------------------------------
    CATEGORY
    ----------------------------------------------------
    */

    if (category && category.trim()) {
      query.category = category.trim();
    }

    /*
    ----------------------------------------------------
    PUBLIC FILTER
    ----------------------------------------------------
    */

    if (isPublic !== undefined) {
      if (
        isPublic !== "true" &&
        isPublic !== "false"
      ) {
        return res.status(400).json({
          success: false,
          error: "Invalid isPublic value.",
        });
      }

      query.isPublic = isPublic === "true";
    }

    /*
    ----------------------------------------------------
    FETCH
    ----------------------------------------------------
    */

    const buildings = await Building.find(query)
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      buildings,
    });
  } catch (error) {
    console.error(
      "Error fetching buildings:",
      error
    );

    return next(error);
  }
};

/*
====================================================
CREATE BUILDING
====================================================

Login required.

The authenticated user becomes the owner.

IMPORTANT:
The client cannot choose the owner.
====================================================
*/

exports.createBuilding = async (
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

    const userId =
      req.user._id || req.user.id;

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
      title,
      name,
      description,
      category,
      isPublic,
    } = req.body;

    /*
    ----------------------------------------------------
    CREATE BUILDING
    ----------------------------------------------------

    OWNER ALWAYS COMES FROM req.user.

    Never trust an owner/user ID supplied by
    the frontend.
    */

    const building = new Building({
      title:
        title?.trim() ||
        name?.trim() ||
        "Untitled Building",

      name:
        name?.trim() ||
        title?.trim() ||
        "Untitled Building",

      description:
        typeof description === "string"
          ? description.trim()
          : "",

      category:
        typeof category === "string" &&
        category.trim()
          ? category.trim()
          : "Other",

      isPublic:
        typeof isPublic === "boolean"
          ? isPublic
          : true,

      owner: userId,

      status: "draft",
    });

    await building.save();

    /*
    ----------------------------------------------------
    SUCCESS
    ----------------------------------------------------
    */

    return res.status(201).json({
      success: true,
      building,
    });
  } catch (error) {
    console.error(
      "Error creating building:",
      error
    );

    return next(error);
  }
};

/*
====================================================
DELETE BUILDING
====================================================

Only the building owner or an Admin may delete it.

Authentication and authorization are enforced
server-side.
====================================================
*/

exports.deleteBuilding = async (
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

    const userId =
      req.user._id || req.user.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Login required.",
      });
    }

    /*
    ----------------------------------------------------
    VALIDATE BUILDING ID
    ----------------------------------------------------
    */

    if (
      !mongoose.Types.ObjectId.isValid(
        req.params.id
      )
    ) {
      return res.status(400).json({
        success: false,
        error: "Invalid building ID.",
      });
    }

    /*
    ----------------------------------------------------
    FIND BUILDING
    ----------------------------------------------------
    */

    const building =
      await Building.findById(
        req.params.id
      );

    if (!building) {
      return res.status(404).json({
        success: false,
        error: "Building not found.",
      });
    }

    /*
    ----------------------------------------------------
    AUTHORIZATION
    ----------------------------------------------------

    Admin:
        allowed

    Owner:
        allowed

    Everyone else:
        forbidden
    */

    const isAdmin =
      req.user.role === "Admin";

    const isOwner =
      building.owner &&
      building.owner.toString() ===
        userId.toString();

    if (!isAdmin && !isOwner) {
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

    await building.deleteOne();

    return res.status(200).json({
      success: true,
      message:
        "Building deleted successfully.",
    });
  } catch (error) {
    console.error(
      "Error deleting building:",
      error
    );

    return next(error);
  }
};