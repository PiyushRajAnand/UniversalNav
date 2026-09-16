const mongoose = require("mongoose");

const Node = require("../models/Node");
const Floor = require("../models/Floor");
const Building = require("../models/Building");

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

const userOwnsBuilding = (building, req) => {
  const userId = getUserId(req);

  if (!userId || !building?.owner) {
    return false;
  }

  return (
    building.owner.toString() ===
    userId.toString()
  );
};

/*
====================================================
CREATE NODE
====================================================

Creates a navigation node on a floor.

Authentication:
- Required

Authorization:
- Building owner
- Admin
====================================================
*/

const createNode = async (
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
    REQUEST DATA
    ----------------------------------------------------
    */

    const {
      floorId,
      label,
      xRatio,
      yRatio,
      type,
    } = req.body;

    /*
    ----------------------------------------------------
    VALIDATE FLOOR ID
    ----------------------------------------------------
    */

    if (
      !floorId ||
      !mongoose.Types.ObjectId.isValid(
        floorId
      )
    ) {
      return res.status(400).json({
        success: false,
        error: "Invalid floor ID.",
      });
    }

    /*
    ----------------------------------------------------
    FIND FLOOR
    ----------------------------------------------------
    */

    const floor =
      await Floor.findById(floorId);

    if (!floor) {
      return res.status(404).json({
        success: false,
        error: "Associated floor not found.",
      });
    }

    /*
    ----------------------------------------------------
    FIND ASSOCIATED BUILDING
    ----------------------------------------------------
    */

    const building =
      await Building.findById(
        floor.buildingId
      );

    if (!building) {
      return res.status(404).json({
        success: false,
        error: "Associated building not found.",
      });
    }

    /*
    ----------------------------------------------------
    AUTHORIZATION
    ----------------------------------------------------
    */

    if (
      !isAdmin(req) &&
      !userOwnsBuilding(building, req)
    ) {
      return res.status(403).json({
        success: false,
        error: "Not authorized.",
      });
    }

    /*
    ----------------------------------------------------
    VALIDATE LABEL
    ----------------------------------------------------
    */

    const nodeLabel =
      typeof label === "string"
        ? label.trim()
        : "";

    if (!nodeLabel) {
      return res.status(400).json({
        success: false,
        error: "Node label is required.",
      });
    }

    if (nodeLabel.length > 200) {
      return res.status(400).json({
        success: false,
        error:
          "Node label must not exceed 200 characters.",
      });
    }

    /*
    ----------------------------------------------------
    VALIDATE COORDINATES
    ----------------------------------------------------
    */

    const normalizedX =
      Number(xRatio);

    const normalizedY =
      Number(yRatio);

    if (
      !Number.isFinite(normalizedX) ||
      normalizedX < 0 ||
      normalizedX > 1
    ) {
      return res.status(400).json({
        success: false,
        error:
          "xRatio must be a number between 0 and 1.",
      });
    }

    if (
      !Number.isFinite(normalizedY) ||
      normalizedY < 0 ||
      normalizedY > 1
    ) {
      return res.status(400).json({
        success: false,
        error:
          "yRatio must be a number between 0 and 1.",
      });
    }

    /*
    ----------------------------------------------------
    VALIDATE NODE TYPE
    ----------------------------------------------------
    */

    const allowedTypes = [
      "ROOM",
      "CORRIDOR",
      "ENTRANCE",
      "STAIRS",
      "ELEVATOR",
      "RESTROOM",
    ];

    const nodeType =
      type || "ROOM";

    if (
      !allowedTypes.includes(nodeType)
    ) {
      return res.status(400).json({
        success: false,
        error: "Invalid node type.",
      });
    }

    /*
    ----------------------------------------------------
    CREATE NODE
    ----------------------------------------------------
    */

    const node = await Node.create({
      floor: floorId,
      label: nodeLabel,
      xRatio: normalizedX,
      yRatio: normalizedY,
      type: nodeType,
    });

    /*
    IMPORTANT:
    We intentionally DO NOT do:

        floor.nodes.push(node._id)

    because the current Floor schema does not
    contain a nodes array.

    Nodes already reference their floor through:

        Node.floor
    */

    return res.status(201).json({
      success: true,
      node,
    });
  } catch (error) {
    console.error(
      "Error creating node:",
      error
    );

    return next(error);
  }
};

/*
====================================================
ADD EDGE
====================================================

Creates a bidirectional connection between
two nodes on the same floor.

Stair/elevator metadata is preserved.
====================================================
*/

