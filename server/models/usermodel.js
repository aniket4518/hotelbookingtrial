const mongoose = require('mongoose');
const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    mobile:{
        type:Number,
        required:true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    adress:{
        type:String,
        required:true
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