import mongoose from "mongoose";

const profileSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    gender: {
        type: String,
        required: true
    },
    gender_probability: {
        type: Number,
        required: true
    },
    sample_size: {
        type: Number,
        required: true
    },
    age: {
        type: Number,
        required: true
    },
    age_group: {
        type: String,
        required: true
    },
    country_id:{
        type: String,
        required: true
    },
    country_probability: {
        type: Number,
        required: true
    },
    country_name:{
        type: String,
        required: true
    },
    created_at: {
        type: String,
        required: true
    }
});

export default mongoose.model("Profile", profileSchema);