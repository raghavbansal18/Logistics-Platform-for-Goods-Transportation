// public/client.js

const socket = io();

// Handle Booking Button Click
document.getElementById('bookBtn').addEventListener('click', () => {
    const userId = document.getElementById('userId').value.trim();
    const pickup = parseInt(document.getElementById('pickup').value);
    const dropoff = parseInt(document.getElementById('dropoff').value);
    const vehicleType = document.getElementById('vehicleType').value;

    if (userId && !isNaN(pickup) && !isNaN(dropoff)) {
        fetch('/api/book', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, pickup, dropoff, vehicleType })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                document.getElementById('bookingStatus').innerHTML = `
                    <p><strong>Booking ID:</strong> ${data.booking.id}</p>
                    <p><strong>Status:</strong> ${data.booking.status}</p>
                    <p><strong>Estimated Cost:</strong> $${data.booking.estimatedCost}</p>
                `;
            } else {
                alert('Failed to create booking.');
            }
        });
    } else {
        alert('Please fill all fields correctly.');
    }
});

// Register user with Socket.IO when User ID input loses focus
const userIdInput = document.getElementById('userId');
userIdInput.addEventListener('blur', () => {
    const userId = userIdInput.value.trim();
    if (userId) {
        socket.emit('registerUser', userId);
    }
});

// Listen for booking acceptance
socket.on('bookingAccepted', (booking) => {
    document.getElementById('bookingStatus').innerHTML = `
        <p><strong>Booking ID:</strong> ${booking.id}</p>
        <p><strong>Status:</strong> ${booking.status}</p>
        <p><strong>Driver Assigned:</strong> ${booking.driverId}</p>
    `;
});

// Listen for status updates
socket.on('statusUpdate', (data) => {
    document.getElementById('driverLocation').innerHTML = `
        <p><strong>Booking ID:</strong> ${data.bookingId}</p>
        <p><strong>Status:</strong> ${data.status}</p>
        <p><strong>Driver Location:</strong> ${data.location}</p>
    `;
});
