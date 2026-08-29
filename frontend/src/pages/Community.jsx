import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, MapPin, Heart, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Community() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Placeholder community data
  const sampleBuildings = [
    { id: '1', title: 'Tech Innovation Hub', category: 'Office', floorsCount: 4, creator: 'Sarah Dev', favorites: 24 },
    { id: '2', title: 'Grand Metro Terminal', category: 'Other', floorsCount: 2, creator: 'Alex Mapper', favorites: 52 },
    { id: '3', title: 'St. Jude Health Center', category: 'Hospital', floorsCount: 6, creator: 'Dr. John', favorites: 18 }
  ];

  const filteredBuildings = sampleBuildings.filter(b => {
    const matchesSearch = b.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || b.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="container py-5 text-light">
      <div className="text-center mb-5">
        <h1 className="display-4 fw-bold mb-2">Community Map Hub</h1>
        <p className="text-muted fs-5">Explore public multi-floor navigation structures uploaded by architects and creators.</p>
      </div>

      {/* Search & Filter Bar */}
      <div className="glass-panel p-3 mb-4 d-flex flex-wrap gap-3 align-items-center">
        <div className="position-relative flex-grow-1">
          <Search className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" size={18} />
          <input
            type="text"
            className="form-control bg-dark text-light border-secondary ps-5"
            placeholder="Search venue maps by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="d-flex align-items-center gap-2">
          <Filter size={18} className="text-muted" />
          <select
            className="form-select bg-dark text-light border-secondary"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="All">All Categories</option>
            <option value="University">University</option>
            <option value="Hospital">Hospital</option>
            <option value="Mall">Mall</option>
            <option value="Office">Office</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      {/* Buildings Cards */}
      <div className="row g-4">
        {filteredBuildings.map(b => (
          <div className="col-md-4" key={b.id}>
            <motion.div whileHover={{ y: -6 }} className="glass-panel p-4 h-100 d-flex flex-column justify-content-between">
              <div>
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <span className="badge bg-primary rounded-pill">{b.category}</span>
                  <button className="btn btn-sm btn-link text-danger p-0">
                    <Heart size={18} /> <small>{b.favorites}</small>
                  </button>
                </div>
                <h4 className="fw-bold mb-2">{b.title}</h4>
                <p className="text-muted small mb-3">Created by: {b.creator}</p>
                <div className="d-flex gap-3 text-muted small mb-4">
                  <span><MapPin size={14} /> {b.floorsCount} Floors</span>
                </div>
              </div>
              <Link to="/map-editor" className="btn btn-outline-info w-100 d-flex align-items-center justify-content-center gap-2">
                Launch Spatial Viewer <ArrowRight size={16} />
              </Link>
            </motion.div>
          </div>
        ))}
      </div>
    </div>
  );
}
