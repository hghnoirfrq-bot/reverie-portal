const express = require('express');
const router = express.Router();
const Client = require('../models/clientModel');
const Project = require('../models/projectModel');
const Message = require('../models/messageModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { protect } = require('../middleware/authMiddleware');

const generateToken = (id, isAdmin) => {
   return jwt.sign({ id, isAdmin }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// --- AUTH ROUTES ---
router.post('/register', async (req, res) => {
   const { name, email, password } = req.body;
   if (!name || !email || !password) return res.status(400).json({ message: 'Please add all fields' });
   
   const userExists = await Client.findOne({ email });
   if (userExists) return res.status(400).json({ message: 'User with this email already exists.' });
   
   const salt = await bcrypt.genSalt(10);
   const hashedPassword = await bcrypt.hash(password, salt);
   
   const userCount = await Client.countDocuments({});
   const isAdmin = userCount === 0;
  
   const user = await Client.create({ name, email, password: hashedPassword, isAdmin });
   if (user) {
       res.status(201).json({ message: 'Registration successful' });
   } else {
       res.status(400).json({ message: 'Invalid user data' });
   }
});

router.post('/login', async (req, res) => {
   const { email, password } = req.body;
   const user = await Client.findOne({ email });

   if (user && (await bcrypt.compare(password, user.password))) {
       res.json({ token: generateToken(user._id, user.isAdmin), isAdmin: user.isAdmin });
   } else {
       res.status(400).json({ message: 'Invalid credentials' });
   }
});

// --- DATA ROUTES ---
router.get('/clients', protect, async (req, res) => {
   const clients = await Client.find({ isAdmin: false }).select('name status project').populate('project', 'name');
   res.json(clients);
});

router.get('/clients/:clientId/project', protect, async (req, res) => {
   const client = await Client.findById(req.params.clientId).populate('project');
   if (!client || !client.project) return res.status(404).json({ message: 'Project not found' });
   res.json(client.project);
});

router.post('/projects/:projectId', protect, async (req, res) => {
   const project = await Project.findById(req.params.projectId);
   if (!project) return res.status(404).json({ message: 'Project not found' });
   project.set(req.body);
   const updatedProject = await project.save();
   res.json(updatedProject);
});

// --- MESSAGING ROUTES ---
router.post('/messages', protect, async (req, res) => {
    const { receiverId, content } = req.body;
    const senderId = req.user._id;

    if (!receiverId || !content) {
        return res.status(400).json({ message: 'Missing receiver or content' });
    }

    try {
        const message = await Message.create({
            sender: senderId,
            receiver: receiverId,
            content: content
        });
        res.status(201).json(message);
    } catch (error) {
        res.status(500).json({ message: 'Server error sending message' });
    }
});

router.get('/messages/:clientId', protect, async (req, res) => {
    const adminId = req.user._id;
    const clientId = req.params.clientId;

    try {
        const messages = await Message.find({
            $or: [
                { sender: adminId, receiver: clientId },
                { sender: clientId, receiver: adminId }
            ]
        }).sort({ createdAt: 1 });
        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching messages' });
    }
});

router.get('/messages', protect, async (req, res) => {
    if (req.user.isAdmin) {
        return res.status(403).json({ message: 'Admins should use /api/messages/:clientId' });
    }
    const clientId = req.user._id;

    try {
        const admin = await Client.findOne({ isAdmin: true });
        if (!admin) return res.status(404).json({ message: 'Admin account not found' });
        
        const messages = await Message.find({
            $or: [
                { sender: admin._id, receiver: clientId },
                { sender: clientId, receiver: admin._id }
            ]
        }).sort({ createdAt: 1 });

        res.json({ messages, adminId: admin._id });
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching messages' });
    }
});

// --- SEED ROUTE ---
router.get('/seed', async (req, res) => {
   await Project.deleteMany({});
   await Client.deleteMany({});
   res.status(200).send("Database cleared. You can now register the first user as admin.");
});

module.exports = router;