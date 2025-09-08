const Client = require('../models/clientModel');
const Project = require('../models/projectModel');

// @desc    Get all clients
// @route   GET /api/clients
// @access  Private (Admin)
const getClients = async (req, res) => {
    const clients = await Client.find({ isAdmin: false }).select('name status project').populate('project', 'name');
    res.json(clients);
};

// @desc    Get a client's project
// @route   GET /api/clients/:clientId/project
// @access  Private
const getProject = async (req, res) => {
    const client = await Client.findById(req.params.clientId).populate('project');
    if (!client || !client.project) {
        return res.status(404).json({ message: 'Project not found' });
    }
    res.json(client.project);
};

// @desc    Update a project
// @route   POST /api/projects/:projectId
// @access  Private (Admin)
const updateProject = async (req, res) => {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
        return res.status(404).json({ message: 'Project not found' });
    }
    project.set(req.body);
    const updatedProject = await project.save();
    res.json(updatedProject);
};


module.exports = {
    getClients,
    getProject,
    updateProject,
};