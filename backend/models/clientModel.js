const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const clientSchema = new Schema({
   name: { type: String, required: true },
   email: { type: String, required: true, unique: true },
   password: { type: String, required: true },
   isAdmin: { type: Boolean, default: false },
   project: { type: Schema.Types.ObjectId, ref: 'Project' },
   status: { type: String, enum: ['ACTIVE', 'PAYMENT DUE', 'OVERDUE', 'INACTIVE'], default: 'ACTIVE' }
}, { timestamps: true });

const Client = mongoose.model('Client', clientSchema);
module.exports = Client;