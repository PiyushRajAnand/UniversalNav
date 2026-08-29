import React, { useRef, useEffect, useState } from 'react';

// Icon Map with Enterprise Emojis / SVG Labels
export const COMPONENT_ICONS = {
  Classroom: '🏫', Room: '🚪', Hall: '🏢', Auditorium: '🎭',
  Laboratory: '🧪', Office: '💼', Reception: '🛎️', Library: '📚',
  Cafeteria: '🍽️', Washroom: '🚻', Lift: '🛗', Stair: '🪜',
  EmergencyExit: '🚨', EntryGate: '🚪', Parking: '🅿️', Corridor: '🛣️',
  WalkingPath: '🚶', SecurityRoom: '🛡️', MedicalRoom: '🏥', WaitingArea: '🪑'
};

export default function BlueprintCanvas({
  elements = [],
  blueprintImageUrl = null,
  currentFloorLevel = 0,
  activeRoute = null,
  onSelectElement,
  selectedElementId
}) {
  const canvasRef = useRef(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const [bgImage, setBgImage] = useState(null);

  // Load Background Blueprint Image for Tracing
  useEffect(() => {
    if (blueprintImageUrl) {
      const img = new Image();
      img.src = blueprintImageUrl;
      img.onload = () => setBgImage(img);
    } else {
      setBgImage(null);
    }
  }, [blueprintImageUrl]);

  // Main Blueprint Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();

    // Apply Viewport Transforms (Pan & Zoom)
    ctx.translate(transform.x, transform.y);
    ctx.scale(transform.scale, transform.scale);

    // 1. Draw Architectural Grid
    drawBlueprintGrid(ctx, canvas.width, canvas.height);

    // 2. Render Blueprint Trace Image Background
    if (bgImage) {
      ctx.globalAlpha = 0.4; // Semi-transparent overlay
      ctx.drawImage(bgImage, 0, 0);
      ctx.globalAlpha = 1.0;
    }

    // 3. Render Floor Blueprint Elements (Rooms, Halls, Lifts)
    const currentFloorElements = elements.filter(el => el.floorLevel === currentFloorLevel);
    
    // Draw Corridors/Roads First (Underneath Rooms)
    currentFloorElements
      .filter(el => ['Corridor', 'WalkingPath'].includes(el.type))
      .forEach(corridor => drawCorridor(ctx, corridor, selectedElementId === corridor._id));

    // Draw Rooms/Structures
    currentFloorElements
      .filter(el => !['Corridor', 'WalkingPath'].includes(el.type))
      .forEach(element => drawElement(ctx, element, selectedElementId === element._id));

    // 4. Render Animated Navigation Path Route Overlay
    if (activeRoute && activeRoute.path) {
      drawNavigationRoute(ctx, activeRoute.path, currentFloorLevel);
    }

    ctx.restore();
  }, [transform, elements, currentFloorLevel, selectedElementId, activeRoute, bgImage]);

  // Render Grid
  const drawBlueprintGrid = (ctx, width, height) => {
    const size = 30;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    for (let x = -3000; x < 5000; x += size) {
      ctx.beginPath(); ctx.moveTo(x, -3000); ctx.lineTo(x, 5000); ctx.stroke();
    }
    for (let y = -3000; y < 5000; y += size) {
      ctx.beginPath(); ctx.moveTo(-3000, y); ctx.lineTo(5000, y); ctx.stroke();
    }
  };

  // Render Rooms / Halls
  const drawElement = (ctx, el, isSelected) => {
    const { x, y, width = 120, height = 90, color = '#1e293b', name, type, rotation = 0 } = el;

    ctx.save();
    ctx.translate(x + width / 2, y + height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-(x + width / 2), -(y + height / 2));

    // Fill Shape
    ctx.fillStyle = isSelected ? 'rgba(6, 182, 212, 0.25)' : (color || 'rgba(30, 41, 59, 0.8)');
    ctx.strokeStyle = isSelected ? '#06b6d4' : 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = isSelected ? 3 : 1.5;

    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 6);
    ctx.fill();
    ctx.stroke();

    // Render Icon and Label
    const icon = COMPONENT_ICONS[type] || '🚪';
    ctx.fillStyle = '#ffffff';
    ctx.font = '600 13px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${icon} ${name}`, x + width / 2, y + height / 2 + 4);

    ctx.restore();
  };

  // Render Indoor Road / Corridor Polyline
  const drawCorridor = (ctx, corridor, isSelected) => {
    const points = corridor.points || [];
    if (points.length < 2) return;

    ctx.beginPath();
    ctx.strokeStyle = isSelected ? '#38bdf8' : 'rgba(148, 163, 184, 0.4)';
    ctx.lineWidth = corridor.width || 24; // Realistic corridor width
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    points.forEach((pt, idx) => {
      if (idx === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    });
    ctx.stroke();

    // Inner dashed walking line
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    points.forEach((pt, idx) => {
      if (idx === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    });
    ctx.stroke();
    ctx.setLineDash([]);
  };

  // Draw Route Path
  const drawNavigationRoute = (ctx, pathNodes, currentFloor) => {
    const floorNodes = pathNodes.filter(n => n.floorLevel === currentFloor);
    if (floorNodes.length < 2) return;

    ctx.beginPath();
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 12;

    floorNodes.forEach((node, idx) => {
      if (idx === 0) ctx.moveTo(node.x, node.y);
      else ctx.lineTo(node.x, node.y);
    });
    ctx.stroke();
    ctx.shadowBlur = 0; // Reset Shadow
  };

  // Canvas Viewport Pan/Zoom Controls
  const handleMouseDown = (e) => {
    if (e.button === 0) {
      setIsPanning(true);
      setStartPan({ x: e.clientX - transform.x, y: e.clientY - transform.y });
    }
  };

  const handleMouseMove = (e) => {
    if (!isPanning) return;
    setTransform(prev => ({ ...prev, x: e.clientX - startPan.x, y: e.clientY - startPan.y }));
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const zoom = e.deltaY < 0 ? 1.1 : 0.9;
    setTransform(prev => ({
      ...prev,
      scale: Math.max(0.2, Math.min(prev.scale * zoom, 4))
    }));
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={() => setIsPanning(false)}
        onWheel={handleWheel}
        style={{ cursor: isPanning ? 'grabbing' : 'grab', display: 'block' }}
      />
    </div>
  );
}
