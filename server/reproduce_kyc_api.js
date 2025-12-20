import axios from 'axios';
import FormData from 'form-data';
import mongoose from 'mongoose';
import User from './models/User.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = 'http://localhost:5000/api/profile/submit-kyc';

async function runTest() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const user = await User.findOne({ email: 'kyc4@gmail.com' });
        if (!user) throw new Error("User not found");

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
        console.log("Generated Token for user:", user._id);

        const form = new FormData();
        form.append('accountHolderName', 'Test User');
        form.append('accountNumber', '1234567890');
        form.append('ifscCode', 'SBIN0001234');
        form.append('panNumber', 'ABCDE1234F');
        form.append('bankName', 'Test Bank');
        form.append('street', 'API Test Street');
        form.append('city', 'API Test City');
        form.append('state', 'API Test State');
        form.append('postalCode', '999999');
        form.append('gstin', 'APIGSTIN123');
        // Attach dummy files if required by backend validation? 
        // Backend: `if (newDocuments.length > 0) ...` 
        // But `upload.fields` might complain if files are missing if they are required?
        // `maxCount: 1`. It doesn't say `required` in middleware, but validation might check.
        // Controller: `if (!existingIdProof && !files.id_proof) ...`
        // So we might need to send files if user has none.
        // Let's check if user has docs.
        
        if (!user.kycDocuments || user.kycDocuments.length === 0) {
           console.log("Simulating file upload...");
           //Create a dummy buffer
           const buffer = Buffer.from('dummy pdf content');
           form.append('id_proof', buffer, { filename: 'test_id.pdf', contentType: 'application/pdf' });
           form.append('bank_proof', buffer, { filename: 'test_bank.pdf', contentType: 'application/pdf' });
        }

        const headers = {
            ...form.getHeaders(),
            'Authorization': `Bearer ${token}`
        };

        console.log("Sending POST request...");
        try {
            const res = await axios.post(BASE_URL, form, { headers });
            console.log("Response Status:", res.status);
            console.log("Response Data:", res.data);
        } catch (err) {
            console.error("API Error:", err.response ? err.response.data : err.message);
        }

        // Verify DB
        const updatedUser = await User.findById(user._id);
        console.log("Updated Address in DB:", updatedUser.bankDetails.address);

        process.exit();

    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

runTest();
