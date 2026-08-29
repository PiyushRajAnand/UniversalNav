import React, { useState, useEffect, useRef } from 'react';

const FALLBACK_MAP = {
  floorName: 'UniversalNav Main Campus - Floor 1',
  nodes: [
    { id: '1', label: 'Main Entrance', x: 80, y: 320 },
    { id: '2', label: 'Central Lobby', x: 220, y: 320 },
    { id: '3', label: 'Elevator Bank', x: 220, y: 150 },
    { id: '4', label: 'Restrooms', x: 380, y: 150 },
    { id: '5', label: 'Cafeteria', x: 380, y: 320 },
    { id: '6', label: 'Auditorium', x: 550, y: 320 },
    { id: '7', label: 'Emergency Exit', x: 680, y: 320 }
  ],
  edges: [
    { from: '1', to: '2', distance: 10 },
    { from: '2', to: '3', distance: 12 },
    { from: '3', to: '4', distance: 15 },
    { from: '2', to: '5', distance: 12 },
    { from: '4', to: '5', distance: 10 },
    { from: '5', to: '6', distance: 15 },
    { from: '6', to: '7', distance: 10 }
  ]
};

const findShortestPath = (nodes, edges, startId, endId) => {
  const distances = {};
  const previous = {};
  const unvisited = new Set(nodes.map(n => n.id));

  nodes.forEach(node => {
    distances[node.id] = Infinity;
    previous[node.id] = null;
  });
  distances[startId] = 0;

  while (unvisited.size > 0) {
    let current = null;
    let shortestDist = Infinity;

    unvisited.forEach(nodeId => {
      if (distances[nodeId] < shortestDist) {
        shortestDist = distances[nodeId];
        current = nodeId;
      }
    });

    if (current === null || current === endId) break;
    unvisited.delete(current);

    const neighbors = edges.filter(e => e.from === current || e.to === current);
    neighbors.forEach(edge => {
      const neighborId = edge.from === current ? edge.to : edge.from;
      if (unvisited.has(neighborId)) {
        const alt = distances[current] + edge.distance;
        if (alt < distances[neighborId]) {
          distances[neighborId] = alt;
          previous[neighborId] = current;
        }
      }
    });
  }

  const path = [];
  let curr = endId;
  while (curr) {
    path.unshift(curr);
    curr = previous[curr];
  }
  return path[0] === startId ? path : [];
};

const Explore = () => {
  const [mapData, setMapData] = useState(FALLBACK_MAP);
  const [startNode, setStartNode] = useState('1');
  const [endNode, setEndNode] = useState('6');
  const [path, setPath] = useState([]);
  const canvasRef = useRef(null);

  useEffect(() => {
    fetch('http://localhost:5000/api/map/floorplan')
      .then((res) => {
        if (!res.ok) throw new Error('Backend route not ready');
        return res.json();
      })
      .then((data) => {
        if (data && data.nodes) {
          setMapData(data);
          setStartNode(data.nodes[0]?.id || '1');
          setEndNode(data.nodes[data.nodes.length - 2]?.id || '6');
        }
      })
      .catch(() => {
        // Fallback silently loaded
      });
  }, []);

  const handleNavigate = () => {
    if (startNode === endNode) {
      alert('Start and Destination points must be different!');
      return;
    }
    const calculatedPath = findShortestPath(mapData.nodes, mapData.edges, startNode, endNode);
    setPath(calculatedPath);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Grid
    ctx.strokeStyle = '#e9ecef';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }

    // Draw Edges
    mapData.edges.forEach(edge => {
      const fromNode = mapData.nodes.find(n => n.id === edge.from);
      const toNode = mapData.nodes.find(n => n.id === edge.to);
      if (fromNode && toNode) {
        ctx.beginPath();
        ctx.moveTo(fromNode.x, fromNode.y);
        ctx.lineTo(toNode.x, toNode.y);
        ctx.strokeStyle = '#ced4da';
        ctx.lineWidth = 4;
        ctx.stroke();
      }
    });

    // Draw Path
    if (path.length > 1) {
      ctx.beginPath();
      for (let i = 0; i < path.length - 1; i++) {
        const fromNode = mapData.nodes.find(n => n.id === path[i]);
        const toNode = mapData.nodes.find(n => n.id === path[i + 1]);
        if (fromNode && toNode) {
          ctx.moveTo(fromNode.x, fromNode.y);
          ctx.lineTo(toNode.x, toNode.y);
        }
      }
      ctx.strokeStyle = '#0d6efd';
      ctx.lineWidth = 6;
      ctx.stroke();
    }

    // Draw Nodes
    mapData.nodes.forEach(node => {
      const isStart = node.id === startNode;
      const isEnd = node.id === endNode;
      const isInPath = path.includes(node.id);

      ctx.beginPath();
      ctx.arc(node.x, node.y, 12, 0, 2 * Math.PI);
      ctx.fillStyle = isStart ? '#198754' : isEnd ? '#dc3545' : isInPath ? '#0d6efd' : '#6c757d';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      ctx.fillStyle = '#212529';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText(node.label, node.x - 20, node.y - 18);
    });
  }, [mapData, path, startNode, endNode]);

  return (
    <div className="container mt-4">
      <div className="card shadow-sm p-4 mb-4">
        <h3 className="text-primary mb-3">🧭 Dynamic Pathfinding Engine</h3>
        <p className="text-muted">{mapData.floorName}</p>

        <div className="row g-3 mb-3">
          <div className="col-md-5">
            <label className="form-label fw-bold">Starting Point:</label>
            <select className="form-select" value={startNode} onChange={e => setStartNode(e.target.value)}>
              {mapData.nodes.map(node => (
                <option key={node.id} value={node.id}>{node.label}</option>
              ))}
            </select>
          </div>
          <div className="col-md-5">
            <label className="form-label fw-bold">Destination:</label>
            <select className="form-select" value={endNode} onChange={e => setEndNode(e.target.value)}>
              {mapData.nodes.map(node => (
                <option key={node.id} value={node.id}>{node.label}</option>
              ))}
            </select>
          </div>
          <div className="col-md-2 d-flex align-items-end">
            <button className="btn btn-primary w-100 fw-bold" onClick={handleNavigate}>
              Find Path
            </button>
          </div>
        </div>
      </div>

      <div className="card shadow-sm p-3 text-center bg-light">
        <canvas
          ref={canvasRef}
          width={760}
          height={450}
          className="border rounded bg-white shadow-sm mx-auto"
          style={{ maxWidth: '100%' }}
        />
      </div>
    </div>
  );
};

export default Explore;
