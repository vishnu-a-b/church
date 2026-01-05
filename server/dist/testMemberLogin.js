"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const testMemberLogin = async () => {
    try {
        console.log('\n🔐 Testing member login endpoint...\n');
        const response = await axios_1.default.post('http://localhost:3001/api/auth/member-login', {
            username: 'testmember',
            password: 'member123',
        });
        console.log('✅ Login successful!');
        console.log('\n📋 Response:');
        console.log(JSON.stringify(response.data, null, 2));
        if (response.data.success) {
            console.log('\n✅ Access Token:', response.data.accessToken ? 'Present' : 'Missing');
            console.log('✅ Refresh Token:', response.data.refreshToken ? 'Present' : 'Missing');
            console.log('✅ User Data:', response.data.user ? 'Present' : 'Missing');
            console.log('\n👤 User Info:');
            console.log('   Username:', response.data.user.username);
            console.log('   Role:', response.data.user.role);
            console.log('   Name:', response.data.user.firstName, response.data.user.lastName);
        }
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
testMemberLogin();
//# sourceMappingURL=testMemberLogin.js.map