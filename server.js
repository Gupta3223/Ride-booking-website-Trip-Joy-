// ✅ server.js
const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const cors = require("cors");
const session = require("express-session");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");

const app = express();
const PORT = 5000;

app.use(express.static(path.join(__dirname, "public")));

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(bodyParser.json());
app.use(session({
    secret: "tripjoySecret123",
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        maxAge: 1000 * 60 * 60 * 24
    }
}));

// MongoDB Compass connection
mongoose.connect("mongodb://127.0.0.1:27017/tripjoy", {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Schemas
const bookingSchema = new mongoose.Schema({
    type: String, // 'train', 'bus', 'cab', 'flight'
    details: Object,
    status: { type: String, default: "confirmed" }, // ✅ new field
    dateBooked: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    email: { type: String, unique: true },
    gender: String,
    dob: String,
    password: String,
    bookingHistory: [bookingSchema]
});
const User = mongoose.model("User", userSchema);

const trainSchema = new mongoose.Schema({
    from: String,
    to: String,
    type: String,
    trainName: String,
    trainNumber: String,
    departureTime: String,
    arrivalTime: String,
    duration: String,
    classes: mongoose.Schema.Types.Mixed
});
const Train = mongoose.model("Train", trainSchema);

const busSchema = new mongoose.Schema({
    busNumber: String,
    operator: String,
    from: String,
    to: String,
    departureTime: String,
    arrivalTime: String,
    type: String,
    fare: Number,
    seatsAvailable: Number
});
const Bus = mongoose.model("Bus", busSchema);

const flightSchema = new mongoose.Schema({
    flightNumber: String,
    airline: String,
    from: String,
    to: String,
    departureTime: String,
    arrivalTime: String,
    duration: String,
    flightType: String,
    date: String,
    classes: mongoose.Schema.Types.Mixed
});
const Flight = mongoose.model("Flight", flightSchema);

const driverSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  gender: String,
  dob: String,
  email: String,
  phone: String,
  license: String,
  numberPlate: String,  
  type: String          
});
const Driver = mongoose.model("Driver", driverSchema);


// ---------------- Routes ---------------- //

// Register
app.post("/register", async (req, res) => {
    const { firstName, lastName, email, gender, dob, password } = req.body;
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: "User already exists" });

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ firstName, lastName, email, gender, dob, password: hashedPassword });
        await newUser.save();
        res.status(201).json({ message: "User registered successfully" });
    } catch (err) {
        res.status(500).json({ message: "Something went wrong" });
    }
});

// Login
app.post("/login", async (req, res) => {
    const { email, password } = req.body;
    console.log("📥 Login request body:", req.body);

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: "User not found" });

        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) return res.status(400).json({ message: "Invalid credentials" });

        req.session.user = {
            email: user.email,
            firstName: user.firstName
        };

        res.status(200).json({ message: `Welcome ${user.firstName}!`, user: req.session.user });
    } catch (err) {
        console.error("❌ Login error:", err);
        res.status(500).json({ message: "Something went wrong" });
    }
});

// Logout
app.post("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) return res.status(500).json({ message: "Logout failed" });
        res.clearCookie("connect.sid", { path: "/" });
        res.status(200).json({ message: "Logged out successfully" });
    });
});

// Auth Check
app.get("/check-auth", (req, res) => {
    if (req.session.user) {
        res.json({ isLoggedIn: true, user: req.session.user });
    } else {
        res.json({ isLoggedIn: false });
    }
});

// Get Booking History
app.get("/booking-history", async (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: "Not logged in" });

    try {
        const user = await User.findOne({ email: req.session.user.email }).select("bookingHistory");
        res.json({ history: user.bookingHistory || [] });
    } catch (err) {
        console.error("❌ Fetch history error:", err);
        res.status(500).json({ error: "Failed to fetch booking history" });
    }
});

// Train Search
app.get("/search-trains", async (req, res) => {
    const { from, to, class: travelClass } = req.query;

    try {
        const trains = await Train.find({
            from: { $regex: new RegExp(from, "i") },
            to: { $regex: new RegExp(to, "i") },
            [`classes.${travelClass.toUpperCase()}`]: { $exists: true }
        });

        res.json(trains);
    } catch (error) {
        res.status(500).json({ message: "Failed to search trains" });
    }
});

