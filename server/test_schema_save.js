import axios from 'axios';
import FormData from 'form-data';
import mongoose from 'mongoose';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = 'http://localhost:5000';

async function runTest() {
    try {
        console.log("1. Connecting to DB to get a user...");
        await mongoose.connect(process.env.MONGO_URI);
        
        // Find the editor user
        const user = await User.findOne({ email: 'kyc4@gmail.com' }); // Using the email from the screenshot
        if (!user) {
            console.error("User kyc4@gmail.com not found!");
            process.exit(1);
        }
        
        // Generate a test token (mocking login or just using a secret if I could, but authenticating is easier)
        // Actually, to use the API we need a token. 
        // Let's assume we can login or just use a simpler route if available?
        // No, /submit-kyc is protected.
        // Let's try to login as this user. I don't know the password.
        // ALTERNATIVE: I will manually update the user in DB to verify Schema works, 
        // AND I will use a mock request object in a unit test style script? Codebase is running, so integration test is better.
        
        // Let's try to login with a known user or create one?
        // Too complex.
        
        // Let's look at the controller code again carefully.
        // It's faster to audit `server/controllers/kycController.js` and `frontend/src/pages/KYCDetailsPage.jsx` closely.
        
        console.log("Skipping API call, verifying DB schema directly...");
        
        // Test direct DB save
        user.bankDetails = {
            ...user.bankDetails,
            address: {
                street: "123 Test St",
                city: "Test City",
                state: "Test State",
                postalCode: "123456",
                country: "IN"
            },
            gstin: "TESTGSTIN123"
        };
        
        await user.save();
        console.log("Direct DB Save Successful. Data:", user.bankDetails);
        
        // If this works, the Schema is fine. The issue is likely the Controller not receiving data or Frontend not sending it.
        
        process.exit(0);

    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

runTest();
