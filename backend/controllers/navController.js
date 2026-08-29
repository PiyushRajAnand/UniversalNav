const Node = require('../models/Node');
const Analytics = require('../models/Analytics');
const dijkstra = require('../utils/dijkstra');
const { NAV } = require('../constants/responseMessages');

const calculatePath = async (req, res, next) => {
  try {
    const { startNodeId, endNodeId, avoidStairs } = req.query;
    const shouldAvoidStairs = avoidStairs === 'true';

    const startNode = await Node.findById(startNodeId);
    if (!startNode) {
      res.status(404);
      throw new Error(NAV.START_NOT_FOUND);
    }

    const allFloorNodes = await Node.find({ floor: startNode.floor });
    const result = dijkstra(allFloorNodes, startNodeId, endNodeId, { avoidStairs: shouldAvoidStairs });

    if (!result.success) {
      res.status(400);
      throw new Error(result.message || NAV.NO_PATH);
    }

    const endNode = allFloorNodes.find((n) => n._id.toString() === endNodeId);
    if (endNode) {
      await Analytics.create({
        property: startNode.floor,
        startNodeLabel: startNode.label,
        endNodeLabel: endNode.label,
        avoidStairsUsed: shouldAvoidStairs
      });
    }

    res.json({
      success: true,
      message: NAV.PATH_FOUND,
      totalDistance: result.distance,
      path: result.path
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { calculatePath };
