const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const touchpointSchema = new Schema({
   name: { type: String, required: true },
   inScope: { type: Boolean, default: true },
   isComplete: { type: Boolean, default: false }
});

const trackSchema = new Schema({
   trackNumber: { type: Number, required: true },
   inScope: { type: Boolean, default: true },
   status: { type: String, enum: ['not-started', 'in-progress', 'complete'], default: 'not-started' }
});

const projectSchema = new Schema({
   name: { type: String, required: true },
   scope: {
       html: { type: Boolean, default: true },
       css: { type: Boolean, default: true },
       js: { type: Boolean, default: true }
   },
   html: {
       projectFoundation: [touchpointSchema],
       instrumentalProgress: [touchpointSchema],
       vocalProduction: [touchpointSchema],
       mixAndMaster: [touchpointSchema],
       documentation: [touchpointSchema],
       tracks: [trackSchema]
   },
   css: {
       visualIdentity: [touchpointSchema],
       albumArtwork: [touchpointSchema],
       promotionalMaterials: [touchpointSchema],
       visualConsistency: [touchpointSchema]
   },
   js: {
       marketStrategy: [touchpointSchema],
       distributionSetup: [touchpointSchema],
       socialMedia: [touchpointSchema],
       performanceTracking: [touchpointSchema],
       monetization: [touchpointSchema]
   }
}, { timestamps: true });

const Project = mongoose.model('Project', projectSchema);
module.exports = Project;