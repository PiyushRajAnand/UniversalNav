import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

export default function CreateMap() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "College",
    totalFloors: 1,
    address: {
      street: "",
      city: "",
      state: "",
      country: "",
      zipCode: "",
    },
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name.startsWith("address.")) {
      const field = name.split(".")[1];

      setFormData((prev) => ({
        ...prev,
        address: {
          ...prev.address,
          [field]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const getErrorMessage = (err) => {
    if (err.response?.data?.errors?.length) {
      return err.response.data.errors
        .map((item) => item.message)
        .join(" ");
    }

    if (err.response?.data?.error) {
      return err.response.data.error;
    }

    if (err.response?.data?.message) {
      return err.response.data.message;
    }

    if (err.request) {
      return "Unable to connect to the server. Please make sure the backend is running.";
    }

    return err.message || "Unable to create the building. Please try again.";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError("Building name is required.");
      return;
    }

    const floors = Number(formData.totalFloors);

    if (!Number.isInteger(floors) || floors < 1 || floors > 100) {
      setError("Total floors must be a whole number between 1 and 100.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await API.post("/buildings/create", {
        ...formData,
        name: formData.name.trim(),
        description: formData.description.trim(),
        totalFloors: floors,
      });

      const building = response.data?.building || response.data;

      const buildingId = building?._id || building?.id || building?.buildingId;

      if (!buildingId) {
        throw new Error(
          "Building was created, but no building ID was returned."
        );
      }

      navigate(`/editor/${buildingId}`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          <div className="glass-panel p-4 p-md-5">
            <h2 className="mb-2 fw-bold">Create New Building Map</h2>

            <p className="text-muted mb-4">
              Set up building metadata before placing floorplan elements.
            </p>

            {error && (
              <div
                className="alert alert-danger mb-4"
                role="alert"
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label text-light">
                  Building Name *
                </label>

                <input
                  type="text"
                  name="name"
                  className="form-control bg-dark text-light border-secondary"
                  placeholder="e.g., Stanford Engineering Quad"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  maxLength={200}
                />
              </div>

              <div className="row mb-3">
                <div className="col-md-6 mb-3 mb-md-0">
                  <label className="form-label text-light">
                    Category *
                  </label>

                  <select
                    name="category"
                    className="form-select bg-dark text-light border-secondary"
                    value={formData.category}
                    onChange={handleChange}
                  >
                    <option value="College">
                      College / Campus
                    </option>
                    <option value="Hospital">Hospital</option>
                    <option value="Mall">Shopping Mall</option>
                    <option value="Airport">Airport</option>
                    <option value="Office">Corporate Office</option>
                    <option value="Apartment">
                      Apartment Complex
                    </option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="col-md-6">
                  <label className="form-label text-light">
                    Total Floors *
                  </label>

                  <input
                    type="number"
                    name="totalFloors"
                    min="1"
                    max="100"
                    className="form-control bg-dark text-light border-secondary"
                    value={formData.totalFloors}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label text-light">
                  Description
                </label>

                <textarea
                  name="description"
                  rows="3"
                  className="form-control bg-dark text-light border-secondary"
                  placeholder="Brief summary of building access or layout..."
                  value={formData.description}
                  onChange={handleChange}
                  maxLength={2000}
                />
              </div>

              <hr className="border-secondary my-4" />

              <h5 className="mb-3 text-light">
                Location Details
              </h5>

              <div className="mb-3">
                <label className="form-label text-light">
                  Street Address
                </label>

                <input
                  type="text"
                  name="address.street"
                  className="form-control bg-dark text-light border-secondary"
                  placeholder="123 Science Way"
                  value={formData.address.street}
                  onChange={handleChange}
                />
              </div>

              <div className="row mb-4">
                <div className="col-md-6 mb-3 mb-md-0">
                  <label className="form-label text-light">
                    City
                  </label>

                  <input
                    type="text"
                    name="address.city"
                    className="form-control bg-dark text-light border-secondary"
                    value={formData.address.city}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label text-light">
                    Country
                  </label>

                  <input
                    type="text"
                    name="address.country"
                    className="form-control bg-dark text-light border-secondary"
                    value={formData.address.country}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn-primary w-100 py-2"
                disabled={submitting}
              >
                {submitting
                  ? "Initializing Canvas..."
                  : "Create & Launch Editor →"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}