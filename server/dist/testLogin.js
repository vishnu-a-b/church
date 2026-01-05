"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const testLogin = async () => {
    try {
        console.log('🔐 Testing login endpoint...\n');
        const response = await axios_1.default.post('http://localhost:3001/api/auth/login', {
            email: 'george.mathew@email.com',
            password: 'password123',
        });
        console.log('✅ Login successful!');
        console.log('Response:', JSON.stringify(response.data, null, 2));
    }
    catch (error) {
        console.log('❌ Login failed');
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Error:', error.response.data);
        }
        else {
            console.log('Error:', error.message);
        }
    }
};
testLogin();
//# sourceMappingURL=testLogin.js.map