const addEdge = async (
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

    const {
      sourceNodeId,
      targetNodeId,
      distance,
      isStaircase,
      isElevator,
    } = req.body;

    /*
    ----------------------------------------------------
    VALIDATE NODE IDS
    ----------------------------------------------------
    */

    if (
      !sourceNodeId ||
      !mongoose.Types.ObjectId.isValid(
        sourceNodeId
      )
    ) {
      return res.status(400).json({
        success: false,
        error: "Invalid source node ID.",
      });
    }

    if (
      !targetNodeId ||
      !mongoose.Types.ObjectId.isValid(
        targetNodeId
      )
    ) {
      return res.status(400).json({
        success: false,
        error: "Invalid target node ID.",
      });
    }

    /*
    ----------------------------------------------------
    PREVENT SELF EDGE
    ----------------------------------------------------
    */

    if (
      sourceNodeId.toString() ===
      targetNodeId.toString()
    ) {
      return res.status(400).json({
        success: false,
        error:
          "A node cannot be connected to itself.",
      });
    }

    /*
    ----------------------------------------------------
    FIND NODES
    ----------------------------------------------------
    */

    const [
      sourceNode,
      targetNode,
    ] = await Promise.all([
      Node.findById(sourceNodeId),
      Node.findById(targetNodeId),
    ]);

    if (!sourceNode || !targetNode) {
      return res.status(404).json({
        success: false,
        error:
          "Source or target node not found.",
      });
    }

    /*
    ----------------------------------------------------
    SAME FLOOR CHECK
    ----------------------------------------------------

    Normal node edges are intra-floor edges.

    Cross-floor routing should use the dedicated
    connection/navigation architecture.
    */

    if (
      sourceNode.floor.toString() !==
      targetNode.floor.toString()
    ) {
      return res.status(400).json({
        success: false,
        error:
          "Nodes on different floors cannot be connected with a normal node edge.",
      });
    }

    /*
    ----------------------------------------------------
    FIND FLOOR
    ----------------------------------------------------
    */

    const floor =
      await Floor.findById(
        sourceNode.floor
      );

    if (!floor) {
      return res.status(404).json({
        success: false,
        error: "Associated floor not found.",
      });
    }

    /*
    ----------------------------------------------------
    FIND BUILDING
    ----------------------------------------------------
    */

    const building =
      await Building.findById(
        floor.buildingId
      );

    if (!building) {
      return res.status(404).json({
        success: false,
        error:
          "Associated building not found.",
      });
    }

    /*
    ----------------------------------------------------
    AUTHORIZATION
    ----------------------------------------------------
    */

    if (
      !isAdmin(req) &&
      !userOwnsBuilding(building, req)
    ) {
      return res.status(403).json({
        success: false,
        error: "Not authorized.",
      });
    }

    /*
    ----------------------------------------------------
    VALIDATE DISTANCE
    ----------------------------------------------------
    */

    const edgeDistance =
      Number(distance);

    if (
      !Number.isFinite(edgeDistance) ||
      edgeDistance <= 0
    ) {
      return res.status(400).json({
        success: false,
        error:
          "Distance must be greater than 0.",
      });
    }

    /*
    ----------------------------------------------------
    EDGE FLAGS
    ----------------------------------------------------
    */

    const staircase =
      Boolean(isStaircase);

    const elevator =
      Boolean(isElevator);

    /*
    ----------------------------------------------------
    DUPLICATE CHECK
    ----------------------------------------------------
    */

    const sourceAlreadyConnected =
      sourceNode.edges.some(
        (edge) =>
          edge.targetNode &&
          edge.targetNode.toString() ===
            targetNodeId.toString()
      );

    const targetAlreadyConnected =
      targetNode.edges.some(
        (edge) =>
          edge.targetNode &&
          edge.targetNode.toString() ===
            sourceNodeId.toString()
      );

    if (
      sourceAlreadyConnected ||
      targetAlreadyConnected
    ) {
      return res.status(409).json({
        success: false,
        error:
          "An edge already exists between these nodes.",
      });
    }

    /*
    ----------------------------------------------------
    ADD BIDIRECTIONAL EDGE
    ----------------------------------------------------
    */

    sourceNode.edges.push({
      targetNode: targetNodeId,
      distance: edgeDistance,
      isStaircase: staircase,
      isElevator: elevator,
    });

    targetNode.edges.push({
      targetNode: sourceNodeId,
      distance: edgeDistance,
      isStaircase: staircase,
      isElevator: elevator,
    });

    /*
    ----------------------------------------------------
    SAVE BOTH NODES
    ----------------------------------------------------
    */

    await Promise.all([
      sourceNode.save(),
      targetNode.save(),
    ]);

    /*
    ----------------------------------------------------
    SUCCESS
    ----------------------------------------------------
    */

    return res.status(200).json({
      success: true,
      message:
        "Path edge connected successfully between nodes.",
    });
  } catch (error) {
    console.error(
      "Error connecting nodes:",
      error
    );

    return next(error);
  }
};

module.exports = {
  createNode,
  addEdge,
};