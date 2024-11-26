const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = 5000;

// Middleware
app.use(bodyParser.json());
app.use(cors());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));

// Data Schema
const dataSchema = new mongoose.Schema({
    name: String,
    address: String,
    phone: String,
});

const Data = mongoose.model('Data', dataSchema);

// Route to fetch paginated data
app.get('/data', async (req, res) => {
    const page = parseInt(req.query.page) || 1;
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
        res.status(500).json({ message: 'MongoDB is not connected' });
    }
});

// Route to save data
app.post('/data', async (req, res) => {
    const { name, address, phone } = req.body;

    const newData = new Data({
        name,
        address,
        phone,
    });

    try {
        await newData.save();
        res.status(201).json(newData);
    } catch (err) {
        res.status(500).json({ message: 'Failed to save data' });
    }
});

app.listen(port, () => {
    console.log(`Backend running on http://localhost:${port}`);
});
