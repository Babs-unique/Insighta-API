import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import generateUUID from './generateUUID.js';
import Profile from '../models/profile.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const seedProfiles = async () => {
    try {
        const seedFilePath = path.join(__dirname, '../../seed_profiles.json');
        const seedData = JSON.parse(fs.readFileSync(seedFilePath, 'utf-8'));
        
        const profilesWithIds = seedData.profiles.map(profile => ({
            ...profile,
            id: generateUUID(),
            sample_size: 100, // Default sample size
            created_at: new Date().toISOString()
        }));
        
        await Profile.insertMany(profilesWithIds);
        console.log(`✓ Seeded ${profilesWithIds.length} profiles successfully`);
        
    } catch (error) {
        console.error('Error seeding profiles:', error);
        throw error;
    }
};

export default seedProfiles;