// Bus Search
app.post("/api/buses/search", async (req, res) => {
    const { from, to } = req.body;

    try {
        const buses = await Bus.find({
            from: { $regex: new RegExp(from, "i") },
            to: { $regex: new RegExp(to, "i") }
        });
        res.json(buses);
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

// Flight Search
app.get('/api/flights', async (req, res) => {
    const { from, to, userDate } = req.query;

    try {
        const flights = await Flight.find({
            from: { $regex: from, $options: 'i' },
            to: { $regex: to, $options: 'i' }
        }).lean();

        const results = flights.map(flight => ({
            ...flight,
            userDate
        }));

        res.json(results);
    } catch (error) {
        res.status(500).json({ error: 'Flight search failed.' });
    }
});

// API: Get driver by cab type (flat schema)
app.get("/api/driver/:type", async (req, res) => {
  try {
    const cabType = req.params.type.toLowerCase();
    const drivers = await Driver.find({ type: cabType }); // <-- flat schema

    if (drivers.length === 0) {
      return res.status(404).json({ message: "No drivers found for this cab type" });
    }

    const driver = drivers[Math.floor(Math.random() * drivers.length)];
    res.json(driver);
  } catch (error) {
    res.status(500).json({ message: "Error fetching driver", error });
  }
});

//save history
// Save booking history
app.post('/save-booking-history', async (req, res) => {
  if (!req.session.user) return res.status(401).json({ message: 'Not logged in' });

  const { type, details } = req.body;

  try {
    await User.findOneAndUpdate(
      { email: req.session.user.email },
      {
        $push: {
          bookingHistory: {
            type,
            details,
            status: "confirmed",   // ✅ always start as confirmed
            dateBooked: new Date()
          }
        }
      }
    );
    res.status(200).json({ message: 'Booking saved to history' });
  } catch (err) {
    console.error('❌ Save history error:', err);
    res.status(500).json({ message: 'Failed to save booking history' });
  }
});

// ---------------- Admin Authentication ---------------- //

// Admin login
app.post("/admin-login", (req, res) => {
  const { id, password } = req.body;

  // ✅ Hardcoded admin credentials (match your admin.html form)
  if (id === "IMADTJ" && password === "admintj") {
    req.session.user = {
      id,
      role: "admin",
      name: "ADMIN"
    };
    return res.json({ message: "Admin logged in successfully", user: req.session.user });
  }

  return res.status(401).json({ message: "Invalid admin credentials" });
});

// Admin check middleware
function isAdmin(req) {
  return req.session.user && req.session.user.role === "admin";
}

// Get all trains (for admin panel)
app.get("/admin/all-trains", async (req, res) => {
    try {
        const trains = await Train.find({});
        res.json(trains);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch train data" });
    }
});

// Add new Train
app.post("/admin/add-train", async (req, res) => {
    if (!isAdmin(req)) return res.status(403).json({ message: "Unauthorized" });

    try {
        const newTrain = new Train(req.body);
        await newTrain.save();
        res.status(201).json({ message: "Train added successfully", train: newTrain });
    } catch (err) {
        console.error("❌ Add train error:", err);
        res.status(500).json({ message: "Failed to add train" });
    }
});

// Get all buses (for admin panel)
app.get("/admin/all-buses", async (req, res) => {
    try {
        const buses = await Bus.find({});
        res.json(buses);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch bus data" });
    }
});

// Add new Bus
app.post("/admin/add-bus", async (req, res) => {
    if (!isAdmin(req)) return res.status(403).json({ message: "Unauthorized" });
    try {
        const newBus = new Bus(req.body);
        await newBus.save();
        res.status(201).json({ message: "Bus added successfully", bus: newBus });
    } catch (err) {
        res.status(500).json({ message: "Failed to add bus" });
    }
});

// Get all flights (for admin panel)
app.get("/admin/all-flights", async (req, res) => {
    try {
        const flights = await Flight.find({});
        res.json(flights);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch flight data" });
    }
});

// Add new Flight
app.post("/admin/add-flight", async (req, res) => {
    if (!isAdmin(req)) return res.status(403).json({ message: "Unauthorized" });
    try {
        const newFlight = new Flight(req.body);
        await newFlight.save();
        res.status(201).json({ message: "Flight added successfully", flight: newFlight });
    } catch (err) {
        res.status(500).json({ message: "Failed to add flight" });
    }
});

// Get all drivers (for admin panel)
app.get("/admin/all-drivers", async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ message: "Unauthorized" });
  try {
    const drivers = await Driver.find({});
    res.json(drivers);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch drivers" });
  }
});

// Add new Driver
app.post("/admin/add-cab", async (req, res) => {
    if (!isAdmin(req)) return res.status(403).json({ message: "Unauthorized" });
    try {
        const newDriver = new Driver(req.body);
        await newDriver.save();
        res.status(201).json({ message: "Driver added successfully", driver: newDriver });
    } catch (err) {
        res.status(500).json({ message: "Failed to add driver" });
    }
});

// ✏️ PATCH route for updating train fields
app.patch('/admin/update-train/:id', async (req, res) => {
    if (!isAdmin(req)) return res.status(403).json({ message: "Unauthorized" });

    const { id } = req.params;
    const updates = req.body;

    // ✅ Fix: Parse `classes` if it's a string
    if (typeof updates.classes === 'string') {
        try {
            updates.classes = JSON.parse(updates.classes);
        } catch (error) {
            return res.status(400).json({ message: "Invalid JSON format in classes field" });
        }
    }

    try {
        await Train.updateOne({ _id: id }, { $set: updates });
        res.json({ message: "Train updated successfully" });
    } catch (err) {
        console.error("Train update error:", err);
        res.status(500).json({ message: "Failed to update train" });
    }
});

