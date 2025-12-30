import dotenv from 'dotenv';
import mongoose from 'mongoose';
import News from './models/News';
import Event from './models/Event';
import Church from './models/Church';
import User from './models/User';
import connectDB from './config/database';

dotenv.config();

const seedChristmasData = async () => {
  try {
    await connectDB();

    // Get the first church and church admin user
    const church = await Church.findOne();
    const churchAdmin = await User.findOne({ role: 'church_admin' });

    if (!church || !churchAdmin) {
      console.error('❌ No church or church admin found. Please seed basic data first.');
      process.exit(1);
    }

    console.log(`✅ Found church: ${church.name}`);
    console.log(`✅ Found admin: ${churchAdmin.email}`);

    // Create Christmas News
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const christmasDate = new Date('2025-12-25');
    christmasDate.setHours(23, 59, 59, 999);

    // Delete existing Christmas news/events if any
    await News.deleteMany({ title: { $regex: /christmas/i } });
    await Event.deleteMany({ title: { $regex: /christmas/i } });

    const christmasNews = await News.create({
      churchId: church._id,
      title: '🎄 Merry Christmas! Season\'s Greetings from Our Church Family',
      contentType: 'text',
      content: `Dear beloved members,

As we celebrate the birth of our Lord Jesus Christ, we wish you and your family a blessed and joyful Christmas! May this holy season fill your hearts with peace, love, and hope.

"For unto us a child is born, unto us a son is given" - Isaiah 9:6

Join us for our special Christmas celebrations and let us rejoice together in the miracle of Christ's birth.

With love and blessings,
Your Church Family`,
      description: 'Christmas greetings and wishes for all church members',
      startDate: today,
      endDate: christmasDate,
      isActive: true,
      createdBy: churchAdmin._id,
    });

    console.log('✅ Christmas news created:', christmasNews.title);

    // Create Christmas Mass Event
    const christmasEve = new Date('2025-12-24');
    christmasEve.setHours(18, 0, 0, 0); // 6 PM

    const christmasMassEvent = await Event.create({
      churchId: church._id,
      title: '⛪ Christmas Eve Midnight Mass',
      contentType: 'text',
      content: `Join us for our beautiful Christmas Eve Midnight Mass celebration!

Schedule:
- Christmas Carol Service: 11:00 PM
- Midnight Mass: 12:00 AM
- Fellowship and Refreshments: After Mass

Come celebrate the birth of our Savior with prayer, music, and fellowship. All are welcome!

Dress Code: Festive/Formal
Parking: Available in church premises

Please arrive early to get good seating.`,
      location: church.location || 'Church Main Hall',
      startDate: today,
      endDate: christmasDate,
      isActive: true,
      createdBy: churchAdmin._id,
    });

    console.log('✅ Christmas event created:', christmasMassEvent.title);

    // Create another event for Christmas Day
    const christmasDayEvent = await Event.create({
      churchId: church._id,
      title: '🎅 Christmas Day Celebration & Community Lunch',
      contentType: 'text',
      content: `Celebrate Christmas Day with our church community!

Program:
- Morning Mass: 9:00 AM
- Children's Christmas Program: 10:30 AM
- Community Christmas Lunch: 12:00 PM
- Carol Singing & Games: 2:00 PM

Special Activities:
✨ Children's Christmas story time
🎁 Gift exchange for kids
🍰 Traditional Christmas feast
🎵 Live Christmas carol performance

Bring your family and friends to celebrate this joyous occasion together!

RSVP: Please register at the church office for lunch arrangements.`,
      location: church.location || 'Church Auditorium & Dining Hall',
      startDate: today,
      endDate: christmasDate,
      isActive: true,
      createdBy: churchAdmin._id,
    });

    console.log('✅ Christmas Day event created:', christmasDayEvent.title);

    console.log('\n🎄✨ Christmas data seeded successfully! ✨🎄\n');
    console.log(`📅 Valid from: ${today.toLocaleDateString()} to ${christmasDate.toLocaleDateString()}`);
    console.log(`🏛️ Church: ${church.name}`);
    console.log(`\n✅ Members can now see these on their dashboard!\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding Christmas data:', error);
    process.exit(1);
  }
};

seedChristmasData();
