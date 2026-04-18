import Profile from "../models/profile.model.js";
import classifyGender from "../services/gender.service.js";
import getAge from "../services/age.service.js";
import getNationality from "../services/nationality.service.js";
import generateUUID from "../utils/generateUUID.js";
import genderFormat from "../utils/genderFormat.js";
import classifyAgeGroup from "../utils/classifyAge.js";
import selectCountry from "../utils/selectCountry.js";

const createProfile = async (req, res) => {
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({ status: "error", message: "Name is required" });
    }

    if (typeof name !== 'string') {
        return res.status(422).json({ status: "error", message: "Invalid type" });
    }

    const nameLowerCase = name.toLowerCase().trim();
    try {
        const existingProfile = await Profile.findOne({ name: nameLowerCase });
        if (existingProfile) {
            return res.status(200).json({
                status: "success",
                message: "Profile already exists",
                data: existingProfile.toObject()
            });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: "error", message: "Internal server error" });
    }

    try {
        let genderData, ageData, nationalityData;
        
        try {
            genderData = await classifyGender(nameLowerCase);
        } catch (error) {
            return res.status(502).json({ status: "error", message: "Genderize returned an invalid response" });
        }

        try {
            ageData = await getAge(nameLowerCase);
        } catch (error) {
            return res.status(502).json({ status: "error", message: "Agify returned an invalid response" });
        }

        try {
            nationalityData = await getNationality(nameLowerCase);
        } catch (error) {
            return res.status(502).json({ status: "error", message: "Nationalize returned an invalid response" });
        }

        if (!genderData || !genderData.gender || genderData.count === 0 || genderData.count === null) {
            return res.status(502).json({ status: "error", message: "Genderize returned an invalid response" });
        }

        if (!ageData || ageData.age === null || ageData.age === undefined) {
            return res.status(502).json({ status: "error", message: "Agify returned an invalid response" });
        }

        if (!nationalityData || !nationalityData.country || nationalityData.country.length === 0) {
            return res.status(502).json({ status: "error", message: "Nationalize returned an invalid response" });
        }

        const formattedGenderData = genderFormat(genderData);
        const ageGroup = classifyAgeGroup(ageData.age);
        const country = selectCountry(nationalityData);

        if (!formattedGenderData || !ageGroup || !country) {
            return res.status(502).json({ status: "error", message: "Failed to process demographic data" });
        }

        const profileData = new Profile({
            id: generateUUID(),
            name: nameLowerCase,
            gender: formattedGenderData.gender.toLowerCase(),
            gender_probability: formattedGenderData.gender_probability,
            sample_size: formattedGenderData.sample_size,
            age: ageData.age,
            age_group: ageGroup.toLowerCase(),
            country_id: country.country_id.toUpperCase(),
            country_probability: country.country_probability,
            created_at: new Date().toISOString()
        });

        const savedProfile = await profileData.save();
        return res.status(201).json({
            status: "success",
            data: savedProfile.toObject()
        });
    } catch (error) {
        console.error("Error creating profile:", error.message);
        return res.status(500).json({ status: "error", message: "Internal server error" });
    }
};

const getProfileById = async (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ status: "error", message: "ID is required" });
    }

    try {
        const profile = await Profile.findById(id);
        if (!profile) {
            return res.status(404).json({ status: "error", message: "Profile not found" });
        }
        return res.status(200).json({
            status: "success",
            data: profile.toObject()
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: "error", message: "Internal server error" });
    }
};

const getProfiles = async (req, res) => {
    const { gender, age_group, country_id } = req.query;

    try {
        const filter = {};
        if (gender) filter.gender = gender.toLowerCase();
        if (age_group) filter.age_group = age_group.toLowerCase();
        if (country_id) filter.country_id = country_id.toUpperCase();

        const profiles = await Profile.find(filter);
        
        return res.status(200).json({
            status: "success",
            count: profiles.length,
            data: profiles.map(p => ({
                id: p.id,
                name: p.name,
                gender: p.gender,
                age: p.age,
                age_group: p.age_group,
                country_id: p.country_id
            }))
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: "error", message: "Internal server error" });
    }
};

const deleteProfile = async (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ status: "error", message: "ID is required" });
    }

    try {
        const profile = await Profile.findByIdAndDelete(id);
        if (!profile) {
            return res.status(404).json({ status: "error", message: "Profile not found" });
        }
        return res.status(204).send();
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: "error", message: "Internal server error" });
    }
};











export { createProfile, getProfileById, getProfiles, deleteProfile };