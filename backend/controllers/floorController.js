const mongoose = require("mongoose");

const Floor = require("../models/Floor");
const Building = require("../models/Building");

/*
====================================================
CREATE FLOOR
====================================================

Creates a floor belonging to a Building.

Authentication:
- Required

Authorization:
- Building owner
- Admin

Supported upload:
- mapImage
====================================================
*/

const createFloor = async (req, res, next) => {
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
      buildingId,
      level,
      name,
    } = req.body;

    /*
    ----------------------------------------------------
    VALIDATE BUILDING ID
    ----------------------------------------------------
    */

    if (
      !buildingId ||
      !mongoose.Types.ObjectId.isValid(
        buildingId
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
      await Building.findById(buildingId);

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
    VALIDATE FLOOR LEVEL
    ----------------------------------------------------
    */

    const numericLevel =
      Number(level);

    if (
      !Number.isInteger(numericLevel) ||
      numericLevel < -100 ||
      numericLevel > 100
    ) {
      return res.status(400).json({
        success: false,
        error:
          "Floor level must be an integer between -100 and 100.",
      });
    }

    /*
    ----------------------------------------------------
    VALIDATE FLOOR NAME
    ----------------------------------------------------
    */

    const floorName =
      typeof name === "string"
        ? name.trim()
        : "";

    if (!floorName) {
      return res.status(400).json({
        success: false,
        error: "Floor name is required.",
      });
    }

    /*
    ----------------------------------------------------
    BLUEPRINT IMAGE
    ----------------------------------------------------
    */

    const blueprintUrl = req.file
      ? `/uploads/floors/${req.file.filename}`
      : "";

    /*
    ----------------------------------------------------
    CREATE FLOOR
    ----------------------------------------------------
    */

    const floor = await Floor.create({
      buildingId,
      level: numericLevel,
      name: floorName,
      blueprintUrl,
    });

    /*
    ----------------------------------------------------
    SUCCESS
    ----------------------------------------------------
    */

    return res.status(201).json({
      success: true,
      floor,
    });
  } catch (error) {
    console.error(
      "Error creating floor:",
      error
    );

    return next(error);
  }
};

module.exports = {
  createFloor,
};