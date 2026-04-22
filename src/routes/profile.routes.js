import express from 'express';
import { createProfile, deleteProfile, getProfiles, getProfileById, searchProfiles } from '../controllers/profile.controller.js';

const router = express.Router();

router.post('/profiles', createProfile);
router.get('/profiles/search', searchProfiles);
router.get('/profiles/:id', getProfileById);
router.get('/profiles', getProfiles);
router.delete('/profiles/:id', deleteProfile);

export default router;