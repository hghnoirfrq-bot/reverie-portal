const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const messageSchema = new Schema({
    sender: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
    receiver: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
    content: { type: String, required: true },
    read: { type: Boolean, default: false }
}, { timestamps: true });

const Message = mongoose.model('Message', messageSchema);
module.exports = Message;