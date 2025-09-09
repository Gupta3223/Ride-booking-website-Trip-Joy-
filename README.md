# TripJoy Ride - Ride Booking Website
# 🚖 TripJoy Ride

TripJoy Ride is a **ride booking web application** that allows users to book **Trains, Buses, Flights, and Cabs** easily.  
It includes **user login/registration**, **admin panel for data management**, and supports **MongoDB for backend storage**.

## ✨ Features

### 👤 User Side
- User Registration & Login (with session handling)
- Train, Bus, Flight, and Cab Booking
- Dynamic seat selection (Bus/Train layout)
- Flight passenger details & e-ticket generation
- Cab booking with live map (Leaflet.js + Nominatim)
- Payment simulation page
- Booking History with option to cancel rides
- E-ticket generation for Flights, Trains, Buses, and Cabs

### 🛠️ Admin Panel
- Admin login (secured with session)
- Add, update, and delete:
  - 🚆 Trains  
  - 🚌 Buses  
  - ✈️ Flights  
  - 🚖 Cab Drivers  
- Manage cancellations (accept/reject requests)
- Prevents accidental deletions with confirmation
- Clean, searchable list for each booking type

## 🏗️ Tech Stack

**Frontend**
- HTML, CSS, JavaScript
- Tailwind / custom CSS for UI
- Leaflet.js for live map and routing

**Backend**
- Node.js
- Express.js
- MongoDB with Mongoose

**Other**
- Session-based authentication
- REST API for bookings & admin actions
- GitHub for version control

## 📂 Project Structure
**Project Structure**
public/ – Frontend HTML, CSS, JS files
server.js – Node.js backend
models/ – Mongoose schemas for rides, users, and bookings
routes/ – API routes for booking, login, admin, etc.

**Notes:**
The site requires login for pre-booking features like train, bus, and flight.
Instant cab booking works without login.

---

## ⚙️ Installation & Setup
1. **Clone the repository**
   ```bash
   git clone https://github.com/Gupta3223/Ride-booking-website-Trip-Joy-.git
   cd Ride-booking-website-Trip-Joy-

2. Install dependencies
npm install

3. Setup MongoDB
Make sure MongoDB is running locally or use a MongoDB Atlas connection string.
Update your server.js file with the MongoDB URI:
const mongoURI = "YOUR_MONGODB_URI_HERE";
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });


4. Run the project
node server.js

Or with nodemon (if installed):
npx nodemon server.js


5. Open in browser
Navigate to:
http://localhost:5000
