import mongoose from 'mongoose';
import dotenv from 'dotenv';
import seedProfiles from './src/utils/seedProfiles.js';

dotenv.config();

const runSeed = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✓ Connected to MongoDB');
        
        // Clear existing profiles
        await mongoose.connection.collection('profiles').deleteMany({});
        console.log('✓ Cleared existing profiles');
        
        // Seed the profiles
        await seedProfiles();
        
        console.log('✓ Seeding completed successfully');
        process.exit(0);
        
    } catch (error) {
        console.error('✗ Seeding failed:', error.message);
        process.exit(1);
    }
};

runSeed();
