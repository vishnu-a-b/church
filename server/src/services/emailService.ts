import * as nodemailer from 'nodemailer';
import { IMember } from '../types';

// Created lazily (on first send) rather than at module load — TypeScript's
// CommonJS output hoists every `import`-derived require() above other
// top-level code, so a transporter built here at module scope would read
// process.env.EMAIL_* before server.ts's dotenv.config() has actually run,
// silently getting undefined credentials no matter where dotenv.config() is
// textually placed relative to the imports.
let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    transporter.verify((error) => {
      if (error) {
        console.error('❌ Email service configuration error:', error);
      } else {
        console.log('✅ Email service is ready');
      }
    });
  }

  return transporter;
}

export interface MemberHierarchyInfo {
  churchName: string;
  unitName: string;
  bavanakutayimaName: string;
  houseName: string;
  hierarchicalNumber: string;
}

export interface SpiritualActivitySummary {
  activityType: string;
  approvalStatus: string;
  massDate?: Date;
  fastingWeek?: string;
  fastingDays?: string[];
  prayerType?: string;
  prayerCount?: number;
  prayerWeek?: string;
}

export interface TransactionDetails {
  receiptNumber: string;
  transactionType: string;
  amount: number;
  paymentMethod: string;
  paymentDate: Date;
  campaignName?: string;
  spiritualActivities?: SpiritualActivitySummary[];
  churchName?: string;
  houseName?: string;
  memberCode?: string;
}

