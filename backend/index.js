const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

// Initialize Express app
const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(bodyParser.json());
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*', // Allow specified origins
}));

// MongoDB Connection
if (!process.env.MONGO_URI) {
    console.error('Error: MONGO_URI is not defined in the environment variables.');
    process.exit(1);
}

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('✅ MongoDB connected successfully.'))
    .catch(err => {
        console.error('❌ MongoDB connection error:', err.message);
        process.exit(1); // Exit if unable to connect
    });

// Define Data Schema
const dataSchema = new mongoose.Schema({
    name: { type: String, required: true },
    address: { type: String, required: true },
    phone: { type: String, required: true },
}, { timestamps: true }); // Adds createdAt and updatedAt fields

const Data = mongoose.model('Data', dataSchema);

// API Endpoints

/**
 * Get paginated data
 * Query Params: page (optional, default: 1)
 */
app.get('/data', async (req, res) => {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = 5; // Number of entries per page

    try {
        const data = await Data.find()
            .skip((page - 1) * limit)
            .limit(limit);
        const totalData = await Data.countDocuments();

        res.json({
            data,
            totalPages: Math.ceil(totalData / limit),
            currentPage: page,
        });
    } catch (err) {
        console.error('Error fetching data:', err.message);
        res.status(500).json({ message: 'Error fetching data' });
    }
});

/**
 * Save new data
 * Request Body: { name: String, address: String, phone: String }
 */
app.post('/data', async (req, res) => {
    const { name, address, phone } = req.body;

    if (!name || !address || !phone) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    const newData = new Data({ name, address, phone });

    try {
        await newData.save();
        res.status(201).json(newData);
    } catch (err) {
        console.error('Error saving data:', err.message);
        res.status(500).json({ message: 'Error saving data' });
    }
});

// Handle unmatched routes
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// Start the server
app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Backend running on http://0.0.0.0:${port}`);
});
