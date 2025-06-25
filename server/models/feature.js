const mongoose = require('mongoose');

const FeatureSchema = new mongoose.Schema({
    mediaType: {
        type: String,
        enum: ['image', 'video'],
        required: true,
        default: 'image'
    },
    mediaUrl: {
        type: String,
        required: true
    },
    // Keep image field for backwards compatibility
    image: String,
    title: {
        type: String,
        default: ''
    },
    description: {
        type: String,
        default: ''
    },
    isActive: {
        type: Boolean,
        default: true
    },
    position: {
        type: Number,
        default: 0
    }
}, {timestamps: true});

module.exports = mongoose.model('Feature', FeatureSchema);