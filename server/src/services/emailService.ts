import * as nodemailer from 'nodemailer';
import { IMember } from '../types';

// Email transporter configuration
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Verify transporter configuration
transporter.verify((error) => {
  if (error) {
    console.error('❌ Email service configuration error:', error);
  } else {
    console.log('✅ Email service is ready');
  }
});

export interface MemberHierarchyInfo {
  churchName: string;
  unitName: string;
  bavanakutayimaName: string;
  houseName: string;
  hierarchicalNumber: string;
}

export interface TransactionDetails {
  receiptNumber: string;
  transactionType: string;
  amount: number;
  paymentMethod: string;
  paymentDate: Date;
  campaignName?: string;
}

// Common shape covering both Member and Donor recipients. Donors have no
// email-verification flow (they're set up directly by an admin, not
// self-registered), so isEmailVerified/emailNotificationsEnabled are only
// enforced when actually present on the recipient.
export interface TransactionEmailRecipient {
  firstName?: string;
  name?: string;
  email?: string;
  isEmailVerified?: boolean;
  emailNotificationsEnabled?: boolean;
}

/**
 * Send welcome email to new member with verification link
 */
export const sendWelcomeEmail = async (
  member: IMember,
  hierarchyInfo: MemberHierarchyInfo,
  verificationToken: string
): Promise<void> => {
  if (!process.env.EMAIL_ENABLED || process.env.EMAIL_ENABLED !== 'true') {
    console.log('📧 Email is disabled, skipping welcome email');
    return;
  }

  if (!member.email) {
    console.log('⚠️ Member has no email address, skipping welcome email');
    return;
  }

  const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`;

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Church Wallet System</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">Welcome to Church Wallet System!</h1>
  </div>

  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <h2 style="color: #667eea;">Hello ${member.firstName} ${member.lastName || ''}!</h2>

    <p>We're delighted to welcome you to the Church Wallet System. Your member profile has been successfully created.</p>

    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
      <h3 style="margin-top: 0; color: #667eea;">Your Member Information</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; font-weight: bold;">Member ID:</td>
          <td style="padding: 8px 0;">${hierarchyInfo.hierarchicalNumber}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold;">Name:</td>
          <td style="padding: 8px 0;">${member.firstName} ${member.lastName || ''}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold;">Email:</td>
          <td style="padding: 8px 0;">${member.email}</td>
        </tr>
        ${member.phone ? `
        <tr>
          <td style="padding: 8px 0; font-weight: bold;">Phone:</td>
          <td style="padding: 8px 0;">${member.phone}</td>
        </tr>
        ` : ''}
      </table>
    </div>

    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #764ba2;">
      <h3 style="margin-top: 0; color: #764ba2;">Your Hierarchy</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; font-weight: bold;">Church:</td>
          <td style="padding: 8px 0;">${hierarchyInfo.churchName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold;">Unit:</td>
          <td style="padding: 8px 0;">${hierarchyInfo.unitName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold;">Bavanakutayima:</td>
          <td style="padding: 8px 0;">${hierarchyInfo.bavanakutayimaName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold;">House:</td>
          <td style="padding: 8px 0;">${hierarchyInfo.houseName}</td>
        </tr>
      </table>
    </div>

    <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
      <h3 style="margin-top: 0; color: #856404;">📧 Verify Your Email</h3>
      <p style="margin-bottom: 20px;">Please verify your email address to receive transaction notifications and enable email preferences.</p>
      <a href="${verificationUrl}" style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Verify Email Address</a>
    </div>

    <p style="margin-top: 30px; color: #666; font-size: 14px;">
      If the button doesn't work, copy and paste this link into your browser:<br>
      <a href="${verificationUrl}" style="color: #667eea;">${verificationUrl}</a>
    </p>

    <p style="margin-top: 30px; color: #666; font-size: 14px;">
      Once verified, you'll be able to:
    </p>
    <ul style="color: #666; font-size: 14px;">
      <li>Receive email notifications for transactions</li>
      <li>Enable/disable email preferences</li>
      <li>Access member portal features</li>
    </ul>

    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

    <p style="color: #999; font-size: 12px; text-align: center;">
      This is an automated message from Church Wallet System.<br>
      Please do not reply to this email.
    </p>
  </div>
</body>
</html>
  `;

  const textContent = `
Welcome to Church Wallet System!

Hello ${member.firstName} ${member.lastName || ''}!

We're delighted to welcome you to the Church Wallet System. Your member profile has been successfully created.

Your Member Information:
- Member ID: ${hierarchyInfo.hierarchicalNumber}
- Name: ${member.firstName} ${member.lastName || ''}
- Email: ${member.email}
${member.phone ? `- Phone: ${member.phone}` : ''}

Your Hierarchy:
- Church: ${hierarchyInfo.churchName}
- Unit: ${hierarchyInfo.unitName}
- Bavanakutayima: ${hierarchyInfo.bavanakutayimaName}
- House: ${hierarchyInfo.houseName}

Verify Your Email:
Please verify your email address to receive transaction notifications and enable email preferences.

Verification Link: ${verificationUrl}

Once verified, you'll be able to:
- Receive email notifications for transactions
- Enable/disable email preferences
- Access member portal features

---
This is an automated message from Church Wallet System.
Please do not reply to this email.
  `;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'Church Wallet System <noreply@church.com>',
      to: member.email,
      subject: 'Welcome to Church Wallet System - Please Verify Your Email',
      html: htmlContent,
      text: textContent,
    });

    console.log(`✅ Welcome email sent to ${member.email}`);
  } catch (error) {
    console.error('❌ Error sending welcome email:', error);
    throw error;
  }
};

