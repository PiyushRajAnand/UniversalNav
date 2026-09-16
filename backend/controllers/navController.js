const mongoose = require("mongoose");

const Node = require("../models/Node");

const dijkstra = require("../utils/dijkstra");

const {
  NAV,
} = require("../constants/responseMessages");

/*
====================================================
CALCULATE NAVIGATION PATH
====================================================

Finds the shortest path between two navigation nodes.

Navigation is intentionally public because
PublicNavigation must work without requiring login.

Supported query parameters:
- startNodeId
- endNodeId
- avoidStairs

====================================================
*/

const calculatePath = async (
  req,
  res,
  next
) => {
  try {
    const {
      startNodeId,
      endNodeId,
      avoidStairs,
    } = req.query;

    /*
    ----------------------------------------------------
    VALIDATE START NODE ID
    ----------------------------------------------------
    */

    if (
      !startNodeId ||
      !mongoose.Types.ObjectId.isValid(
        startNodeId
      )
    ) {
      return res.status(400).json({
        success: false,
        error:
          "Invalid start node ID.",
      });
    }

    /*
    ----------------------------------------------------
    VALIDATE END NODE ID
    ----------------------------------------------------
    */

    if (
      !endNodeId ||
      !mongoose.Types.ObjectId.isValid(
        endNodeId
      )
    ) {
      return res.status(400).json({
        success: false,
        error:
          "Invalid end node ID.",
      });
    }

    /*
    ----------------------------------------------------
    PARSE ACCESSIBILITY OPTION
    ----------------------------------------------------
    */

    const shouldAvoidStairs =
      avoidStairs === "true";

    /*
    ----------------------------------------------------
    FIND START + END NODES
    ----------------------------------------------------
    */

    const [
      startNode,
      endNode,
    ] = await Promise.all([
      Node.findById(startNodeId),
      Node.findById(endNodeId),
    ]);

    if (!startNode) {
      return res.status(404).json({
        success: false,
        error: NAV.START_NOT_FOUND,
      });
    }

    if (!endNode) {
      return res.status(404).json({
        success: false,
        error:
          "Destination node not found.",
      });
    }

    /*
    ----------------------------------------------------
    SAME NODE
    ----------------------------------------------------
    */

    if (
      startNode._id.toString() ===
      endNode._id.toString()
    ) {
      return res.status(200).json({
        success: true,
        message: NAV.PATH_FOUND,
        totalDistance: 0,
        path: [startNode],
      });
    }

    /*
    ----------------------------------------------------
    LOAD NAVIGATION GRAPH
    ----------------------------------------------------

    IMPORTANT:

    The old implementation loaded only:

        Node.find({ floor: startNode.floor })

    which makes multi-floor navigation impossible.

    We first determine whether both nodes belong to
    the same floor.

    Same-floor navigation can safely use the
    corresponding floor graph.

    Cross-floor navigation will be handled through
    the broader graph below.
    */

    let graphNodes;

    if (
      startNode.floor.toString() ===
      endNode.floor.toString()
    ) {
      /*
      Same-floor route
      */

      graphNodes =
        await Node.find({
          floor: startNode.floor,
        });
    } else {
      /*
      ------------------------------------------------
      CROSS-FLOOR ROUTE
      ------------------------------------------------

      Load the navigation nodes needed to traverse
      between floors.

      Because Node stores its floor but does not
      directly store the Building ID, we first obtain
      the floors from the start/end nodes and then
      query nodes belonging to those floors.

      Cross-floor connection support ultimately
      depends on the graph represented by the node
      edges / Connection architecture.
      */

      const floorIds = [
        startNode.floor,
        endNode.floor,
      ];

      graphNodes =
        await Node.find({
          floor: {
            $in: floorIds,
          },
        });
    }

    /*
    ----------------------------------------------------
    ENSURE BOTH NODES ARE PRESENT
    ----------------------------------------------------
    */

    const hasStart =
      graphNodes.some(
        (node) =>
          node._id.toString() ===
          startNodeId.toString()
      );

    const hasEnd =
      graphNodes.some(
        (node) =>
          node._id.toString() ===
          endNodeId.toString()
      );

    if (!hasStart || !hasEnd) {
      return res.status(400).json({
        success: false,
        error: NAV.NO_PATH,
      });
    }

    /*
    ----------------------------------------------------
    DIJKSTRA
    ----------------------------------------------------
    */

    const result = dijkstra(
      graphNodes,
      startNodeId,
      endNodeId,
      {
        avoidStairs:
          shouldAvoidStairs,
      }
    );

    /*
    ----------------------------------------------------
    NO PATH
    ----------------------------------------------------
    */

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error:
          result.message ||
          NAV.NO_PATH,
      });
    }

    /*
    ----------------------------------------------------
    SUCCESS
    ----------------------------------------------------
    */

    return res.status(200).json({
      success: true,
      message: NAV.PATH_FOUND,
      totalDistance:
        result.distance,
      path: result.path,
    });
  } catch (error) {
    console.error(
      "Error calculating navigation path:",
      error
    );

    return next(error);
  }
};

module.exports = {
  calculatePath,
};