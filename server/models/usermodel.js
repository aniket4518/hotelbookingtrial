const mongoose = require('mongoose');
const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: { 
        type: String, 
        required: true
    },
    llmResponse: {
        type: Object,
        default: null
    },
  
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });
const User = mongoose.model('User', UserSchema);
module.exports = User;