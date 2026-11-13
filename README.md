🧭 UniversalNav — Indoor Navigation Platform

  Navigate beyond the building entrance.
  A full-stack indoor navigation platform for exploring buildings, finding rooms, and navigating across multiple floors.


  🌐 Live Demo •
  🧭 Try Public Navigation •
  📂 GitHub Repository


📌 About the Project
Finding a building is easy. Finding the exact room inside a large building can be challenging.
Hospitals, universities, offices, and other large facilities often have multiple floors, departments, corridors, elevators, and restricted areas. Visitors may struggle to find their destination, especially when they are unfamiliar with the building.
UniversalNav is a full-stack indoor navigation platform designed to make indoor wayfinding easier.
It allows administrators to create and manage interactive building maps, define rooms and connections, and publish maps for visitors. Visitors can access public maps through a link or QR code and find routes to their destinations.
✨ Key Features
🏢 Building & Map Management

Create and manage buildings.
Organize buildings into multiple floors.
Add rooms, halls, corridors, and waypoints.
Create connections between navigation points.
Edit and manage interactive floor maps.

🧭 Intelligent Indoor Navigation

Find routes between rooms and locations.
Multi-floor navigation.
Stairs and elevator route support.
Step-by-step navigation instructions.
Alternative route options.
Route distance and estimated travel information.

♿ Accessibility Support

Accessibility-aware route preferences.
Wheelchair-friendly navigation options.
Options to avoid stairs, elevators, or narrow routes where supported.

🚨 Emergency & Safety

Emergency exit navigation.
Route planning around blocked paths.
Emergency evacuation support.
Alternative route calculation when paths are unavailable.

📱 Public Navigation & QR Codes

Generate QR codes for published maps.
Access public maps without logging in.
Navigate using a mobile device.
Responsive navigation experience.

🎮 Route Simulation

Simulate navigation along a calculated route.
Track route progress.
Visualize movement between navigation points and floors.

🔐 Authentication & Authorization

User registration and login.
Session-based authentication.
Protected dashboard and map editor.
Private and public map access.
Map ownership and authorization checks.

🖥️ Screenshots

Add your actual project screenshots in the screenshots/ folder and update the paths below.




Dashboard
Map Editor












Indoor Navigation
Mobile Navigation









⚙️ Technology Stack



Area
Technologies




Frontend
React.js, Vite, JavaScript


Styling
CSS, Bootstrap


Backend
Node.js, Express.js


Database
MongoDB, Mongoose


Authentication
Express Session, Cookies


API
REST APIs, Axios


Navigation Algorithm
Dijkstra's Shortest Path Algorithm


QR Codes
QR Code Generation


Deployment
Vercel, Render



🏗️ System Architecture
                  USER
                   |
          +--------+--------+
          |                 |
       Dashboard       Public Navigation
          |                 |
          +--------+--------+
                   |
             React + Vite
                   |
              REST APIs
                   |
             Node.js + Express
                   |
          +--------+--------+
          |                 |
      Authentication     Controllers
          |                 |
          +--------+--------+
                   |
              Mongoose
                   |
                MongoDB

How Navigation Works
UniversalNav represents an indoor map as a graph:

Nodes: Rooms, corridors, entrances, stairs, elevators, and other navigation points.
Edges: Connections between nodes.
Weights: Distances or costs associated with connections.

The navigation engine uses Dijkstra's Shortest Path Algorithm to calculate routes through the graph.
Additional routing logic handles floor transitions, blocked paths, and user accessibility preferences.
📁 Project Structure
UniversalNav/
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── MapEditor.jsx
│   │   │   ├── PublicNavigation.jsx
│   │   │   ├── Login.jsx
│   │   │   └── Signup.jsx
│   │   ├── services/
│   │   ├── utils/
│   │   └── App.jsx
│   └── package.json
│
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   ├── server.js
│   └── package.json
│
└── README.md

Folder names may vary depending on the current repository structure.
🚀 Getting Started
Prerequisites
Make sure you have installed:

Node.js
npm
MongoDB Atlas account or a local MongoDB instance
Git

1. Clone the Repository
git clone https://github.com/PlyushRajAnand/UniversalNav.git

cd UniversalNav

2. Set Up the Backend
cd backend
npm install

Create a .env file inside the backend directory:
PORT=5000
NODE_ENV=development

MONGO_URI=your_mongodb_connection_string
SESSION_SECRET=your_session_secret

FRONTEND_URL=http://localhost:5173

Start the backend using the development script defined in backend/package.json:
npm run dev

3. Set Up the Frontend
Open another terminal:
cd frontend
npm install

Create a .env file inside the frontend directory:
VITE_API_URL=http://localhost:5000

Start the frontend:
npm run dev

4. Open the Application
Frontend: http://localhost:5173
Backend:  http://localhost:5000

🧪 Example Use Case
Scenario: Finding a department inside a multi-storey hospital.

An administrator creates a hospital building.
They add floors, rooms, corridors, and navigation points.
They connect the navigation points to define walkable routes.
The administrator publishes the map and generates a QR code.
A visitor scans the QR code.
The visitor selects their current location and destination.
UniversalNav calculates a suitable route, including floor transitions where necessary.

🎯 Real-World Applications
UniversalNav can be adapted for:

🏥 Hospitals and healthcare facilities
🎓 Universities and educational institutions
🏢 Corporate offices
🛍️ Shopping malls
✈️ Airports and transit facilities
🏛️ Large public buildings

🔮 Future Improvements

Real-time indoor positioning.
Live location tracking.
Advanced map import and editing.
Improved route optimization.
More detailed accessibility preferences.
Analytics for navigation usage.
Integration with indoor mapping and positioning technologies.

💡 What I Learned
Building UniversalNav helped me work on practical full-stack engineering challenges, including:

Designing and developing REST APIs.
Building a React-based interactive application.
Managing MongoDB relationships and data.
Implementing session-based authentication.
Designing ownership-based authorization.
Applying graph algorithms to a real-world problem.
Handling multi-floor routing and accessibility requirements.
Connecting and deploying frontend and backend services.

👨‍💻 Author
Piyush Raj Anand
B.Tech Computer Science Student | Full-Stack Developer

GitHub: @PlyushRajAnand



  Built with curiosity, persistence, and a passion for solving real-world problems. 🚀


  ⭐ If you find UniversalNav interesting, consider giving the repository a star!

