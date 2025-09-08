const express = require('express');
const router = express.Router();
const { registerUser, loginUser } = require('../controllers/authController');
const { getClients, getProject, updateProject } = require('../controllers/projectController');
const { protect } = require('../middleware/authMiddleware');
const Client = require('../models/clientModel');
const Project = require('../models/projectModel');

// Auth Routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// Data Routes (Protected)
router.get('/clients', protect, getClients);
router.get('/clients/:clientId/project', protect, getProject);
router.post('/projects/:projectId', protect, updateProject);

// --- ONE-TIME SEED ROUTE ---
router.get('/seed', async (req, res) => {
    try {
        await Project.deleteMany({});
        await Client.deleteMany({});

        const projectData = {
            name: "Midnight Frequencies",
            scope: { html: true, css: true, js: false },
            html: {
                projectFoundation: ["References Collected", "Project/Assignment Clarity", "Understand Flow/Process", "Core Creative Purpose Defined"].map(name => ({ name })),
                instrumentalProgress: ["Main Instrumental Complete", "Arrangement Finalized", "Sound Design Elements", "Transitions & Builds"].map(name => ({ name })),
                vocalProduction: ["Lead Vocal Recording", "Harmony Layers", "Vocal Arrangement", "Vocal Effects & Processing"].map(name => ({ name })),
                mixAndMaster: ["Rough Mix Complete", "Final Mix Approved", "Master Reference Check", "Final Master Delivery"].map(name => ({ name })),
                documentation: ["Session 1 Notes Complete", "Creative Direction Document"].map(name => ({ name })),
                tracks: [{ trackNumber: 1 }, { trackNumber: 2 }, { trackNumber: 3 }]
            },
            css: {
                visualIdentity: ["Color Palette Finalized", "Typography Selection", "Logo/Brand Mark", "Visual Style Guide"].map(name => ({ name })),
                albumArtwork: ["Cover Art Concept", "Cover Art Execution", "Individual Track Art", "Alternative Formats"].map(name => ({ name })),
                promotionalMaterials: ["Social Media Templates", "Press Photos/Imagery", "Merchandise Designs", "Website/EPK Materials"].map(name => ({ name })),
                visualConsistency: ["Brand Guidelines Document", "Asset Library Organization", "Usage Rights Documentation", "Final Asset Package"].map(name => ({ name })),
            },
            js: {
                marketStrategy: ["Target Audience Defined", "Platform Strategy", "Release Timeline", "Marketing Budget Plan"].map(name => ({ name })),
                distributionSetup: ["Distributor Selection", "Metadata Preparation", "ISRC/UPC Codes", "Release Scheduling"].map(name => ({ name })),
                socialMedia: ["Platform Optimization", "Content Calendar", "Engagement Strategy", "Analytics Setup"].map(name => ({ name })),
                performanceTracking: ["Streaming Analytics", "Revenue Tracking", "Audience Insights", "Performance Reports"].map(name => ({ name })),
                monetization: ["Streaming Optimization", "Sync Licensing Prep", "Merchandise Strategy", "Revenue Diversification"].map(name => ({ name })),
            }
        };

        const newProject = await Project.create(projectData);

        const newClient = new Client({
            name: "Jordan Smith",
            email: "jordan.smith@example.com",
            password: "password123", // This should be hashed in a real scenario, but is ok for seeding.
            project: newProject._id,
            status: "PAYMENT DUE",
            isAdmin: false
        });

        await newClient.save();

        res.status(201).json({ message: "Database seeded successfully with a sample client and project." });

    } catch (err) {
        res.status(500).json({ message: "Seed failed: " + err.message });
    }
});

module.exports = router;

