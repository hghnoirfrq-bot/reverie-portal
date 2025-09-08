const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Sub-schema for individual checklist items
const touchpointSchema = new Schema({
    name: { type: String, required: true },
    inScope: { type: Boolean, default: true },
    isComplete: { type: Boolean, default: false }
});

// Sub-schema for individual tracks
const trackSchema = new Schema({
    trackNumber: { type: Number, required: true },
    inScope: { type: Boolean, default: true },
    status: {
        type: String,
        enum: ['not-started', 'in-progress', 'complete'],
        default: 'not-started'
    }
});

// Main project schema
const projectSchema = new Schema({
    name: { type: String, required: true },
    active: { type: Boolean, default: true },
    
    // --- Scope ---
    scope: {
        html: { type: Boolean, default: true },
        css: { type: Boolean, default: true },
        js: { type: Boolean, default: true }
    },

    // --- HTML Phase ---
    html: {
        projectFoundation: [touchpointSchema],
        instrumentalProgress: [touchpointSchema],
        vocalProduction: [touchpointSchema],
        mixAndMaster: [touchpointSchema],
        documentation: [touchpointSchema],
        tracks: [trackSchema]
    },

    // --- CSS Phase ---
    css: {
        visualIdentity: [touchpointSchema],
        albumArtwork: [touchpointSchema],
        promotionalMaterials: [touchpointSchema],
        visualConsistency: [touchpointSchema]
    },

    // --- JS Phase ---
    js: {
        marketStrategy: [touchpointSchema],
        distributionSetup: [touchpointSchema],
        socialMedia: [touchpointSchema],
        performanceTracking: [touchpointSchema],
        monetization: [touchpointSchema]
    }
}, { timestamps: true }); // Adds createdAt and updatedAt timestamps

const Project = mongoose.model('Project', projectSchema);

module.exports = Project;