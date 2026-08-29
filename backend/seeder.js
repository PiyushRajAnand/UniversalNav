const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Property = require('./models/Property');
const Floor = require('./models/Floor');
const Node = require('./models/Node');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const importData = async () => {
  try {
    await User.deleteMany();
    await Property.deleteMany();
    await Floor.deleteMany();
    await Node.deleteMany();

    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'password123',
      role: 'ADMIN'
    });

    const property = await Property.create({
      name: 'Central Tech Hub',
      description: 'Multi-story office and retail space',
      category: 'OFFICE',
      address: '123 Innovation Way',
      createdBy: admin._id
    });

    const floor = await Floor.create({
      property: property._id,
      floorLevel: 1,
      floorName: 'Ground Floor',
      mapImage: '/uploads/floors/sample_floor.png'
    });

    property.floors.push(floor._id);
    await property.save();

    const nodeA = await Node.create({
      floor: floor._id,
      label: 'Main Entrance',
      xRatio: 0.1,
      yRatio: 0.5,
      type: 'ENTRANCE'
    });

    const nodeB = await Node.create({
      floor: floor._id,
      label: 'Reception Desk',
      xRatio: 0.4,
      yRatio: 0.5,
      type: 'ROOM'
    });

    nodeA.edges.push({ targetNode: nodeB._id, distance: 15 });
    nodeB.edges.push({ targetNode: nodeA._id, distance: 15 });

    await nodeA.save();
    await nodeB.save();

    floor.nodes.push(nodeA._id, nodeB._id);
    await floor.save();

    console.log('✅ Backend Database Seeded Successfully!');
    process.exit();
  } catch (error) {
    console.error(`❌ Error with data import: ${error.message}`);
    process.exit(1);
  }
};

importData();
