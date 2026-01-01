/**
 * Script to add test data for Campaigns, Stothrakazhcha, and Transactions
 *
 * Run this script with: npx ts-node src/scripts/addTestData.ts
 */

import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

// You'll need to login first and get a valid token
// Replace this with your actual church admin token
const AUTH_TOKEN = 'YOUR_CHURCH_ADMIN_TOKEN_HERE';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${AUTH_TOKEN}`
  }
});

// Test data
const testCampaigns = [
  {
    name: 'Christmas Fund 2024',
    campaignType: 'general_fund',
    contributionMode: 'variable',
    amountType: 'per_member',
    fixedAmount: 500,
    minimumAmount: 200,
    startDate: new Date('2024-12-01'),
    endDate: new Date('2024-12-25'),
    dueDate: new Date('2024-12-25'),
    isActive: true
  },
  {
    name: 'Building Fund - January',
    campaignType: 'building_fund',
    contributionMode: 'fixed',
    amountType: 'per_house',
    fixedAmount: 1000,
    minimumAmount: 0,
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-01-31'),
    dueDate: new Date('2025-01-31'),
    isActive: true
  },
  {
    name: 'Charity Drive - December',
    campaignType: 'charity',
    contributionMode: 'variable',
    amountType: 'flexible',
    fixedAmount: 0,
    minimumAmount: 100,
    startDate: new Date('2024-12-15'),
    endDate: new Date('2024-12-31'),
    dueDate: new Date('2024-12-31'),
    isActive: true
  }
];

const testStothrakazhcha = [
  {
    weekNumber: 52,
    year: 2024,
    weekStartDate: new Date('2024-12-23'),
    weekEndDate: new Date('2024-12-29'),
    dueDate: new Date('2024-12-29'),
    defaultAmount: 100,
    amountType: 'per_member',
    status: 'active'
  },
  {
    weekNumber: 1,
    year: 2025,
    weekStartDate: new Date('2024-12-30'),
    weekEndDate: new Date('2025-01-05'),
    dueDate: new Date('2025-01-05'),
    defaultAmount: 100,
    amountType: 'per_member',
    status: 'active'
  },
  {
    weekNumber: 2,
    year: 2025,
    weekStartDate: new Date('2025-01-06'),
    weekEndDate: new Date('2025-01-12'),
    dueDate: new Date('2025-01-12'),
    defaultAmount: 150,
    amountType: 'per_house',
    status: 'active'
  }
];

async function addTestData() {
  console.log('🚀 Starting to add test data...\n');

  try {
    // First, get some members to add contributions
    console.log('📋 Fetching members...');
    const membersResponse = await api.get('/members');
    const members = membersResponse.data?.data || [];

    if (members.length === 0) {
      console.error('❌ No members found! Please add members first.');
      return;
    }
    console.log(`✅ Found ${members.length} members\n`);

    // Create test campaigns
    console.log('💰 Creating test campaigns...');
    const createdCampaigns = [];
    for (const campaign of testCampaigns) {
      try {
        const response = await api.post('/campaigns', campaign);
        const createdCampaign = response.data?.data || response.data;
        createdCampaigns.push(createdCampaign);
        console.log(`  ✅ Created: ${campaign.name}`);
      } catch (error: any) {
        console.log(`  ⚠️  ${campaign.name}: ${error.response?.data?.error || error.message}`);
      }
    }
    console.log(`\n📊 Created ${createdCampaigns.length} campaigns\n`);

    // Add contributions to campaigns
    if (createdCampaigns.length > 0 && members.length > 0) {
      console.log('💸 Adding contributions to campaigns...');

      // Add 3-5 random contributions to each campaign
      for (const campaign of createdCampaigns) {
        const numContributions = Math.floor(Math.random() * 3) + 3; // 3-5 contributions

        for (let i = 0; i < Math.min(numContributions, members.length); i++) {
          const randomMember = members[Math.floor(Math.random() * members.length)];
          const amount = campaign.fixedAmount || Math.floor(Math.random() * 500) + 100;

          try {
            await api.post(`/campaigns/${campaign._id}/contribute`, {
              amount,
              memberId: randomMember._id
            });
            console.log(`  ✅ Added ₹${amount} contribution from ${randomMember.firstName} ${randomMember.lastName} to ${campaign.name}`);
          } catch (error: any) {
            console.log(`  ⚠️  Contribution failed: ${error.response?.data?.error || error.message}`);
          }
        }
      }
      console.log('\n');
    }

    // Create test stothrakazhcha
    console.log('📅 Creating test Stothrakazhcha...');
    const createdStothrakazhcha = [];
    for (const stothrakazhcha of testStothrakazhcha) {
      try {
        const response = await api.post('/stothrakazhcha', stothrakazhcha);
        const created = response.data?.data || response.data;
        createdStothrakazhcha.push(created);
        console.log(`  ✅ Created: Week ${stothrakazhcha.weekNumber}, ${stothrakazhcha.year}`);
      } catch (error: any) {
        console.log(`  ⚠️  Week ${stothrakazhcha.weekNumber}: ${error.response?.data?.error || error.message}`);
      }
    }
    console.log(`\n📊 Created ${createdStothrakazhcha.length} stothrakazhcha entries\n`);

    // Add contributions to stothrakazhcha
    if (createdStothrakazhcha.length > 0 && members.length > 0) {
      console.log('💸 Adding contributions to Stothrakazhcha...');

      for (const stothrakazhcha of createdStothrakazhcha) {
        const numContributions = Math.floor(Math.random() * 5) + 5; // 5-9 contributions

        for (let i = 0; i < Math.min(numContributions, members.length); i++) {
          const randomMember = members[Math.floor(Math.random() * members.length)];
          const amount = stothrakazhcha.defaultAmount || Math.floor(Math.random() * 200) + 50;

          try {
            await api.post(`/stothrakazhcha/${stothrakazhcha._id}/contribute`, {
              amount,
              memberId: randomMember._id
            });
            console.log(`  ✅ Added ₹${amount} from ${randomMember.firstName} ${randomMember.lastName} to Week ${stothrakazhcha.weekNumber}`);
          } catch (error: any) {
            console.log(`  ⚠️  Contribution failed: ${error.response?.data?.error || error.message}`);
          }
        }
      }
      console.log('\n');
    }

    // Verify transactions were created
    console.log('🔍 Verifying transactions...');
    try {
      const transactionsResponse = await api.get('/transactions');
      const transactions = transactionsResponse.data?.data || [];
      console.log(`✅ Total transactions in system: ${transactions.length}`);

      const campaignTransactions = transactions.filter((t: any) =>
        t.description?.includes('Campaign') || t.type === 'campaign_contribution'
      );
      const stothrakazhchaTransactions = transactions.filter((t: any) =>
        t.description?.includes('Stothrakazhcha') || t.type === 'stothrakazhcha_contribution'
      );

      console.log(`  📊 Campaign transactions: ${campaignTransactions.length}`);
      console.log(`  📊 Stothrakazhcha transactions: ${stothrakazhchaTransactions.length}`);
    } catch (error: any) {
      console.log(`⚠️  Could not verify transactions: ${error.message}`);
    }

    console.log('\n✨ Test data added successfully!');
    console.log('\n📝 Summary:');
    console.log(`  - Campaigns: ${createdCampaigns.length}`);
    console.log(`  - Stothrakazhcha: ${createdStothrakazhcha.length}`);
    console.log(`  - Check your dashboard to see the data!`);

  } catch (error: any) {
    console.error('\n❌ Error adding test data:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      console.log('\n⚠️  Authentication failed! Please update AUTH_TOKEN in this script.');
      console.log('   1. Login to your app');
      console.log('   2. Open browser DevTools > Application > Local Storage');
      console.log('   3. Copy the value of "church_admin_accessToken"');
      console.log('   4. Update AUTH_TOKEN variable in this script');
    }
  }
}

// Run the script
if (require.main === module) {
  addTestData().catch(console.error);
}

export { addTestData };