// ✏️ PATCH route for updating bus fields
app.patch('/admin/update-bus/:id', async (req, res) => {
    if (!isAdmin(req)) return res.status(403).json({ message: "Unauthorized" });
    const { id } = req.params;
    const updates = req.body;

    try {
        await Bus.updateOne({ _id: id }, { $set: updates });
        res.json({ message: "Bus updated successfully" });
    } catch (err) {
        console.error("Bus update error:", err);
        res.status(500).json({ message: "Failed to update bus" });
    }
});

// ✏️ PATCH route for updating flight fields
app.patch('/admin/update-flight/:id', async (req, res) => {
    if (!isAdmin(req)) return res.status(403).json({ message: "Unauthorized" });
    const { id } = req.params;
    const updates = req.body;

    try {
        await Flight.updateOne({ _id: id }, { $set: updates });
        res.json({ message: "Flight updated successfully" });
    } catch (err) {
        console.error("Flight update error:", err);
        res.status(500).json({ message: "Failed to update flight" });
    }
});

// Update driver info
app.patch('/admin/update-cab/:id', async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ message: "Unauthorized" });

  const { id } = req.params;
  const updates = req.body;

  try {
    await Driver.updateOne({ _id: id }, { $set: updates });
    res.json({ message: "Driver updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to update driver" });
  }
});

//DELETE ROUTES 
// Delete Train
app.delete('/admin/delete-train/:id', async (req, res) => {
    if (!isAdmin(req)) return res.status(403).json({ message: "Unauthorized" });

    try {
        await Train.deleteOne({ _id: req.params.id });
        res.json({ message: "Train deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: "Failed to delete train" });
    }
});

// Delete Bus
app.delete('/admin/delete-bus/:id', async (req, res) => {
    if (!isAdmin(req)) return res.status(403).json({ message: "Unauthorized" });

    try {
        await Bus.deleteOne({ _id: req.params.id });
        res.json({ message: "Bus deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: "Failed to delete bus" });
    }
});

// Delete Flight
app.delete('/admin/delete-flight/:id', async (req, res) => {
    if (!isAdmin(req)) return res.status(403).json({ message: "Unauthorized" });

    try {
        await Flight.deleteOne({ _id: req.params.id });
        res.json({ message: "Flight deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: "Failed to delete flight" });
    }
});

// Delete Cab / Driver
app.delete('/admin/delete-cab/:id', async (req, res) => {
    if (!isAdmin(req)) return res.status(403).json({ message: "Unauthorized" });

    try {
        await Driver.deleteOne({ _id: req.params.id });
        res.json({ message: "Driver deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: "Failed to delete driver" });
    }
});

// Cancel booking route
app.post('/request-cancellation', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ success: false, message: "Not logged in" });
    }

    const { bookingId } = req.body;
    if (!bookingId) {
      return res.status(400).json({ success: false, message: "Booking ID required" });
    }

    const user = await User.findOneAndUpdate(
      { email: req.session.user.email, "bookingHistory._id": bookingId },
      { $set: { "bookingHistory.$.status": "cancellation_pending" } },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    const updatedBooking = user.bookingHistory.find(b => b._id.toString() === bookingId);

    res.json({ success: true, message: "Cancellation requested", booking: updatedBooking });
  } catch (error) {
    console.error("❌ Error in /request-cancellation:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

// Get all pending cancellations (admin only)
app.get("/admin/cancellations", async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ message: "Unauthorized" });

  try {
    const users = await User.find({ "bookingHistory.status": "cancellation_pending" });
    let cancellations = [];

    users.forEach(user => {
      user.bookingHistory.forEach(b => {
        if (b.status === "cancellation_pending") {
          cancellations.push({
            bookingId: b._id,
            userEmail: user.email,
            type: b.type,
            details: b.details,
            dateBooked: b.dateBooked,
            status: b.status
          });
        }
      });
    });

    res.json(cancellations);
  } catch (err) {
    console.error("❌ Fetch cancellations error:", err);
    res.status(500).json({ message: "Failed to fetch cancellations" });
  }
});

// Accept or reject cancellation
app.post("/admin/cancellations/:bookingId", async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ message: "Unauthorized" });

  const { bookingId } = req.params;
  const { action } = req.body; // "accept" or "reject"

  try {
    const user = await User.findOneAndUpdate(
      { "bookingHistory._id": bookingId },
      {
        $set: {
          "bookingHistory.$.status":
            action === "accept" ? "cancelled" : "cancel_rejected"   // ✅ fixed
        }
      },
      { new: true }
    );

    if (!user) return res.status(404).json({ message: "Booking not found" });

    const updatedBooking = user.bookingHistory.find(b => b._id.toString() === bookingId);
    res.json({ message: "Cancellation updated", booking: updatedBooking });
  } catch (err) {
    console.error("❌ Cancellation update error:", err);
    res.status(500).json({ message: "Failed to update cancellation" });
  }
});

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
