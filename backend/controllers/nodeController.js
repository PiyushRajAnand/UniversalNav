const Node = require('../models/Node');
const Floor = require('../models/Floor');

const createNode = async (req, res, next) => {
  try {
    const { floorId, label, xRatio, yRatio, type } = req.body;

    const floor = await Floor.findById(floorId);
    if (!floor) {
      res.status(404);
      throw new Error('Associated floor not found');
    }

    const node = await Node.create({
      floor: floorId,
      label,
      xRatio,
      yRatio,
      type
    });

    floor.nodes.push(node._id);
    await floor.save();

    res.status(201).json({ success: true, node });
  } catch (err) {
    next(err);
  }
};

const addEdge = async (req, res, next) => {
  try {
    const { sourceNodeId, targetNodeId, distance, isStaircase, isElevator } = req.body;

    const sourceNode = await Node.findById(sourceNodeId);
    const targetNode = await Node.findById(targetNodeId);

    if (!sourceNode || !targetNode) {
      res.status(404);
      throw new Error('Source or Target node not found');
    }

    sourceNode.edges.push({ targetNode: targetNodeId, distance, isStaircase, isElevator });
    targetNode.edges.push({ targetNode: sourceNodeId, distance, isStaircase, isElevator });

    await sourceNode.save();
    await targetNode.save();

    res.json({ success: true, message: 'Path edge connected successfully between nodes' });
  } catch (err) {
    next(err);
  }
};

module.exports = { createNode, addEdge };

 