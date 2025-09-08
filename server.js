const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); // <-- ADD THIS LINE
require('dotenv').config();
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors()); // <-- ADD THIS LINE
app.use(express.json());

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected successfully.'))
.catch(err => console.error('MongoDB connection error:', err));

app.use('/api', apiRoutes);

app.get('/', (req, res) => {
    res.send('REVERIE Portal Backend is running.');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});