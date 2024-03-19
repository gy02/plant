const mongoose = require('mongoose');

const PlantSchema = new mongoose.Schema({
    id:{
        type: String,
        unique: true,
        required: true,
    },
    nickname: {
        type: String,
        required: true,
    },
    plant: {
        type: String,
        required: true,
    }
});

module.exports = mongoose.model('Plant', PlantSchema);