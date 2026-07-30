import * as nodemailer from 'nodemailer';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('📧 Email Configuration Test');
console.log('==========================');
console.log('EMAIL_ENABLED:', process.env.EMAIL_ENABLED);
console.log('EMAIL_HOST:', process.env.EMAIL_HOST);
console.log('EMAIL_PORT:', process.env.EMAIL_PORT);
console.log('EMAIL_USERNAME:', process.env.EMAIL_USERNAME);
console.log('EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '***hidden***' : 'NOT SET');
console.log('EMAIL_FROM:', process.env.EMAIL_FROM);
console.log('CLIENT_URL:', process.env.CLIENT_URL);
console.log('');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
});

console.log('🔍 Testing email connection...');

transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email connection failed:');
    console.error(error);
  } else {
    console.log('✅ Email server is ready to send messages');

    // Send test email
    console.log('');
    console.log('📨 Sending test email to vishnuab1207@gmail.com...');

    transporter.sendMail({
      from: process.env.EMAIL_FROM || 'Church Wallet System <sbnctrl@gmail.com>',
      to: 'vishnuab1207@gmail.com',
      subject: 'Test Email from Church Wallet System',
      html: '<h1>Test Email</h1><p>If you received this, the email system is working!</p>',
      text: 'Test Email - If you received this, the email system is working!',
    }, (err, info) => {
      if (err) {
        console.error('❌ Failed to send test email:');
        console.error(err);
      } else {
        console.log('✅ Test email sent successfully!');
        console.log('Message ID:', info.messageId);
        console.log('Response:', info.response);
      }
      process.exit(err ? 1 : 0);
    });
  }
});
