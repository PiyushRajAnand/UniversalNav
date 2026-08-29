import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Map, Navigation2, ShieldCheck, Cpu, Database, Compass, X } from 'lucide-react';

export default function Capabilities() {
  const [selectedFeature, setSelectedFeature] = useState(null);

  const features = [
    {
      id: 1,
      icon: <Map className="text-info" size={32} />,
      title: 'Spatial Canvas Builder',
      desc: 'Design indoor visual nodes, corridors, and floor structures dynamically.',
      details: 'Click on the canvas in the Playground to add waypoints, drag nodes to position them, and connect them with weighted edges representing physical distances.'
    },
    {
      id: 2,
      icon: <Navigation2 className="text-warning" size={32} />,
      title: 'Dijkstra Path Optimization',
      desc: 'Real-time calculation of the shortest indoor transit path between waypoint nodes.',
      details: 'Select a Start Node and End Node to compute the shortest route dynamically. The path highlights visually on top of the layout.'
    },
    {
      id: 3,
      icon: <Cpu className="text-purple" size={32} />,
      title: 'State History Stack',
      desc: 'Full undo and redo state history management built directly into the map editor.',
      details: 'Never lose progress with the custom undo/redo hook, letting you revert canvas changes instantly.'
    },
    {
      id: 4,
      icon: <Database className="text-success" size={32} />,
      title: 'Multi-Floor Management',
      desc: 'Upload blueprint image overlays and structure paths per floor level.',
      details: 'Seamlessly transition between ground floors, upper levels, and underground passages.'
    },
    {
      id: 5,
      icon: <ShieldCheck className="text-danger" size={32} />,
      title: 'JWT Authentication',
      desc: 'Secure user registration, profile ownership, and venue visibility toggles.',
      details: 'Token-based authentication ensures that venue maps remain secure and manageable by authorized creators.'
    },
    {
      id: 6,
      icon: <Compass className="text-blue" size={32} />,
      title: 'Community Map Network',
      desc: 'Publish public spatial blueprints or keep administrative venues private.',
      details: 'Browse public maps uploaded by other architects or keep your custom spatial layouts private.'
    }
  ];

  return (
    <div className="container py-5 text-light">
      <div className="text-center mb-5">
        <h1 className="display-4 fw-bold mb-3">System Capabilities</h1>
        <p className="text-muted fs-5 col-md-8 mx-auto">
          Click any card below to open feature details.
        </p>
      </div>

      <div className="row g-4">
        {features.map((item) => (
          <div className="col-md-4" key={item.id}>
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="glass-panel p-4 h-100 d-flex flex-column justify-content-between cursor-pointer"
              style={{ cursor: 'pointer' }}
              onClick={() => setSelectedFeature(item)}
            >
              <div>
                <div className="p-3 bg-dark rounded-circle d-inline-block mb-3">
                  {item.icon}
                </div>
                <h4 className="fw-bold mb-2">{item.title}</h4>
                <p className="text-muted small m-0">{item.desc}</p>
              </div>
            </motion.div>
          </div>
        ))}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedFeature && (
          <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-dark bg-opacity-75" style={{ zIndex: 1050 }}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="glass-panel p-4 text-light position-relative" style={{ maxWidth: '500px', width: '90%' }}
            >
              <button 
                className="btn btn-sm btn-outline-secondary position-absolute top-0 end-0 m-3"
                onClick={() => setSelectedFeature(null)}
              >
                <X size={18} />
              </button>
              <div className="mb-3">{selectedFeature.icon}</div>
              <h3 className="fw-bold mb-2">{selectedFeature.title}</h3>
              <p className="text-muted mb-3">{selectedFeature.desc}</p>
              <div className="p-3 bg-dark bg-opacity-50 rounded border border-secondary">
                <small className="text-info">{selectedFeature.details}</small>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
