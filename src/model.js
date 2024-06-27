const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    chatId: { type: String, required: true },
    name: { type: String, required: false },
    contact: { type: Object, required: false },
    location: { type: Object, required: false },
    problems: { type: [String], required: false, default: [] }, // Shikoyatlar uchun array
    isAdmin: { type: Boolean, default: false }, // Admin flagi
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
