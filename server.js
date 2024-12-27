// server.js

const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const PORT = 3000;

// Serve static files from the 'public' directory
app.use(express.static('public'));
app.use(express.json());

// In-memory storage for users, drivers, and bookings
let users = {};
let drivers = {};
let bookings = {};
let bookingIdCounter = 1;

// API endpoint for user booking
app.post('/api/book', (req, res) => {
    const { userId, pickup, dropoff, vehicleType } = req.body;
    const bookingId = bookingIdCounter++;
    const estimatedCost = calculatePrice(pickup, dropoff, vehicleType);

    const booking = {
        id: bookingId,
        userId,
        pickup,
        dropoff,
        vehicleType,
        estimatedCost,
        status: 'Pending',
        driverId: null
    };

    bookings[bookingId] = booking;

    // Notify drivers about new booking
    io.emit('newBooking', booking);

    res.json({ success: true, booking });
});

// API endpoint for driver to accept a booking
app.post('/api/driver/accept', (req, res) => {
    const { driverId, bookingId } = req.body;
    const booking = bookings[bookingId];

    if (booking && booking.status === 'Pending') {
        booking.status = 'Accepted';
        booking.driverId = driverId;
        drivers[driverId].currentBooking = bookingId;

        // Notify the user about the accepted booking
        io.to(`user_${booking.userId}`).emit('bookingAccepted', booking);

        res.json({ success: true, booking });
    } else {
        res.json({ success: false, message: 'Booking not available' });
    }
});

// API endpoint for driver to update status
app.post('/api/driver/status', (req, res) => {
    const { driverId, status, location } = req.body;
    const driver = drivers[driverId];

    if (driver && driver.currentBooking) {
        const booking = bookings[driver.currentBooking];
        booking.status = status;

        // Emit status update to the user
        io.to(`user_${booking.userId}`).emit('statusUpdate', {
            bookingId: booking.id,
            status,
            location
        });

        res.json({ success: true, booking });
    } else {
        res.json({ success: false, message: 'No active booking for driver' });
    }
});

// Helper function to calculate price (simple estimation)
function calculatePrice(pickup, dropoff, vehicleType) {
    // For demo purposes, let's assume each unit distance costs $10
    const distance = Math.abs(dropoff - pickup); // Simplified distance
    let price = distance * 10;

    // Adjust price based on vehicle type
    switch (vehicleType) {
        case 'Small':
            price += 0;
            break;
        case 'Medium':
            price += 20;
            break;
        case 'Large':
            price += 50;
            break;
        default:
            price += 0;
    }

    return price;
}

// Socket.IO connection
io.on('connection', (socket) => {
    console.log('A user connected');

    // Listen for user registration
    socket.on('registerUser', (userId) => {
        socket.join(`user_${userId}`);
        users[userId] = { socketId: socket.id };
        console.log(`User registered: ${userId}`);
    });

    // Listen for driver registration
    socket.on('registerDriver', (driverId) => {
        drivers[driverId] = { socketId: socket.id, currentBooking: null };
        console.log(`Driver registered: ${driverId}`);
    });

    // Handle disconnections
    socket.on('disconnect', () => {
        console.log('A user disconnected');
        // Remove user or driver from in-memory storage if needed
    });
});

// Start the server
http.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
