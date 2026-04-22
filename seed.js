import mongoose from 'mongoose';
import dotenv from 'dotenv';
import seedProfiles from './src/utils/seedProfiles.js';
import Profile from './src/models/profile.model.js'

dotenv.config();

const runSeed = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✓ Connected to MongoDB');
        
       /*  await mongoose.connection.collection('profiles').deleteMany({}); */
        await Profile.deleteMany({});
        console.log('✓ Cleared existing profiles');
        
        await seedProfiles();
        
        console.log('✓ Seeding completed successfully');
        process.exit(0);
        
    } catch (error) {
        console.error('✗ Seeding failed:', error.message);
        process.exit(1);
    }
};

runSeed();
