const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
require("dotenv").config();

// ============================================================
// DATABASE
// ============================================================

const connectDB = require("./config/db");

// ============================================================
// ROUTES
// ============================================================

const authRoutes = require("./routes/authRoutes");
const buildingRoutes = require("./routes/buildingRoutes");
const mapRoutes = require("./routes/map");
const floorRoutes = require("./routes/floorRoutes");
const nodeRoutes = require("./routes/nodeRoutes");
const propertyRoutes = require("./routes/propertyRoutes");
const navRoutes = require("./routes/navRoutes");

// ============================================================
// MIDDLEWARE
// ============================================================

const {
  notFound,
  errorHandler,
} = require("./middleware/errorMiddleware");

// ============================================================
// APP CONFIGURATION
// ============================================================

const app = express();

const PORT = process.env.PORT || 5000;

const NODE_ENV =
  process.env.NODE_ENV || "development";

const IS_PRODUCTION =
  NODE_ENV === "production";

const MONGO_URI =
  process.env.MONGO_URI;

const SESSION_SECRET =
  process.env.SESSION_SECRET;

const FRONTEND_URL =
  process.env.FRONTEND_URL ||
  process.env.CLIENT_URL ||
  (IS_PRODUCTION
    ? null
    : "http://localhost:5173");

// ============================================================
// REQUIRED ENVIRONMENT VARIABLES
// ============================================================

if (!MONGO_URI) {
  console.error(
    "❌ MONGO_URI is required."
  );

  process.exit(1);
}

if (!SESSION_SECRET) {
  console.error(
    "❌ SESSION_SECRET is required."
  );

  process.exit(1);
}

if (!FRONTEND_URL) {
  console.error(
    "❌ FRONTEND_URL is required in production."
  );

  process.exit(1);
}

// ============================================================
// APP / SECURITY CONFIGURATION
// ============================================================

app.disable("x-powered-by");

if (IS_PRODUCTION) {
  app.set("trust proxy", 1);
}

// ============================================================
// HELMET
// ============================================================

app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
  })
);

// ============================================================
// CORS
// ============================================================

app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  })
);

// ============================================================
// BODY PARSERS
// ============================================================

app.use(
  express.json({
    limit: "10mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "10mb",
  })
);

// ============================================================
// COOKIES
// ============================================================

app.use(cookieParser());

// ============================================================
// REQUEST LOGGING
// ============================================================

app.use(
  IS_PRODUCTION
    ? morgan("combined")
    : morgan("dev")
);

// ============================================================
// SESSION
// ============================================================

app.use(
  session({
    name: "universalnav.sid",

    secret: SESSION_SECRET,

    resave: false,

    saveUninitialized: false,

    store: MongoStore.create({
      mongoUrl: MONGO_URI,
      ttl: 14 * 24 * 60 * 60,
      touchAfter: 24 * 60 * 60,
    }),

    cookie: {
      maxAge:
        14 * 24 * 60 * 60 * 1000,

      httpOnly: true,

      secure: IS_PRODUCTION,

      sameSite: IS_PRODUCTION
        ? "none"
        : "lax",
    },
  })
);

// ============================================================
// API ROUTES
// ============================================================

// Authentication
app.use(
  "/api/auth",
  authRoutes
);

// Buildings
app.use(
  "/api/buildings",
  buildingRoutes
);

// Maps
app.use(
  "/api/maps",
  mapRoutes
);

// Floors
app.use(
  "/api/floors",
  floorRoutes
);

// Nodes / graph
app.use(
  "/api/nodes",
  nodeRoutes
);

// Properties
app.use(
  "/api/properties",
  propertyRoutes
);

// Navigation
app.use(
  "/api/navigation",
  navRoutes
);

// ============================================================
// HEALTH CHECK
// ============================================================

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "UniversalNav API is running",
    environment: NODE_ENV,
  });
});

// ============================================================
// 404 HANDLER
// ============================================================

app.use(notFound);

// ============================================================
// GLOBAL ERROR HANDLER
// ============================================================

app.use(errorHandler);

// ============================================================
// DATABASE + SERVER STARTUP
// ============================================================

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(
      `🚀 Server running on http://localhost:${PORT}`
    );

    console.log(
      `🔐 Security mode: ${
        IS_PRODUCTION
          ? "production"
          : "development"
      }`
    );

    console.log(
      `🌐 CORS origin: ${FRONTEND_URL}`
    );
  });
});

// ============================================================
// EXPORT APP
// ============================================================

module.exports = app;