export interface DonorCredentialsInfo {
  name: string;
  email?: string;
  phone: string;
  address?: string;
  username: string;
  tempPassword: string;
}

/**
 * Send a donor (outside supporter) their login credentials by email, once
 * both an email address and generated credentials exist for them. Donors are
 * set up directly by an admin — there's no self-registration/verification
 * step like Members have.
 */
export const sendDonorCredentialsEmail = async (donor: DonorCredentialsInfo): Promise<void> => {
  if (!process.env.EMAIL_ENABLED || process.env.EMAIL_ENABLED !== 'true') {
    console.log('📧 Email is disabled, skipping donor credentials email');
    return;
  }

  if (!donor.email) {
    console.log('⚠️ Donor has no email address, skipping donor credentials email');
    return;
  }

  const loginUrl = `${process.env.CLIENT_URL}/donor-login`;

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Login Details</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">Welcome to Church Wallet System!</h1>
  </div>

  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <h2 style="color: #667eea;">Hello ${donor.name}!</h2>

    <p>You've been registered with St. Mary's Church Elthuruth, and a login to track your contributions has been set up for you.</p>

    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
      <h3 style="margin-top: 0; color: #667eea;">Your Details on File</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; font-weight: bold;">Name:</td>
          <td style="padding: 8px 0;">${donor.name}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold;">Phone:</td>
          <td style="padding: 8px 0;">${donor.phone}</td>
        </tr>
        ${donor.address ? `
        <tr>
          <td style="padding: 8px 0; font-weight: bold;">Address:</td>
          <td style="padding: 8px 0;">${donor.address}</td>
        </tr>
        ` : ''}
        <tr>
          <td style="padding: 8px 0; font-weight: bold;">Email:</td>
          <td style="padding: 8px 0;">${donor.email}</td>
        </tr>
      </table>
    </div>

    <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
      <h3 style="margin-top: 0; color: #856404;">🔑 Your Login Credentials</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; font-weight: bold;">Username:</td>
          <td style="padding: 8px 0;">${donor.username}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold;">Password:</td>
          <td style="padding: 8px 0;">${donor.tempPassword}</td>
        </tr>
      </table>
      <p style="margin: 15px 0 0 0; font-size: 13px; color: #856404;">Please keep these details safe. Contact the church office if you need them reset.</p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${loginUrl}" style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Log In to Your Account</a>
    </div>

    <p style="margin-top: 30px; color: #666; font-size: 14px;">
      If the button doesn't work, copy and paste this link into your browser:<br>
      <a href="${loginUrl}" style="color: #667eea;">${loginUrl}</a>
    </p>

    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

    <p style="color: #999; font-size: 12px; text-align: center;">
      This is an automated message from Church Wallet System.<br>
      Please do not reply to this email.
    </p>
  </div>
</body>
</html>
  `;

  const textContent = `
Welcome to Church Wallet System!

Hello ${donor.name}!

You've been registered with St. Mary's Church Elthuruth, and a login to track your contributions has been set up for you.

Your Details on File:
- Name: ${donor.name}
- Phone: ${donor.phone}
${donor.address ? `- Address: ${donor.address}` : ''}
- Email: ${donor.email}

Your Login Credentials:
- Username: ${donor.username}
- Password: ${donor.tempPassword}

Please keep these details safe. Contact the church office if you need them reset.

Log in here: ${loginUrl}

---
This is an automated message from Church Wallet System.
Please do not reply to this email.
  `;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'Church Wallet System <noreply@church.com>',
      to: donor.email,
      subject: 'Your Church Wallet System Login Details',
      html: htmlContent,
      text: textContent,
    });

    console.log(`✅ Donor credentials email sent to ${donor.email}`);
  } catch (error) {
    console.error('❌ Error sending donor credentials email:', error);
    // Don't throw — credential generation should succeed even if email fails
  }
};

/**
 * Send transaction notification email to verified member
 */
export const sendTransactionNotification = async (
  member: TransactionEmailRecipient,
  transactionDetails: TransactionDetails
): Promise<void> => {
  if (!process.env.EMAIL_ENABLED || process.env.EMAIL_ENABLED !== 'true') {
    console.log('📧 Email is disabled, skipping transaction notification');
    return;
  }

  if (!member.email) {
    console.log('⚠️ Recipient has no email address, skipping transaction notification');
    return;
  }

  // Only enforced for recipients that actually have these fields (Members).
  // Donors are set up directly by an admin and have no verification flow.
  if (member.isEmailVerified === false) {
    console.log('⚠️ Recipient email not verified, skipping transaction notification');
    return;
  }

  if (member.emailNotificationsEnabled === false) {
    console.log('⚠️ Recipient has disabled email notifications, skipping transaction notification');
    return;
  }

  const recipientName = member.firstName || member.name || 'there';

  const transactionTypeLabel = transactionDetails.transactionType
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  const formattedAmount = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(transactionDetails.amount);

  const formattedDate = new Date(transactionDetails.paymentDate).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Transaction Notification</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">Transaction Notification</h1>
  </div>

  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <h2 style="color: #667eea;">Hello ${recipientName}!</h2>

    <p>A new transaction has been recorded for you in the Church Wallet System.</p>

    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
      <h3 style="margin-top: 0; color: #28a745;">Transaction Details</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; font-weight: bold;">Receipt Number:</td>
          <td style="padding: 8px 0;">${transactionDetails.receiptNumber}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold;">Type:</td>
          <td style="padding: 8px 0;">${transactionTypeLabel}</td>
        </tr>
        ${transactionDetails.campaignName ? `
        <tr>
          <td style="padding: 8px 0; font-weight: bold;">Campaign:</td>
          <td style="padding: 8px 0;">${transactionDetails.campaignName}</td>
        </tr>
        ` : ''}
        <tr>
          <td style="padding: 8px 0; font-weight: bold;">Amount:</td>
          <td style="padding: 8px 0; font-size: 20px; color: #28a745; font-weight: bold;">${formattedAmount}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold;">Payment Method:</td>
          <td style="padding: 8px 0;">${transactionDetails.paymentMethod.replace('_', ' ').toUpperCase()}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold;">Date:</td>
          <td style="padding: 8px 0;">${formattedDate}</td>
        </tr>
      </table>
    </div>

    <p style="color: #666; font-size: 14px;">
      Thank you for your contribution to the church!
    </p>

    <div style="background: #f0f0f0; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <p style="margin: 0; color: #666; font-size: 12px;">
        To manage your email notification preferences, visit your member portal settings.
      </p>
    </div>

    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

    <p style="color: #999; font-size: 12px; text-align: center;">
      This is an automated message from Church Wallet System.<br>
      Please do not reply to this email.
    </p>
  </div>
</body>
</html>
  `;

  const textContent = `
Transaction Notification

Hello ${recipientName}!

A new transaction has been recorded for you in the Church Wallet System.

Transaction Details:
- Receipt Number: ${transactionDetails.receiptNumber}
- Type: ${transactionTypeLabel}
${transactionDetails.campaignName ? `- Campaign: ${transactionDetails.campaignName}` : ''}
- Amount: ${formattedAmount}
- Payment Method: ${transactionDetails.paymentMethod.replace('_', ' ').toUpperCase()}
- Date: ${formattedDate}

Thank you for your contribution to the church!

To manage your email notification preferences, visit your member portal settings.

---
This is an automated message from Church Wallet System.
Please do not reply to this email.
  `;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'Church Wallet System <noreply@church.com>',
      to: member.email,
      subject: `Transaction Receipt - ${transactionDetails.receiptNumber}`,
      html: htmlContent,
      text: textContent,
    });

    console.log(`✅ Transaction notification sent to ${member.email}`);
  } catch (error) {
    console.error('❌ Error sending transaction notification:', error);
    // Don't throw error - transaction should succeed even if email fails
  }
};

export default {
  sendWelcomeEmail,
  sendTransactionNotification,
  sendDonorCredentialsEmail,
};
