import React, {
  useState,
  useEffect,
  useRef,
  useContext,
} from "react";

import { useNavigate } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import API from "../services/api";
import { AuthContext } from "../context/AuthContext";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [maps, setMaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // QR modal state
  const [qrMap, setQrMap] = useState(null);
  const [publishingMapId, setPublishingMapId] = useState(null);
  const qrRef = useRef(null);

  /*
  ============================================================
  LOAD MAPS
  ============================================================
  */

  useEffect(() => {
    let cancelled = false;

    const loadMaps = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await API.get("/maps");
        const data = response.data;

        let backendMaps = [];

        if (Array.isArray(data)) {
          backendMaps = data;
        } else if (Array.isArray(data?.maps)) {
          backendMaps = data.maps;
        } else if (Array.isArray(data?.data)) {
          backendMaps = data.data;
        }

        console.log(
          "================================="
        );
        console.log("DASHBOARD MAP REQUEST");
        console.log("Authenticated user:", user);
        console.log(
          "Maps received from API:",
          backendMaps
        );
        console.log(
          "Number of maps:",
          backendMaps.length
        );
        console.log(
          "================================="
        );

        /*
        ----------------------------------------------------------
        IMPORTANT

        Do NOT filter maps here using user._id.

        The backend /api/maps endpoint is responsible for
        deciding which maps the authenticated user can see.

        This prevents valid maps from disappearing when the
        backend returns owner/userId in a different format.
        ----------------------------------------------------------
        */

        if (!cancelled) {
          setMaps(backendMaps);
        }
      } catch (err) {
        console.error(
          "Unable to load user's maps:",
          err
        );

        if (!cancelled) {
          setMaps([]);

          if (err.response?.status === 401) {
            setError(
              "Your session has expired. Please log in again."
            );
          } else if (err.response?.status === 403) {
            setError(
              "You do not have permission to view your maps."
            );
          } else if (err.response?.data?.error) {
            setError(
              err.response.data.error
            );
          } else if (err.request) {
            setError(
              "Unable to connect to the server. Your maps could not be loaded."
            );
          } else {
            setError(
              "Unable to load your maps. Please try again."
            );
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    /*
    ----------------------------------------------------------
    Wait for AuthContext session resolution.
    ----------------------------------------------------------
    */

    if (user) {
      loadMaps();
    } else {
      setMaps([]);
      setLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [user]);

  /*
  ============================================================
  COUNTS
  ============================================================
  */

  const counts = {
    draft: maps.filter(
      (m) =>
        (m.status || "draft").toLowerCase() ===
        "draft"
    ).length,

    completed: maps.filter((m) => {
      const status =
        (m.status || "").toLowerCase();

      return (
        status === "completed" ||
        status === "published"
      );
    }).length,

    archived: maps.filter(
      (m) =>
        (m.status || "").toLowerCase() ===
        "archived"
    ).length,
  };

  /*
  ============================================================
  GET MAP ID
  ============================================================
  */

  const getMapId = (map) => {
    return (
      map?._id ||
      map?.buildingId ||
      map?.id
    );
  };

  /*
  ============================================================
  DELETE MAP
  ============================================================
  */

  const handleDelete = async (mapOrId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this map?"
      )
    ) {
      return;
    }

    const map =
      typeof mapOrId === "object"
        ? mapOrId
        : {
            buildingId: mapOrId,
          };

    const candidates = [
      map._id,
      map.buildingId,
      map.id,
    ]
      .filter(Boolean)
      .map(String)
      .filter(
        (value, index, array) =>
          array.indexOf(value) === index
      );

    if (!candidates.length) {
      setError(
        "Cannot delete this map because its ID is missing."
      );
      return;
    }

    let deleted = false;
    let lastStatus = null;

    try {
      for (const candidate of candidates) {
        try {
          await API.delete(
            `/maps/${encodeURIComponent(candidate)}`
          );

          deleted = true;
          break;
        } catch (err) {
          lastStatus =
            err.response?.status;

          if (lastStatus === 404) {
            continue;
          }

          throw err;
        }
      }

      if (!deleted) {
        if (lastStatus === 401) {
          setError(
            "Your session has expired. Please log in again."
          );
        } else if (lastStatus === 403) {
          setError(
            "You do not have permission to delete this map."
          );
        } else {
          setError(
            "The map could not be deleted from the server."
          );
        }

        return;
      }

      const ids = new Set(candidates);

      const matchesMap = (m) =>
        [
          m?._id,
          m?.buildingId,
          m?.id,
        ]
          .filter(Boolean)
          .map(String)
          .some((value) =>
            ids.has(value)
          );

      setMaps((prev) =>
        prev.filter(
          (m) => !matchesMap(m)
        )
      );

      /*
      ----------------------------------------------------------
      Only remove local editor drafts.

      We do NOT use localStorage as Dashboard map storage.
      ----------------------------------------------------------
      */

      for (const id of candidates) {
        localStorage.removeItem(
          `map_draft_${id}`
        );

        localStorage.removeItem(
          `map_versions_${id}`
        );
      }

      setError("");
    } catch (err) {
      console.error(
        "Map delete request failed:",
        err
      );

      if (err.response?.status === 401) {
        setError(
          "Your session has expired. Please log in again."
        );
      } else if (
        err.response?.status === 403
      ) {
        setError(
          "You do not have permission to delete this map."
        );
      } else if (
        err.response?.data?.error
      ) {
        setError(
          err.response.data.error
        );
      } else if (err.request) {
        setError(
          "Unable to reach the server. The map was not deleted."
        );
      } else {
        setError(
          "Unable to delete the map. Please try again."
        );
      }
    }
  };

  /*
  ============================================================
  MAKE MAP PUBLIC + OPEN QR
  ============================================================
  */

  const handleOpenQR = async (map) => {
    const mapId = getMapId(map);

    if (!mapId) {
      setError(
        "Public navigation link is unavailable because the map ID is missing."
      );
      return;
    }

    setError("");

    /*
    ----------------------------------------------------------
    Already public
    ----------------------------------------------------------
    */

    if (map.isPublic === true) {
      setQrMap(map);
      return;
    }

    try {
      setPublishingMapId(
        String(mapId)
      );

      const response =
        await API.patch(
          `/maps/${encodeURIComponent(
            String(mapId)
          )}/visibility`,
          {
            isPublic: true,
          }
        );

      const responseMap =
        response.data?.map ||
        response.data?.updatedMap ||
        response.data?.building ||
        null;

      const publicMap = {
        ...map,
        ...(responseMap || {}),
        isPublic: true,
      };

      setMaps((prev) =>
        prev.map((item) => {
          const itemId =
            getMapId(item);

          return String(itemId) ===
            String(mapId)
            ? {
                ...item,
                ...(responseMap || {}),
                isPublic: true,
              }
            : item;
        })
      );

      setQrMap(publicMap);
    } catch (err) {
      console.error(
        "Unable to make map public:",
        err
      );

      if (err.response?.status === 401) {
        setError(
          "Your session has expired. Please log in again."
        );
      } else if (
        err.response?.status === 403
      ) {
        setError(
          "You do not have permission to make this map public."
        );
      } else if (
        err.response?.status === 404
      ) {
        setError(
          "The map could not be found on the server."
        );
      } else if (
        err.response?.data?.error
      ) {
        setError(
          err.response.data.error
        );
      } else if (err.request) {
        setError(
          "Unable to reach the server. Please make sure the backend is running."
        );
      } else {
        setError(
          "Unable to make this map public. Please try again."
        );
      }
    } finally {
      setPublishingMapId(null);
    }
  };

  /*
  ============================================================
  PUBLIC URL
  ============================================================
  */

  const getPublicMapUrl = (map) => {
    const mapId = getMapId(map);

    if (!mapId) {
      return "";
    }

    return `${window.location.origin}/navigate/${encodeURIComponent(
      mapId
    )}`;
  };

  /*
  ============================================================
  COPY LINK
  ============================================================
  */

  const handleCopyLink = async () => {
    if (!qrMap) {
      return;
    }

    const url =
      getPublicMapUrl(qrMap);

    if (!url) {
      setError(
        "Public navigation link is unavailable."
      );
      return;
    }

    try {
      await navigator.clipboard.writeText(
        url
      );

      setError("");
    } catch (err) {
      console.warn(
        "Could not copy link:",
        err
      );

      setError(
        "Unable to copy the navigation link. Please copy it manually."
      );
    }
  };

  /*
  ============================================================
  DOWNLOAD QR
  ============================================================
  */

  const handleDownloadQR = () => {
    if (!qrRef.current || !qrMap) {
      return;
    }

    const canvas =
      qrRef.current.querySelector(
        "canvas"
      );

    if (!canvas) {
      setError(
        "QR code is not ready yet."
      );
      return;
    }

    const mapName =
      qrMap.title ||
      qrMap.name ||
      "building-map";

    const link =
      document.createElement("a");

    link.download = `${mapName
      .replace(/[^a-z0-9]/gi, "-")
      .toLowerCase()}-qr.png`;

    link.href =
      canvas.toDataURL("image/png");

    link.click();
  };

  /*
  ============================================================
  LOADING
  ============================================================
  */

  if (loading) {
    return (
      <main className="dashboard-page d-flex align-items-center justify-content-center">
        <div className="text-center">

          <div
            className="spinner-border text-primary mb-3"
            role="status"
          >
            <span className="visually-hidden">
              Loading...
            </span>
          </div>

          <h5 className="fw-bold text-dark">
            Loading your maps...
          </h5>

          <p className="text-secondary mb-0">
            Preparing your navigation workspace
          </p>

        </div>
      </main>
    );
  }

  /*
  ============================================================
  DASHBOARD
  ============================================================
  */

  return (
    <main className="dashboard-page">

      <div className="container py-5">

        {/* HEADER */}

        <section className="dashboard-header mb-5">

          <div className="row align-items-center g-4">

            <div className="col-lg-8">

              <div className="dashboard-eyebrow mb-3">
                <span>🗺️</span>
                <span>YOUR WORKSPACE</span>
              </div>

              <h1 className="dashboard-title mb-2">
                My Building Maps
              </h1>

              <p className="dashboard-subtitle mb-0">
                Create, manage and publish your
                indoor navigation maps from one
                workspace.
              </p>

            </div>

            <div className="col-lg-4 text-lg-end">

              <button
                className="create-map-btn"
                onClick={() =>
                  navigate(
                    `/editor/map_${Date.now()}?isNew=true`
                  )
                }
              >
                <span className="create-icon">
                  ＋
                </span>

                <span>
                  Create New Map
                </span>

                <span className="arrow">
                  →
                </span>
              </button>

            </div>

          </div>

        </section>

        {/* ERROR */}

        {error && (
          <div
            className="dashboard-alert mb-4"
            role="alert"
          >

            <span className="alert-icon">
              !
            </span>

            <span>
              {error}
            </span>

            <button
              type="button"
              onClick={() =>
                setError("")
              }
              className="alert-close"
              aria-label="Close"
            >
              ×
            </button>

          </div>
        )}

        {/* STATS */}

        <section className="row g-4 mb-5">

          <div className="col-md-4">

            <div className="stat-card draft-card h-100">

              <div className="stat-top">

                <div className="stat-icon draft-icon">
                  ✏️
                </div>

                <span className="stat-label">
                  DRAFTS
                </span>

              </div>

              <div className="stat-number">
                {counts.draft}
              </div>

              <p>
                Maps currently being designed
              </p>

            </div>

          </div>

          <div className="col-md-4">

            <div className="stat-card published-card h-100">

              <div className="stat-top">

                <div className="stat-icon published-icon">
                  ✓
                </div>

                <span className="stat-label">
                  PUBLISHED
                </span>

              </div>

              <div className="stat-number">
                {counts.completed}
              </div>

              <p>
                Maps available for navigation
              </p>

            </div>

          </div>

          <div className="col-md-4">

            <div className="stat-card archived-card h-100">

              <div className="stat-top">

                <div className="stat-icon archived-icon">
                  🗄️
                </div>

                <span className="stat-label">
                  ARCHIVED
                </span>

              </div>

              <div className="stat-number">
                {counts.archived}
              </div>

              <p>
                Archived projects
              </p>

            </div>

          </div>

        </section>

        {/* PROJECT HEADER */}

        <section className="d-flex flex-column flex-md-row justify-content-between align-items-md-end gap-3 mb-4">

          <div>

            <div className="section-kicker">
              PROJECTS
            </div>

            <h2 className="section-title mb-1">
              Your maps
            </h2>

            <p className="text-secondary mb-0">
              {maps.length === 0
                ? "No maps have been created yet."
                : `${maps.length} map${
                    maps.length === 1
                      ? ""
                      : "s"
                  } in your workspace.`}
            </p>

          </div>

          {maps.length > 0 && (
            <div className="map-count-pill">

              <span className="count-dot" />

              {maps.length} Active Project
              {maps.length !== 1
                ? "s"
                : ""}

            </div>
          )}

        </section>

        {/* MAPS */}

        <section className="row g-4">

          {maps.length === 0 ? (

            <div className="col-12">

              <div className="empty-state">

                <div className="empty-illustration">

                  <div className="empty-grid">
                    <span />
                    <span />
                    <span />
                    <span />
                  </div>

                  <div className="empty-map-icon">
                    🗺️
                  </div>

                </div>

                <h3>
                  Create your first indoor map
                </h3>

                <p>
                  Start by creating a building
                  and designing its floors,
                  rooms and navigation network.
                </p>

                <button
                  className="create-map-btn empty-btn"
                  onClick={() =>
                    navigate(
                      `/editor/map_${Date.now()}?isNew=true`
                    )
                  }
                >

                  <span>
                    ＋
                  </span>

                  Create New Map

                  <span>
                    →
                  </span>

                </button>

              </div>

            </div>

          ) : (

            maps.map((map) => {

              const mapId =
                getMapId(map);

              const isPublishing =
                publishingMapId ===
                String(mapId);

              const mapTitle =
                map.title ||
                map.name ||
                "Untitled Map";

              const status =
                (
                  map.status ||
                  "draft"
                ).toLowerCase();

              const isPublic =
                map.isPublic === true;

              const floors =
                map.totalFloors ||
                map.floors?.length ||
                1;

              const waypoints =
                map.nodes?.length ||
                map.waypoints?.length ||
                0;

              return (
                <div
                  className="col-lg-6"
                  key={mapId}
                >

                  <article className="map-card h-100">

                    {/* MAP CARD TOP */}

                    <div className="map-card-top">

                      <div className="map-preview">

                        <div className="preview-grid">
                          <span />
                          <span />
                          <span />
                          <span />
                          <span />
                          <span />
                        </div>

                        <div className="preview-building">

                          <div className="building-room room-one" />
                          <div className="building-room room-two" />
                          <div className="building-room room-three" />
                          <div className="building-room room-four" />

                          <div className="preview-route">
                            <i />
                            <i />
                            <i />
                          </div>

                        </div>

                        <div className="preview-pin">
                          📍
                        </div>

                      </div>

                      <div className="map-card-content">

                        <div className="d-flex justify-content-between align-items-start gap-3 mb-2">

                          <h3 className="map-title">
                            {mapTitle}
                          </h3>

                          <div className="status-group">

                            <span
                              className={`status-badge status-${status}`}
                            >

                              <span className="status-dot" />

                              {status}

                            </span>

                            {isPublic && (
                              <span className="public-badge">

                                <span>
                                  🌐
                                </span>

                                Public

                              </span>
                            )}

                          </div>

                        </div>

                        <p className="map-description">

                          {map.description ||
                            "No description provided for this map."}

                        </p>

                        {/* MAP META */}

                        <div className="map-meta">

                          <div className="meta-item">

                            <span className="meta-icon">
                              🏢
                            </span>

                            <div>

                              <strong>
                                {floors}
                              </strong>

                              <small>
                                {floors === 1
                                  ? "Floor"
                                  : "Floors"}
                              </small>

                            </div>

                          </div>

                          <div className="meta-divider" />

                          <div className="meta-item">

                            <span className="meta-icon">
                              📍
                            </span>

                            <div>

                              <strong>
                                {waypoints}
                              </strong>

                              <small>
                                Waypoints
                              </small>

                            </div>

                          </div>

                          <div className="meta-divider" />

                          <div className="meta-item">

                            <span className="meta-icon">
                              🧭
                            </span>

                            <div>

                              <strong>
                                Indoor
                              </strong>

                              <small>
                                Navigation
                              </small>

                            </div>

                          </div>

                        </div>

                      </div>

                    </div>

                    {/* MAP ACTIONS */}

                    <div className="map-actions">

                      <button
                        className="action-btn delete-action"
                        onClick={() =>
                          handleDelete(map)
                        }
                      >

                        <span>
                          🗑️
                        </span>

                        Delete

                      </button>

                      <button
                        className="action-btn qr-action"
                        onClick={() =>
                          handleOpenQR(map)
                        }
                        disabled={
                          isPublishing
                        }
                      >

                        <span>
                          {isPublishing
                            ? "⏳"
                            : "📱"}
                        </span>

                        {isPublishing
                          ? "Publishing..."
                          : isPublic
                          ? "QR Code"
                          : "Make Public & QR"}

                      </button>

                      <button
                        className="action-btn editor-action"
                        onClick={() =>
                          navigate(
                            `/editor/${mapId}`
                          )
                        }
                      >

                        Open Editor

                        <span>
                          ↗
                        </span>

                      </button>

                    </div>

                  </article>

                </div>
              );
            })

          )}

        </section>

        {/* BOTTOM INFO */}

        {maps.length > 0 && (
          <section className="workspace-tip mt-5">

            <div className="tip-icon">
              ✨
            </div>

            <div>

              <h5>
                Build, test, then publish
              </h5>

              <p>
                Create your building layout,
                connect the navigation network
                and test routes before sharing
                the public QR experience.
              </p>

            </div>

            <button
              onClick={() =>
                navigate("/guide")
              }
              className="tip-link"
            >
              View Guide →
            </button>

          </section>
        )}

      </div>

      {/* ======================================================
          QR MODAL
      ====================================================== */}

      {qrMap && (
        <div
          className="qr-overlay"
          onClick={() =>
            setQrMap(null)
          }
        >

          <div
            className="qr-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="qr-header">

              <div>

                <div className="qr-eyebrow">
                  PUBLIC NAVIGATION
                </div>

                <h3>
                  Scan to Navigate
                </h3>

                <p>
                  {qrMap.title ||
                    qrMap.name ||
                    "Building Map"}
                </p>

              </div>

              <button
                className="qr-close"
                onClick={() =>
                  setQrMap(null)
                }
              >
                ×
              </button>

            </div>

            <div className="qr-success">

              <div className="success-icon">
                ✓
              </div>

              <div>

                <strong>
                  Map is publicly available
                </strong>

                <small>
                  Visitors don't need an account
                  to navigate this map.
                </small>

              </div>

            </div>

            <div
              ref={qrRef}
              className="qr-code-container"
            >

              <div className="qr-code-inner">

                <QRCodeCanvas
                  value={getPublicMapUrl(
                    qrMap
                  )}
                  size={250}
                  level="H"
                  includeMargin={true}
                />

              </div>

            </div>

            <div className="qr-instruction">

              <h5>
                Scan this code
              </h5>

              <p>
                Visitors can scan this QR
                code to instantly open the
                public indoor navigation
                experience.
              </p>

            </div>

            <div className="public-link-section">

              <label>
                Public Navigation Link
              </label>

              <div className="public-link-box">

                <input
                  type="text"
                  value={getPublicMapUrl(
                    qrMap
                  )}
                  readOnly
                />

                <button
                  onClick={
                    handleCopyLink
                  }
                >
                  Copy
                </button>

              </div>

            </div>

            <div className="qr-actions">

              <button
                className="download-qr-btn"
                onClick={
                  handleDownloadQR
                }
              >

                <span>
                  ↓
                </span>

                Download QR

              </button>

              <button
                className="close-modal-btn"
                onClick={() =>
                  setQrMap(null)
                }
              >
                Close
              </button>

            </div>

          </div>

        </div>
      )}

      {/* ======================================================
          DASHBOARD STYLES
      ====================================================== */}

      <style>
        {`
          .dashboard-page {
            min-height: calc(100vh - 70px);
            background:
              radial-gradient(
                circle at 5% 0%,
                rgba(37, 99, 235, 0.08),
                transparent 28%
              ),
              radial-gradient(
                circle at 95% 10%,
                rgba(6, 182, 212, 0.08),
                transparent 30%
              ),
              linear-gradient(
                180deg,
                #f8fbff 0%,
                #ffffff 55%,
                #f7fbff 100%
              );
            color: #10233f;
          }

          .dashboard-eyebrow {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 8px 14px;
            border-radius: 999px;
            background: linear-gradient(
              135deg,
              #eaf6ff,
              #eef5ff
            );
            border: 1px solid #d6eaff;
            color: #1673c9;
            font-size: 12px;
            font-weight: 800;
            letter-spacing: .5px;
          }

          .dashboard-title {
            font-size: clamp(2.1rem, 4vw, 3.2rem);
            font-weight: 800;
            letter-spacing: -1.8px;
            color: #10284b;
          }

          .dashboard-subtitle {
            color: #63748b;
            font-size: 1.05rem;
            max-width: 680px;
          }

          .create-map-btn {
            display: inline-flex;
            align-items: center;
            gap: 11px;
            border: 0;
            border-radius: 14px;
            padding: 14px 20px;
            background: linear-gradient(
              135deg,
              #1677ee,
              #08a8e8
            );
            color: white;
            font-weight: 750;
            font-size: .96rem;
            box-shadow:
              0 12px 30px rgba(25, 118, 230, .22);
            transition:
              transform .2s ease,
              box-shadow .2s ease;
          }

          .create-map-btn:hover {
            transform: translateY(-2px);
            box-shadow:
              0 16px 35px rgba(25, 118, 230, .28);
          }

          .create-icon {
            font-size: 20px;
            line-height: 1;
          }

          .arrow {
            font-size: 18px;
          }

          .dashboard-alert {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 13px 16px;
            border-radius: 12px;
            background: #fff8e8;
            border: 1px solid #f7d98b;
            color: #765617;
            box-shadow:
              0 5px 20px rgba(120, 80, 0, .05);
          }

          .alert-icon {
            width: 25px;
            height: 25px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f6bd3c;
            color: white;
            font-weight: 800;
          }

          .alert-close {
            margin-left: auto;
            border: 0;
            background: transparent;
            color: #765617;
            font-size: 22px;
          }

          .stat-card {
            position: relative;
            overflow: hidden;
            padding: 24px;
            border-radius: 20px;
            background: rgba(255,255,255,.9);
            border: 1px solid #e2ebf5;
            box-shadow:
              0 8px 30px rgba(34, 73, 120, .07);
            transition:
              transform .2s ease,
              box-shadow .2s ease;
          }

          .stat-card:hover {
            transform: translateY(-3px);
            box-shadow:
              0 15px 38px rgba(34, 73, 120, .11);
          }

          .stat-card::after {
            content: "";
            position: absolute;
            width: 120px;
            height: 120px;
            border-radius: 50%;
            right: -45px;
            bottom: -55px;
            opacity: .45;
          }

          .draft-card {
            border-top: 3px solid #f2b01e;
          }

          .draft-card::after {
            background: rgba(242,176,30,.12);
          }

          .published-card {
            border-top: 3px solid #19b979;
          }

          .published-card::after {
            background: rgba(25,185,121,.12);
          }

          .archived-card {
            border-top: 3px solid #27a9df;
          }

          .archived-card::after {
            background: rgba(39,169,223,.12);
          }

          .stat-top {
            display: flex;
            align-items: center;
            justify-content: space-between;
          }

          .stat-icon {
            width: 42px;
            height: 42px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 12px;
            font-size: 19px;
          }

          .draft-icon {
            background: #fff6db;
          }

          .published-icon {
            background: #e7faf2;
            color: #13a66d;
            font-weight: 900;
          }

          .archived-icon {
            background: #e7f7ff;
          }

          .stat-label {
            font-size: 11px;
            font-weight: 800;
            letter-spacing: .9px;
            color: #7a8ba0;
          }

          .stat-number {
            margin-top: 20px;
            font-size: 3rem;
            line-height: 1;
            font-weight: 800;
            color: #10284b;
          }

          .stat-card p {
            margin: 10px 0 0;
            color: #718198;
            font-size: .88rem;
          }

          .section-kicker {
            color: #2782d5;
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 1.2px;
            margin-bottom: 5px;
          }

          .section-title {
            color: #132c50;
            font-weight: 800;
            letter-spacing: -.6px;
          }

          .map-count-pill {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 8px 13px;
            border-radius: 999px;
            background: white;
            border: 1px solid #dce7f2;
            color: #63748a;
            font-size: .8rem;
            font-weight: 700;
          }

          .count-dot {
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background: #1fc487;
          }

          .map-card {
            overflow: hidden;
            background: rgba(255,255,255,.94);
            border: 1px solid #dfe9f4;
            border-radius: 20px;
            box-shadow:
              0 9px 32px rgba(33, 75, 120, .075);
            transition:
              transform .22s ease,
              box-shadow .22s ease,
              border-color .22s ease;
          }

          .map-card:hover {
            transform: translateY(-4px);
            border-color: #c9dff3;
            box-shadow:
              0 18px 45px rgba(33, 75, 120, .13);
          }

          .map-card-top {
            display: flex;
            gap: 20px;
            padding: 20px;
          }

          .map-preview {
            position: relative;
            flex: 0 0 145px;
            height: 145px;
            overflow: hidden;
            border-radius: 16px;
            background:
              linear-gradient(
                145deg,
                #eef7ff,
                #e8f3fb
              );
            border: 1px solid #d5e7f4;
          }

          .preview-grid {
            position: absolute;
            inset: 0;
            opacity: .4;
            background-image:
              linear-gradient(
                #bdd6e8 1px,
                transparent 1px
              ),
              linear-gradient(
                90deg,
                #bdd6e8 1px,
                transparent 1px
              );
            background-size: 18px 18px;
          }

          .preview-building {
            position: absolute;
            left: 24px;
            top: 26px;
            width: 95px;
            height: 90px;
            border: 3px solid #6da9cf;
            border-radius: 7px;
            background: rgba(255,255,255,.75);
          }

          .building-room {
            position: absolute;
            border: 2px solid #8bb9d5;
            background: rgba(224,243,255,.8);
          }

          .room-one {
            left: 7px;
            top: 7px;
            width: 32px;
            height: 29px;
          }

          .room-two {
            right: 7px;
            top: 7px;
            width: 38px;
            height: 29px;
          }

          .room-three {
            left: 7px;
            bottom: 7px;
            width: 45px;
            height: 30px;
          }

          .room-four {
            right: 7px;
            bottom: 7px;
            width: 31px;
            height: 30px;
          }

          .preview-route {
            position: absolute;
            left: 17px;
            top: 48px;
            width: 66px;
            height: 4px;
            background: #1688ed;
            transform: rotate(-8deg);
            border-radius: 999px;
            box-shadow:
              0 0 9px rgba(22,136,237,.45);
          }

          .preview-route i {
            position: absolute;
            width: 9px;
            height: 9px;
            border-radius: 50%;
            background: #1688ed;
            top: -2px;
          }

          .preview-route i:nth-child(1) {
            left: 0;
          }

          .preview-route i:nth-child(2) {
            left: 28px;
          }

          .preview-route i:nth-child(3) {
            right: 0;
          }

          .preview-pin {
            position: absolute;
            right: 7px;
            bottom: 5px;
            font-size: 18px;
          }

          .map-card-content {
            min-width: 0;
            flex: 1;
            padding-top: 2px;
          }

          .map-title {
            color: #152f52;
            font-size: 1.25rem;
            font-weight: 800;
            letter-spacing: -.5px;
            margin: 0;
            word-break: break-word;
          }

          .status-group {
            display: flex;
            flex-wrap: wrap;
            justify-content: flex-end;
            gap: 5px;
          }

          .status-badge,
          .public-badge {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            padding: 5px 8px;
            border-radius: 999px;
            font-size: 9px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: .4px;
            white-space: nowrap;
          }

          .status-badge {
            background: #f0f4f8;
            color: #64748b;
          }

          .status-completed,
          .status-published {
            background: #e7f9f1;
            color: #119764;
          }

          .status-draft {
            background: #fff6dc;
            color: #aa790b;
          }

          .status-archived {
            background: #edf5fa;
            color: #4d7895;
          }

          .status-dot {
            width: 5px;
            height: 5px;
            border-radius: 50%;
            background: currentColor;
          }

          .public-badge {
            background: #e8f9f2;
            color: #10986a;
            text-transform: none;
          }

          .map-description {
            color: #718197;
            font-size: .86rem;
            line-height: 1.5;
            margin: 10px 0 16px;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }

          .map-meta {
            display: flex;
            align-items: center;
            gap: 11px;
          }

          .meta-item {
            display: flex;
            align-items: center;
            gap: 7px;
          }

          .meta-icon {
            font-size: 15px;
          }

          .meta-item div {
            display: flex;
            flex-direction: column;
          }

          .meta-item strong {
            color: #284463;
            font-size: .8rem;
            line-height: 1.1;
          }

          .meta-item small {
            color: #8a9aae;
            font-size: .68rem;
            margin-top: 2px;
          }

          .meta-divider {
            width: 1px;
            height: 28px;
            background: #e0e8f0;
          }

          .map-actions {
            display: flex;
            align-items: center;
            gap: 9px;
            padding: 14px 20px;
            border-top: 1px solid #e7eef5;
            background: #fbfdff;
          }

          .action-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            border-radius: 9px;
            padding: 8px 11px;
            font-size: .76rem;
            font-weight: 750;
            transition: all .18s ease;
          }

          .action-btn:disabled {
            opacity: .65;
            cursor: wait;
          }

          .delete-action {
            border: 1px solid #f0caca;
            background: #fff8f8;
            color: #d94a4a;
          }

          .delete-action:hover {
            background: #fff0f0;
            border-color: #e8aaaa;
          }

          .qr-action {
            border: 1px solid #bfe1f6;
            background: #f0f9ff;
            color: #1682ca;
          }

          .qr-action:hover {
            background: #e4f5ff;
          }

          .editor-action {
            margin-left: auto;
            border: 1px solid #177ee7;
            background: linear-gradient(
              135deg,
              #1684ee,
              #13a9df
            );
            color: white;
            box-shadow:
              0 5px 15px rgba(20,128,229,.16);
          }

          .editor-action:hover {
            transform: translateY(-1px);
            box-shadow:
              0 8px 20px rgba(20,128,229,.22);
          }

          .empty-state {
            padding: 70px 30px;
            text-align: center;
            border-radius: 22px;
            background:
              linear-gradient(
                145deg,
                rgba(255,255,255,.95),
                rgba(247,251,255,.95)
              );
            border: 1px dashed #cdddea;
          }

          .empty-illustration {
            position: relative;
            width: 100px;
            height: 100px;
            margin: 0 auto 22px;
          }

          .empty-grid {
            position: absolute;
            inset: 0;
            border-radius: 22px;
            background: #edf7ff;
            border: 1px solid #d3e8f7;
            display: grid;
            grid-template-columns: repeat(2,1fr);
            gap: 7px;
            padding: 14px;
          }

          .empty-grid span {
            border-radius: 5px;
            background: white;
            border: 1px solid #c9dfef;
          }

          .empty-map-icon {
            position: absolute;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 34px;
            filter: drop-shadow(
              0 4px 5px rgba(20,100,160,.12)
            );
          }

          .empty-state h3 {
            color: #173354;
            font-weight: 800;
          }

          .empty-state p {
            max-width: 500px;
            margin: 0 auto 24px;
            color: #718198;
          }

          .empty-btn {
            margin-top: 4px;
          }

          .workspace-tip {
            display: flex;
            align-items: center;
            gap: 15px;
            padding: 18px 20px;
            border-radius: 16px;
            background:
              linear-gradient(
                135deg,
                #f0f8ff,
                #f4fbff
              );
            border: 1px solid #d6eafa;
          }

          .tip-icon {
            width: 42px;
            height: 42px;
            flex: 0 0 42px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 12px;
            background: white;
            box-shadow:
              0 4px 12px rgba(30,100,150,.07);
          }

          .workspace-tip h5 {
            margin: 0 0 3px;
            color: #183553;
            font-weight: 800;
          }

          .workspace-tip p {
            margin: 0;
            color: #718198;
            font-size: .83rem;
          }

          .tip-link {
            margin-left: auto;
            border: 0;
            background: transparent;
            color: #177bd0;
            font-weight: 750;
            white-space: nowrap;
          }

          /* QR MODAL */

          .qr-overlay {
            position: fixed;
            inset: 0;
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            background: rgba(10, 31, 55, .46);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
          }

          .qr-modal {
            width: min(94vw, 470px);
            max-height: 92vh;
            overflow-y: auto;
            padding: 25px;
            border-radius: 24px;
            background: rgba(255,255,255,.98);
            border: 1px solid #dce8f3;
            box-shadow:
              0 30px 90px rgba(18, 52, 87, .25);
          }

          .qr-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 20px;
            margin-bottom: 20px;
          }

          .qr-eyebrow {
            color: #2084d2;
            font-size: 10px;
            font-weight: 850;
            letter-spacing: 1px;
            margin-bottom: 5px;
          }

          .qr-header h3 {
            margin: 0;
            color: #142f50;
            font-weight: 800;
          }

          .qr-header p {
            color: #78899e;
            font-size: .83rem;
            margin: 4px 0 0;
          }

          .qr-close {
            width: 34px;
            height: 34px;
            border: 1px solid #dbe5ef;
            background: #f7fafc;
            border-radius: 10px;
            color: #60758c;
            font-size: 22px;
            line-height: 1;
          }

          .qr-success {
            display: flex;
            align-items: center;
            gap: 11px;
            padding: 12px;
            margin-bottom: 18px;
            border-radius: 13px;
            background: #edfbf5;
            border: 1px solid #c9efdd;
          }

          .success-icon {
            width: 30px;
            height: 30px;
            flex: 0 0 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            background: #1fbd7b;
            color: white;
            font-weight: 900;
          }

          .qr-success div:last-child {
            display: flex;
            flex-direction: column;
          }

          .qr-success strong {
            color: #167653;
            font-size: .82rem;
          }

          .qr-success small {
            color: #66917f;
            margin-top: 2px;
          }

          .qr-code-container {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            border-radius: 18px;
            background:
              linear-gradient(
                145deg,
                #f3f9ff,
                #edf7ff
              );
            border: 1px solid #dbeaf6;
          }

          .qr-code-inner {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 14px;
            border-radius: 15px;
            background: white;
            box-shadow:
              0 8px 25px rgba(25,70,110,.1);
          }

          .qr-instruction {
            text-align: center;
            margin: 18px 0;
          }

          .qr-instruction h5 {
            color: #173453;
            font-weight: 800;
            margin-bottom: 5px;
          }

          .qr-instruction p {
            color: #77889b;
            font-size: .8rem;
            margin: 0;
          }

          .public-link-section label {
            display: block;
            color: #687c91;
            font-size: .75rem;
            font-weight: 700;
            margin-bottom: 7px;
          }

          .public-link-box {
            display: flex;
            border: 1px solid #d9e5ef;
            border-radius: 11px;
            overflow: hidden;
            background: #f8fbfd;
          }

          .public-link-box input {
            min-width: 0;
            flex: 1;
            border: 0;
            outline: 0;
            background: transparent;
            padding: 10px 12px;
            color: #425a73;
            font-size: .76rem;
          }

          .public-link-box button {
            border: 0;
            padding: 0 15px;
            background: #1686df;
            color: white;
            font-weight: 750;
          }

          .qr-actions {
            display: flex;
            gap: 10px;
            margin-top: 18px;
          }

          .download-qr-btn,
          .close-modal-btn {
            border-radius: 11px;
            padding: 11px 15px;
            font-weight: 750;
          }

          .download-qr-btn {
            flex: 1;
            border: 0;
            background: linear-gradient(
              135deg,
              #147ee6,
              #09a8e1
            );
            color: white;
          }

          .close-modal-btn {
            border: 1px solid #d9e4ed;
            background: white;
            color: #526a82;
          }

          /* RESPONSIVE */

          @media (max-width: 767px) {

            .dashboard-page .container {
              padding-left: 18px;
              padding-right: 18px;
            }

            .dashboard-title {
              font-size: 2.25rem;
            }

            .create-map-btn {
              width: 100%;
              justify-content: center;
            }

            .map-card-top {
              flex-direction: column;
            }

            .map-preview {
              flex-basis: auto;
              width: 100%;
              height: 150px;
            }

            .preview-building {
              left: 50%;
              transform: translateX(-50%);
            }

            .status-group {
              justify-content: flex-start;
            }

            .map-actions {
              flex-wrap: wrap;
            }

            .editor-action {
              width: 100%;
              margin-left: 0;
            }

            .workspace-tip {
              align-items: flex-start;
              flex-wrap: wrap;
            }

            .tip-link {
              margin-left: 57px;
            }
          }

          @media (max-width: 430px) {

            .dashboard-title {
              font-size: 2rem;
            }

            .stat-number {
              font-size: 2.6rem;
            }

            .map-meta {
              gap: 7px;
            }

            .meta-divider {
              display: none;
            }

            .map-meta {
              flex-wrap: wrap;
            }

            .map-actions {
              gap: 7px;
            }

            .action-btn {
              flex: 1;
            }

            .qr-modal {
              padding: 18px;
            }
          }
        `}
      </style>

    </main>
  );
}