import React, { useRef, useEffect, useState } from 'react';

export default function Playground({ buildingData, currentFloorIndex = 0 }) {
  const canvasRef = useRef(null);
  
  // Interactive Viewport State (Pan & Zoom)
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  
  // Active Navigation Route Overlay
  const [activeRoute, setActiveRoute] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);

  // Canvas Drawing & Rendering Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Resize Canvas to parent width/height
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;

    // Clear Background
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    
    // Apply Pan and Zoom Transforms
    ctx.translate(transform.x, transform.y);
    ctx.scale(transform.scale, transform.scale);

    // 1. Draw Grid Pattern
    drawGrid(ctx, canvas.width, canvas.height);

    // 2. Render Floor Rooms/Blocks
    const floorRooms = buildingData?.rooms?.filter(r => r.floorLevel === currentFloorIndex) || [];
    floorRooms.forEach(room => drawRoom(ctx, room, selectedRoom?._id === room._id));

    // 3. Render Active Multi-Floor Navigation Route Overlay
    if (activeRoute && activeRoute.path) {
      drawRouteOverlay(ctx, activeRoute.path, currentFloorIndex);
    }

    ctx.restore();
  }, [transform, buildingData, currentFloorIndex, selectedRoom, activeRoute]);

  // Utility: Grid Renderer
  const drawGrid = (ctx, width, height) => {
    const gridSize = 40;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;

    for (let x = -2000; x < 4000; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, -2000);
      ctx.lineTo(x, 4000);
      ctx.stroke();
    }
    for (let y = -2000; y < 4000; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(-2000, y);
      ctx.lineTo(4000, y);
      ctx.stroke();
    }
  };

  // Utility: Room Shape Renderer
  const drawRoom = (ctx, room, isSelected) => {
    const { x, y, width, height, shapeType } = room.geometry;

    ctx.fillStyle = room.color || 'rgba(59, 130, 246, 0.3)';
    ctx.strokeStyle = isSelected ? '#06b6d4' : 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = isSelected ? 3 : 1;

    ctx.beginPath();
    if (shapeType === 'Circle') {
      ctx.arc(x, y, room.geometry.radius || 30, 0, 2 * Math.PI);
    } else {
      ctx.roundRect(x, y, width || 100, height || 80, 8);
    }
    ctx.fill();
    ctx.stroke();

    // Draw Room Label Text
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(room.name, x + (width ? width / 2 : 0), y + (height ? height / 2 : 0));
  };

  // Utility: Render Shortest Route Path Overlay
  const drawRouteOverlay = (ctx, pathRooms, currentFloor) => {
    const pointsOnThisFloor = pathRooms.filter(r => r.floorLevel === currentFloor);
    if (pointsOnThisFloor.length < 2) return;

    ctx.beginPath();
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 4;
    ctx.setLineDash([8, 8]); // Dashed line effect

    pointsOnThisFloor.forEach((room, index) => {
      const rx = room.geometry.x + (room.geometry.width / 2 || 0);
      const ry = room.geometry.y + (room.geometry.height / 2 || 0);
      if (index === 0) ctx.moveTo(rx, ry);
      else ctx.lineTo(rx, ry);
    });

    ctx.stroke();
    ctx.setLineDash([]); // Reset line dash
  };

  // Mouse Handlers for Pan Control
  const handleMouseDown = (e) => {
    if (e.button === 0) { // Left click pan
      setIsPanning(true);
      setStartPan({ x: e.clientX - transform.x, y: e.clientY - transform.y });
    }
  };

  const handleMouseMove = (e) => {
    if (!isPanning) return;
    setTransform(prev => ({
      ...prev,
      x: e.clientX - startPan.x,
      y: e.clientY - startPan.y
    }));
  };

  const handleMouseUp = () => setIsPanning(false);

  // Wheel Handler for Zoom Control
  const handleWheel = (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    setTransform(prev => ({
      ...prev,
      scale: Math.max(0.2, Math.min(prev.scale * zoomFactor, 5))
    }));
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: 'calc(100vh - 120px)', overflow: 'hidden' }}>
      {/* Floating Floor Navigation Selector Bar */}
      <div className="glass-panel" style={{
        position: 'absolute', top: '16px', left: '50%', transform: 'translateX(-50%)',
        display: 'flex', gap: '8px', padding: '8px 16px', zIndex: 10
      }}>
        {Array.from({ length: buildingData?.totalFloors || 1 }).map((_, idx) => (
          <button
            key={idx}
            className="btn-primary"
            style={{
              background: currentFloorIndex === idx ? undefined : 'transparent',
              border: currentFloorIndex === idx ? undefined : '1px solid var(--border-glass)',
              padding: '6px 12px', fontSize: '13px'
            }}
          >
            {idx === 0 ? 'Ground Floor' : `Floor ${idx}`}
          </button>
        ))}
      </div>

      {/* Main Interactive Canvas Area */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        style={{ cursor: isPanning ? 'grabbing' : 'grab', display: 'block' }}
      />
    </div>
  );
}