// Common shape covering both Member and Donor recipients. Donors have no
// email-verification flow (they're set up directly by an admin, not
// self-registered), so isEmailVerified/emailNotificationsEnabled are only
// enforced when actually present on the recipient.
export interface TransactionEmailRecipient {
  firstName?: string;
  lastName?: string;
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
    await getTransporter().sendMail({
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
    await getTransporter().sendMail({
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

  const recipientFullName = [member.firstName, member.lastName].filter(Boolean).join(' ') || member.name || 'Member';
  const recipientFirstName = member.firstName || member.name || 'there';

  const churchName = transactionDetails.churchName || 'Church Offerings Portal';

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

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Official Receipt</title>
</head>
<body style="margin:0; padding:24px 16px; background:#ebe8e3; font-family:Arial, Helvetica, sans-serif;">
  <div style="max-width:580px; margin:0 auto; background:#ffffff; border-radius:10px; overflow:hidden; box-shadow:0 4px 18px rgba(0,0,0,0.13);">

    <!-- Header -->
    <div style="background:#6b1a1a; padding:30px 32px 22px; text-align:center;">
      <div style="color:#c9a227; font-size:28px; line-height:1; margin-bottom:10px;">&#10013;</div>
      <h1 style="color:#ffffff; margin:0; font-size:19px; letter-spacing:2px; text-transform:uppercase; font-weight:bold;">${churchName}</h1>
      <div style="margin-top:14px;">
        <span style="display:inline-block; background:rgba(255,255,255,0.1); border:1px solid rgba(201,162,39,0.55); border-radius:4px; padding:5px 22px; color:#c9a227; font-size:10px; letter-spacing:3px; text-transform:uppercase; font-weight:bold;">Official Receipt</span>
      </div>
    </div>

    <!-- Receipt No + Date strip -->
    <div style="background:#f8f2e8; border-bottom:1px solid #e4d5b8; padding:11px 32px;">
      <table style="width:100%; border-collapse:collapse;">
        <tr>
          <td style="vertical-align:top;">
            <div style="font-size:9px; color:#aaa; text-transform:uppercase; letter-spacing:1px; margin-bottom:3px;">Receipt No.</div>
            <div style="font-size:13px; color:#6b1a1a; font-weight:bold; font-family:Courier New, monospace;">${transactionDetails.receiptNumber}</div>
          </td>
          <td style="vertical-align:top; text-align:right;">
            <div style="font-size:9px; color:#aaa; text-transform:uppercase; letter-spacing:1px; margin-bottom:3px;">Date</div>
            <div style="font-size:13px; color:#333;">${formattedDate}</div>
          </td>
        </tr>
      </table>
    </div>

    <div style="padding:26px 32px;">

      <!-- Greeting -->
      <p style="margin:0 0 20px; font-size:14px; color:#555;">Dear <strong>${recipientFirstName}</strong>, your payment has been received. Please find your receipt details below.</p>

      <!-- Received From -->
      <div style="margin-bottom:16px;">
        <div style="font-size:9px; text-transform:uppercase; letter-spacing:1.5px; color:#9b7a50; font-weight:bold; margin-bottom:7px;">&#9658; Received From</div>
        <div style="background:#fdf9f3; border:1px solid #e8dcc4; border-radius:6px; padding:13px 15px;">
          <table style="width:100%; border-collapse:collapse;">
            <tr>
              <td style="padding:4px 0; font-size:11px; color:#999; width:115px;">Name</td>
              <td style="padding:4px 0; font-size:14px; color:#1a1a1a; font-weight:bold;">${recipientFullName}</td>
            </tr>
            ${transactionDetails.memberCode ? `<tr>
              <td style="padding:4px 0; font-size:11px; color:#999;">Member Code</td>
              <td style="padding:4px 0; font-size:12px; color:#444; font-family:Courier New, monospace;">${transactionDetails.memberCode}</td>
            </tr>` : ''}
            ${transactionDetails.houseName ? `<tr>
              <td style="padding:4px 0; font-size:11px; color:#999;">House / Family</td>
              <td style="padding:4px 0; font-size:12px; color:#444;">${transactionDetails.houseName}</td>
            </tr>` : ''}
          </table>
        </div>
      </div>

      <!-- Payment Details -->
      <div style="margin-bottom:16px;">
        <div style="font-size:9px; text-transform:uppercase; letter-spacing:1.5px; color:#9b7a50; font-weight:bold; margin-bottom:7px;">&#9658; Payment Details</div>
        <div style="background:#f3f8f3; border:1px solid #ccdccc; border-radius:6px; padding:13px 15px;">
          <table style="width:100%; border-collapse:collapse;">
            <tr>
              <td style="padding:4px 0; font-size:11px; color:#999; width:115px;">Type</td>
              <td style="padding:4px 0; font-size:13px; color:#222;">${transactionTypeLabel}</td>
            </tr>
            ${transactionDetails.campaignName ? `<tr>
              <td style="padding:4px 0; font-size:11px; color:#999;">Description</td>
              <td style="padding:4px 0; font-size:13px; color:#222;">${transactionDetails.campaignName}</td>
            </tr>` : ''}
            <tr>
              <td style="padding:4px 0; font-size:11px; color:#999;">Payment Method</td>
              <td style="padding:4px 0; font-size:13px; color:#222;">${transactionDetails.paymentMethod.replace(/_/g, ' ').toUpperCase()}</td>
            </tr>
          </table>
        </div>
      </div>

      <!-- Amount Box -->
      <div style="background:#6b1a1a; border-radius:8px; padding:16px 24px; text-align:center; margin-bottom:20px;">
        <div style="color:rgba(201,162,39,0.85); font-size:9px; letter-spacing:2px; text-transform:uppercase; margin-bottom:6px;">Amount Received</div>
        <div style="color:#ffffff; font-size:32px; font-weight:bold; letter-spacing:1px;">${formattedAmount}</div>
      </div>

      ${transactionDetails.spiritualActivities && transactionDetails.spiritualActivities.length > 0 ? `<!-- Spiritual Activities -->
      <div style="margin-bottom:16px;">
        <div style="font-size:9px; text-transform:uppercase; letter-spacing:1.5px; color:#9b7a50; font-weight:bold; margin-bottom:7px;">&#9658; Spiritual Activities This Week</div>
        <div style="background:#f8f3fd; border:1px solid #d8c4ec; border-radius:6px; padding:13px 15px;">
          <table style="width:100%; border-collapse:collapse;">
            ${transactionDetails.spiritualActivities.map((a) => {
              const label = a.activityType === 'mass'
                ? `Mass${a.massDate ? ' &mdash; ' + new Date(a.massDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}`
                : a.activityType === 'fasting'
                ? `Fasting${a.fastingWeek ? ' &mdash; ' + a.fastingWeek : ''}${a.fastingDays && a.fastingDays.length ? ' (' + a.fastingDays.join(', ') + ')' : ''}`
                : `Prayer (${a.prayerType || 'other'})${a.prayerCount ? ' &times; ' + a.prayerCount : ''}${a.prayerWeek ? ' &mdash; ' + a.prayerWeek : ''}`;
              const statusColor = a.approvalStatus === 'approved' ? '#16a34a' : a.approvalStatus === 'rejected' ? '#dc2626' : '#d97706';
              const statusLabel = a.approvalStatus.replace(/_/g, ' ');
              return `<tr>
                <td style="padding:5px 0; font-size:12px; color:#333;">${label}</td>
                <td style="padding:5px 0; text-align:right; font-size:11px; color:${statusColor}; font-weight:bold; text-transform:capitalize;">${statusLabel}</td>
              </tr>`;
            }).join('')}
          </table>
        </div>
      </div>` : ''}

      <!-- Footer message + signature -->
      <div style="border-top:1px solid #e8e0d4; padding-top:18px; text-align:center;">
        <p style="color:#6b1a1a; font-style:italic; font-size:13px; margin:0 0 18px; line-height:1.7;">
          &ldquo;Thank you for your generous offering.<br>May God bless you and your family.&rdquo;
        </p>
        <div style="text-align:right; padding-right:16px;">
          <div style="display:inline-block; min-width:160px; text-align:center;">
            <div style="border-top:1px solid #bbb; padding-top:6px; font-size:10px; color:#999; letter-spacing:0.5px;">Authorised Signatory</div>
          </div>
        </div>
      </div>

      <div style="margin-top:20px; padding-top:14px; border-top:1px solid #f0ebe3; text-align:center;">
        <p style="font-size:10px; color:#bbb; margin:0; line-height:1.7;">
          This is a computer-generated receipt. No signature required.<br>
          To manage email preferences, visit your member portal.
        </p>
      </div>

    </div>
  </div>
</body>
</html>`;

  const spiritualActivitiesText = transactionDetails.spiritualActivities && transactionDetails.spiritualActivities.length > 0
    ? '\nSpiritual Activities This Week:\n' + transactionDetails.spiritualActivities.map((a) => {
        const label = a.activityType === 'mass'
          ? `Mass${a.massDate ? ' - ' + new Date(a.massDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}`
          : a.activityType === 'fasting'
          ? `Fasting${a.fastingWeek ? ' - ' + a.fastingWeek : ''}${a.fastingDays && a.fastingDays.length ? ' (' + a.fastingDays.join(', ') + ')' : ''}`
          : `Prayer (${a.prayerType || 'other'})${a.prayerCount ? ' x ' + a.prayerCount : ''}${a.prayerWeek ? ' - ' + a.prayerWeek : ''}`;
        const status = a.approvalStatus === 'pending_approval' ? 'pending' : a.approvalStatus;
        return `  - ${label}  [${status}]`;
      }).join('\n')
    : '';

  const textContent = `OFFICIAL RECEIPT
${churchName}

Receipt No: ${transactionDetails.receiptNumber}
Date: ${formattedDate}

RECEIVED FROM
  Name:         ${recipientFullName}${transactionDetails.memberCode ? `\n  Member Code:  ${transactionDetails.memberCode}` : ''}${transactionDetails.houseName ? `\n  House/Family: ${transactionDetails.houseName}` : ''}

PAYMENT DETAILS
  Type:         ${transactionTypeLabel}${transactionDetails.campaignName ? `\n  Description:  ${transactionDetails.campaignName}` : ''}
  Method:       ${transactionDetails.paymentMethod.replace(/_/g, ' ').toUpperCase()}
  Amount:       ${formattedAmount}
${spiritualActivitiesText}
---
"Thank you for your generous offering. May God bless you and your family."

This is a computer-generated receipt. To manage email preferences, visit your member portal.`;

  try {
    await getTransporter().sendMail({
      from: process.env.EMAIL_FROM || 'Church Offerings Portal <noreply@church.com>',
      to: member.email,
      subject: `Receipt #${transactionDetails.receiptNumber} — ${churchName}`,
      html: htmlContent,
      text: textContent,
    });

    console.log(`✅ Transaction receipt sent to ${member.email}`);
  } catch (error) {
    console.error('❌ Error sending transaction receipt:', error);
    // Don't throw error - transaction should succeed even if email fails
  }
};

export default {
  sendWelcomeEmail,
  sendTransactionNotification,
  sendDonorCredentialsEmail,
};
