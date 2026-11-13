🧭 UniversalNav
🚀 Navigate Beyond the Building Entrance

  
  
  
  
  


  🏢 Smart Indoor Navigation | 🗺️ Multi-Floor Mapping | 📍 Intelligent Wayfinding


  🌐 Live Website •
  🧭 Explore Live Navigation •
  ⭐ GitHub Repository


🌟 What is UniversalNav?
Ever wondered how to find an exact room inside a huge hospital, university, or office building?
Finding a building is easy. Finding the right room inside it is another challenge.
UniversalNav is a full-stack indoor navigation platform that helps people explore buildings, locate rooms, and navigate across multiple floors.
With an interactive map editor, intelligent route calculation, accessibility options, emergency navigation, and QR-based public access, UniversalNav makes indoor wayfinding smarter and more convenient.

💡 From creating indoor maps to guiding visitors — everything in one platform.


✨ Features That Make It Special

🏢 Building & Interactive Map Management

🏗️ Create and manage buildings.
🏬 Organize multiple floors.
🚪 Add rooms, halls, corridors, and waypoints.
🔗 Connect navigation points.
🎨 Interactive floor map editing.
📐 Manage indoor layouts and navigation paths.



🧭 Intelligent Indoor Navigation

📍 Find routes between rooms and locations.
🏢 Navigate across multiple floors.
🛗 Elevator and staircase routing.
👣 Step-by-step directions.
⚡ Alternative route options.
📏 Route distance and estimated travel information.



♿ Accessibility & Smart Routing

♿ Accessibility-aware route preferences.
🦽 Wheelchair-friendly navigation options.
🚫 Avoid stairs, elevators, or narrow routes where supported.
🔄 Recalculate routes when paths are blocked.



🚨 Emergency & Safety Navigation

🚪 Find reachable emergency exits.
🧯 Emergency evacuation routes.
🚧 Handle blocked paths.
🔀 Find alternative routes when connections are unavailable.



📲 QR-Based Public Navigation

🔳 Generate QR codes for published maps.
📱 Scan and open maps on mobile devices.
🌐 Access public maps without logging in.
🔐 Separate public and private map access.



🎮 Route Simulation

🚶 Simulate navigation along calculated routes.
📊 Track route progress.
🏢 Visualize movement across floors.



🔐 Authentication & Security

👤 User registration and login.
🍪 Session-based authentication.
🛡️ Protected dashboard and map editor.
🔒 Ownership-based authorization.
🌍 Public and private map visibility.



🖥️ A Look Inside UniversalNav

  📸 Screenshots coming soon — replace these placeholders with actual application screenshots.




🏠 Dashboard
🎨 Interactive Map Editor












🧭 Public Navigation
📱 Mobile Experience










🛠️ Technology Stack
🎨 Frontend

⚛️ React.js
⚡ Vite
🎨 CSS & Bootstrap
🔌 Axios

⚙️ Backend

🟢 Node.js
🚂 Express.js
🔗 REST APIs

🗄️ Database & Authentication

🍃 MongoDB
🧩 Mongoose
🔐 Express Sessions & Cookies

🧠 Algorithms & Deployment

📊 Dijkstra's Shortest Path Algorithm
☁️ Vercel
🚀 Render


🏗️ System Architecture
                 👤 USER
                    |
          +---------+---------+
          |                   |
      🏠 Dashboard       🧭 Public Navigation
          |                   |
          +---------+---------+
                    |
             ⚛️ React + Vite
                    |
               🔌 REST APIs
                    |
           ⚙️ Node.js + Express
                    |
          +---------+---------+
          |                   |
      🔐 Authentication    🧠 Controllers
          |                   |
          +---------+---------+
                    |
               🧩 Mongoose
                    |
                🍃 MongoDB


🧠 How Does Navigation Work?
UniversalNav models indoor spaces using a graph-based approach.



Component
Description




🔵 Nodes
Rooms, corridors, entrances, stairs, elevators


🔗 Edges
Connections between navigation points


⚖️ Weights
Distance or cost associated with connections


🧠 Algorithm
Dijkstra's Shortest Path Algorithm



🔍 Navigation Flow

📍 Select your starting location.
🎯 Choose your destination.
🧠 The navigation engine processes the map graph.
🔀 The system calculates a suitable route.
👣 Follow step-by-step directions.

Additional routing logic considers floor transitions, blocked paths, and accessibility preferences.

📁 Project Structure
UniversalNav/
│
├── 🎨 frontend/
│   ├── public/
│   └── src/
│       ├── components/
│       ├── context/
│       ├── pages/
│       │   ├── Dashboard.jsx
│       │   ├── MapEditor.jsx
│       │   ├── PublicNavigation.jsx
│       │   ├── Login.jsx
│       │   └── Signup.jsx
│       ├── services/
│       ├── utils/
│       └── App.jsx
│
├── ⚙️ backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   └── server.js
│
└── 📄 README.md


🚀 Getting Started
📋 Prerequisites
Make sure you have:

🟢 Node.js
📦 npm
🍃 MongoDB Atlas or local MongoDB
🐙 Git

1️⃣ Clone the Repository
git clone https://github.com/PlyushRajAnand/UniversalNav.git
cd UniversalNav

2️⃣ Backend Setup
cd backend
npm install

Create a .env file inside the backend directory:
PORT=5000
NODE_ENV=development

MONGO_URI=your_mongodb_connection_string
SESSION_SECRET=your_session_secret

FRONTEND_URL=http://localhost:5173

Start the backend:
npm run dev

3️⃣ Frontend Setup
Open another terminal:
cd frontend
npm install

Create a .env file inside the frontend directory:
VITE_API_URL=http://localhost:5000

Start the frontend:
npm run dev

4️⃣ Open UniversalNav



Service
Local URL




🎨 Frontend
http://localhost:5173


⚙️ Backend
http://localhost:5000




🏥 Real-World Use Cases



Industry
Potential Application




🏥 Healthcare
Finding departments, wards, and emergency exits


🎓 Education
Navigating classrooms, labs, and lecture halls


🏢 Corporate
Finding offices, meeting rooms, and facilities


🛍️ Shopping
Locating stores and amenities


✈️ Airports
Finding gates and terminal facilities


🏛️ Public Buildings
Helping visitors locate specific rooms




🔮 What's Next?
Some ideas for future development:

📡 Real-time indoor positioning.
📍 Live location tracking.
🗺️ Advanced map import and editing.
⚡ Improved route optimization.
♿ More detailed accessibility preferences.
📊 Navigation analytics.
🔌 Indoor positioning technology integrations.


📚 Key Learnings
Building UniversalNav gave me practical experience with:

⚛️ Full-stack application development.
🔌 REST API design and integration.
🗄️ MongoDB database design.
🔐 Authentication and authorization.
🧠 Graph algorithms and Dijkstra's algorithm.
🏢 Multi-floor navigation logic.
♿ Accessibility-aware routing.
🚀 Deployment and production configuration.


👨‍💻 Meet the Developer

  

Piyush Raj Anand

  🎓 Computer Science Student | 💻 Full-Stack Developer | 🚀 Problem Solver


  🐙 GitHub •
  💼 LinkedIn



  🌟 If you find UniversalNav interesting, consider giving this repository a star!


  Built with ❤️, ☕ and countless debugging sessions.


  🧭 UniversalNav — Navigate Beyond the Building Entrance.

