import React, { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import './BuildingBoundary.css';

/*
 * Additive floor-boundary editor.
 *
 * New boundary workflow:
 *   1. Add Boundary Node -> click each perimeter corner.
 *   2. Connect Boundary Nodes -> click node A, then node B.
 *   3. Connections are independent. Removing one connection does NOT remove
 *      the whole boundary.
 *
 * Backward compatible with old boundary data containing `points`.
 */
export default function BuildingBoundary({
  width,
  height,
  boundary,
  activeFloor,
  open,
  onClose,
  onChange,
  portalTargetId = 'universalnav-left-sidebar'
}) {
  const [mode, setMode] = useState('select');
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [selectedConnectionIndex, setSelectedConnectionIndex] = useState(null);

  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

  // Convert old point-only boundaries into node/connection data without
  // changing the saved meaning of existing maps.
  const normalized = useMemo(() => {
    if (!boundary) return { nodes: [], connections: [] };

    if (Array.isArray(boundary.nodes)) {
      return {
        nodes: boundary.nodes,
        connections: Array.isArray(boundary.connections)
          ? boundary.connections
          : []
      };
    }

    if (Array.isArray(boundary.points)) {
      const nodes = boundary.points.map((p, i) => ({
        id: `boundary-node-${i}`,
        x: Number(p.x) || 0,
        y: Number(p.y) || 0
      }));

      const connections = [];
      for (let i = 0; i < nodes.length - 1; i += 1) {
        connections.push([nodes[i].id, nodes[i + 1].id]);
      }
      if (nodes.length >= 3) {
        connections.push([nodes[nodes.length - 1].id, nodes[0].id]);
      }

      return { nodes, connections };
    }

    if (boundary.type === 'rectangle') {
      const points = [
        { x: boundary.x, y: boundary.y },
        { x: boundary.x + boundary.width, y: boundary.y },
        { x: boundary.x + boundary.width, y: boundary.y + boundary.height },
        { x: boundary.x, y: boundary.y + boundary.height }
      ];
      const nodes = points.map((p, i) => ({
        id: `boundary-node-${i}`,
        ...p
      }));
      return {
        nodes,
        connections: [
          [nodes[0].id, nodes[1].id],
          [nodes[1].id, nodes[2].id],
          [nodes[2].id, nodes[3].id],
          [nodes[3].id, nodes[0].id]
        ]
      };
    }

    return { nodes: [], connections: [] };
  }, [boundary]);

  const nodesById = useMemo(
    () => new Map(normalized.nodes.map((node) => [node.id, node])),
    [normalized.nodes]
  );

  // Keep legacy `points` as a convenience field for any old renderer/API.
  // The authoritative structure is now nodes + connections.
  const emit = (nodes, connections) => {
    const points = nodes.map(({ x, y }) => ({
      x: Math.round(x),
      y: Math.round(y)
    }));

    onChange({
      type: 'freeform',
      nodes: nodes.map((n) => ({
        id: n.id,
        x: Math.round(clamp(n.x, 0, width)),
        y: Math.round(clamp(n.y, 0, height))
      })),
      connections: connections.map(([a, b]) => [a, b]),
      points
    });
  };

  const addBoundaryNode = (event) => {
    if (mode !== 'add-node') return;

    event.preventDefault();
    event.stopPropagation();

    const svg = event.currentTarget;
    const rect = svg.getBoundingClientRect();
    const point = {
      x: clamp((event.clientX - rect.left) * (width / rect.width), 0, width),
      y: clamp((event.clientY - rect.top) * (height / rect.height), 0, height)
    };

    const node = {
      id: `boundary-node-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      x: Math.round(point.x),
      y: Math.round(point.y)
    };

    emit([...normalized.nodes, node], normalized.connections);
  };

  const handleNodeClick = (event, nodeId) => {
    event.preventDefault();
    event.stopPropagation();

    if (mode === 'connect') {
      if (!selectedNodeId) {
        setSelectedNodeId(nodeId);
        return;
      }

      if (selectedNodeId === nodeId) {
        setSelectedNodeId(null);
        return;
      }

      const exists = normalized.connections.some(
        ([a, b]) =>
          (a === selectedNodeId && b === nodeId) ||
          (a === nodeId && b === selectedNodeId)
      );

      if (!exists) {
        emit(normalized.nodes, [
          ...normalized.connections,
          [selectedNodeId, nodeId]
        ]);
      }

      setSelectedNodeId(null);
      return;
    }

    if (mode === 'edit') {
      setSelectedNodeId(nodeId);
    }
  };

  const moveNode = (event, nodeId) => {
    if (mode !== 'edit') return;

    event.preventDefault();
    event.stopPropagation();

    const svg = event.currentTarget.ownerSVGElement;
    if (!svg) return;

    const move = (moveEvent) => {
      const rect = svg.getBoundingClientRect();
      const point = {
        x: clamp((moveEvent.clientX - rect.left) * (width / rect.width), 0, width),
        y: clamp((moveEvent.clientY - rect.top) * (height / rect.height), 0, height)
      };

      const nodes = normalized.nodes.map((node) =>
        node.id === nodeId
          ? { ...node, x: point.x, y: point.y }
          : node
      );
      emit(nodes, normalized.connections);
    };

    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };

    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const removeSelectedConnection = () => {
    if (selectedConnectionIndex == null) return;

    const connections = normalized.connections.filter(
      (_, index) => index !== selectedConnectionIndex
    );

    emit(normalized.nodes, connections);
    setSelectedConnectionIndex(null);
  };

  const removeNode = () => {
    if (!selectedNodeId) return;

    const nodes = normalized.nodes.filter((n) => n.id !== selectedNodeId);
    const connections = normalized.connections.filter(
      ([a, b]) => a !== selectedNodeId && b !== selectedNodeId
    );

    emit(nodes, connections);
    setSelectedNodeId(null);
  };

  const removeBoundary = () => {
    onChange(null);
    setSelectedNodeId(null);
    setSelectedConnectionIndex(null);
    setMode('select');
  };

  const finishEditing = () => {
    setMode('select');
    setSelectedNodeId(null);
    setSelectedConnectionIndex(null);
  };

  useEffect(() => {
    if (!open) {
      setMode('select');
      setSelectedNodeId(null);
      setSelectedConnectionIndex(null);
    }
  }, [open]);

  const panel = (
    <div
      className="universalnav-boundary-panel universalnav-boundary-panel-sidebar"
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="universalnav-boundary-title">
        <span>🏢 Floor Boundary</span>
        <button type="button" onClick={onClose}>×</button>
      </div>

      <div className="universalnav-boundary-floor">
        Editing: <strong>{activeFloor}</strong>
      </div>

      <div className="universalnav-boundary-section-title">
        1. Add boundary nodes
      </div>

      <button
        type="button"
        className={`universalnav-boundary-draw-button ${mode === 'add-node' ? 'active' : ''}`}
        onClick={() => {
          setMode('add-node');
          setSelectedNodeId(null);
          setSelectedConnectionIndex(null);
        }}
      >
        📍 Add Boundary Node
      </button>

      <div className="universalnav-boundary-section-title">
        2. Connect boundary nodes
      </div>

      <button
        type="button"
        className={`universalnav-boundary-edit-button ${mode === 'connect' ? 'active' : ''}`}
        disabled={normalized.nodes.length < 2}
        onClick={() => {
          setMode('connect');
          setSelectedNodeId(null);
          setSelectedConnectionIndex(null);
        }}
      >
        🔗 Connect Boundary Nodes
      </button>

      <div className="universalnav-boundary-help">
        {mode === 'add-node' && (
          <>
            Click on the map to place boundary nodes. Place one node at
            every corner of your building.
          </>
        )}
        {mode === 'connect' && (
          <>
            Click <strong>one node</strong>, then click the <strong>next node</strong>.
            Repeat until your perimeter is complete. Each connection is
            independent.
          </>
        )}
        {mode === 'edit' && (
          <>
            Drag a blue node to reshape the boundary. Click a connection to
            select only that segment.
          </>
        )}
        {mode === 'select' && (
          <>Choose Add Node or Connect Nodes to build the floor perimeter.</>
        )}
      </div>

      <div className="universalnav-boundary-stats">
        <span>📍 Nodes: <strong>{normalized.nodes.length}</strong></span>
        <span>🔗 Lines: <strong>{normalized.connections.length}</strong></span>
      </div>

      <div className="universalnav-boundary-actions">
        <button
          type="button"
          className="finish"
          onClick={finishEditing}
        >
          ✓ Finish
        </button>
        <button
          type="button"
          className="reset"
          disabled={!boundary}
          onClick={removeBoundary}
        >
          🗑 Clear All
        </button>
      </div>

      <button
        type="button"
        className="universalnav-boundary-delete-connection"
        disabled={selectedConnectionIndex == null}
        onClick={removeSelectedConnection}
      >
        ⛓️ Remove Selected Connection
      </button>

      <button
        type="button"
        className="universalnav-boundary-delete-node"
        disabled={!selectedNodeId}
        onClick={removeNode}
      >
        ● Remove Selected Node
      </button>

      <div className="universalnav-boundary-tip">
        Removing a connection removes only that line. Other boundary nodes
        and connections remain untouched.
      </div>
    </div>
  );

  const portalTarget =
    typeof document !== 'undefined'
      ? document.getElementById(portalTargetId)
      : null;

  if (!open && !boundary) return null;

  return (
    <>
      <svg
        className={`universalnav-boundary-overlay ${open ? 'editing' : ''}`}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        onPointerDown={addBoundaryNode}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Connected boundary segments */}
        {normalized.connections.map(([a, b], index) => {
          const first = nodesById.get(a);
          const second = nodesById.get(b);
          if (!first || !second) return null;

          const selected = index === selectedConnectionIndex;

          return (
            <line
              key={`boundary-connection-${a}-${b}-${index}`}
              x1={first.x}
              y1={first.y}
              x2={second.x}
              y2={second.y}
              className={`universalnav-boundary-connection ${selected ? 'selected' : ''}`}
              onPointerDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
                if (mode === 'edit' || mode === 'select') {
                  setSelectedConnectionIndex(index);
                  setSelectedNodeId(null);
                }
              }}
            />
          );
        })}

        {/* Nodes */}
        {normalized.nodes.map((node, index) => (
          <g key={node.id}>
            <circle
              cx={node.x}
              cy={node.y}
              r={selectedNodeId === node.id ? 12 : 8}
              className={`universalnav-boundary-node ${
                selectedNodeId === node.id ? 'selected' : ''
              }`}
              onPointerDown={(event) => {
                if (mode === 'edit') {
                  moveNode(event, node.id);
                } else {
                  handleNodeClick(event, node.id);
                }
              }}
            />
            <text
              x={node.x + 11}
              y={node.y - 10}
              className="universalnav-boundary-node-label"
              pointerEvents="none"
            >
              {index + 1}
            </text>
          </g>
        ))}
      </svg>

      {open
        ? portalTarget
          ? createPortal(panel, portalTarget)
          : panel
        : null}
    </>
  );
}
