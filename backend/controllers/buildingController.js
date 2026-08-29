const Building = require("../models/Building");

/*
====================================================
GET ALL BUILDINGS
====================================================
*/

exports.getBuildings = async (
  req,
  res
) => {
  try {
    const {
      search,
      category,
      isPublic,
    } = req.query;

    const query = {};

    /*
    Search by title OR name
    */

    if (search) {
      query.$or = [
        {
          title: {
            $regex: search,
            $options: "i",
          },
        },
        {
          name: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    if (category) {
      query.category =
        category;
    }

    if (
      isPublic !== undefined
    ) {
      query.isPublic =
        isPublic === "true";
    }

    const buildings =
      await Building.find(query)
        .populate(
          "creator",
          "name email avatar"
        )
        .sort({
          createdAt: -1,
        });

    res.status(200).json(
      buildings
    );

  } catch (error) {
    console.error(
      "Error fetching buildings:",
      error
    );

    res.status(500).json({
      message:
        "Error fetching buildings",

      error:
        error.message,
    });
  }
};

/*
====================================================
CREATE BUILDING
====================================================
*/

exports.createBuilding = async (
  req,
  res
) => {
  try {
    const {
      title,
      name,
      description,
      category,
      isPublic,
    } = req.body;

    /*
    Login required
    */

    if (!req.user) {
      return res.status(401).json({
        message:
          "Login required",
      });
    }

    const userId =
      req.user.id ||
      req.user._id;

    const building =
      new Building({
        title:
          title ||
          name ||
          "Untitled Map",

        name:
          name ||
          title ||
          "Untitled Map",

        description,

        category:
          category ||
          "Other",

        isPublic:
          isPublic !== undefined
            ? isPublic
            : true,

        creator:
          userId,

        status:
          "draft",

        updatedAt:
          new Date(),
      });

    await building.save();

    res.status(201).json(
      building
    );

  } catch (error) {
    console.error(
      "Error creating building:",
      error
    );

    res.status(400).json({
      message:
        "Error creating building",

      error:
        error.message,
    });
  }
};

/*
====================================================
DELETE BUILDING
====================================================
*/

exports.deleteBuilding = async (
  req,
  res
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message:
          "Login required",
      });
    }

    const building =
      await Building.findById(
        req.params.id
      );

    if (!building) {
      return res.status(404).json({
        message:
          "Building not found",
      });
    }

    /*
    Check owner only if creator exists.
    */

    if (
      building.creator &&
      building.creator.toString() !==
        req.user.id.toString()
    ) {
      return res.status(403).json({
        message:
          "Not authorized",
      });
    }

    await building.deleteOne();

    res.status(200).json({
      message:
        "Building deleted successfully",
    });

  } catch (error) {
    console.error(
      "Error deleting building:",
      error
    );

    res.status(500).json({
      message:
        "Error deleting building",

      error:
        error.message,
    });
  }
};