# TripJoy Ride - Ride Booking Website
A full-stack ride booking platform supporting cab, train, bus, and flight bookings.

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

------------------------------------------------------------------------------------------------------------------------

**Project Structure**
public/ – Frontend HTML, CSS, JS files
server.js – Node.js backend
models/ – Mongoose schemas for rides, users, and bookings
routes/ – API routes for booking, login, admin, etc.

**Notes:**
The site requires login for pre-booking features like train, bus, and flight.
Instant cab booking works without login.
