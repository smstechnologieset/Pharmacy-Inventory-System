import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }
  return transporter;
};

const createStockAlertEmail = (alerts, pharmacyName) => {
  const alertRows = alerts.map(alert => {
    let statusColor = '#059669';
    let statusBg = '#ECFDF5';
    let statusText = 'Low Stock';
    let icon = '⚠️';

    if (alert.type === 'out_of_stock') {
      statusColor = '#DC2626';
      statusBg = '#FEF2F2';
      statusText = 'Out of Stock';
      icon = '🚨';
    } else if (alert.type === 'expired') {
      statusColor = '#7C2D12';
      statusBg = '#FEF2F2';
      statusText = 'Expired';
      icon = '⛔';
    } else if (alert.type === 'low_stock') {
      statusColor = '#D97706';
      statusBg = '#FFFBEB';
      statusText = 'Low Stock';
      icon = '📉';
    }

    return `
      <tr style="border-bottom: 1px solid #F1F5F9;">
        <td style="padding: 16px; font-weight: 600; color: #1E293B;">${alert.medicineName}</td>
        <td style="padding: 16px; color: #64748B;">${alert.batchNo || 'N/A'}</td>
        <td style="padding: 16px; text-align: center;">
          <span style="background: ${statusBg}; color: ${statusColor}; padding: 6px 12px; border-radius: 8px; font-weight: 700; font-size: 13px;">
            ${icon} ${statusText}
          </span>
        </td>
        <td style="padding: 16px; text-align: center; font-weight: 700; color: #1E293B;">${alert.quantity || 0}</td>
        <td style="padding: 16px; color: #64748B;">${alert.expiryDate || 'N/A'}</td>
      </tr>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Stock Alert</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #F8FAFC;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F8FAFC; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
              <tr>
                <td style="background: linear-gradient(135deg, #0D9488 0%, #14B8A6 100%); padding: 32px; text-align: center;">
                  <h1 style="margin: 0; color: white; font-size: 24px; font-weight: 800;">
                    🏥 Stock Alert
                  </h1>
                  <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">
                    ${pharmacyName || 'Your Pharmacy'}
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding: 32px;">
                  <h2 style="margin: 0 0 16px 0; color: #1E293B; font-size: 20px; font-weight: 700;">
                    ⚡ Immediate Attention Required
                  </h2>
                  <p style="margin: 0 0 24px 0; color: #64748B; font-size: 15px; line-height: 1.6;">
                    The following medicines in your pharmacy require your immediate attention.
                  </p>

                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                    <tr>
                      <td style="padding: 8px;">
                        <div style="background: #FEF2F2; border-radius: 12px; padding: 16px; text-align: center;">
                          <div style="font-size: 24px; font-weight: 800; color: #DC2626;">
                            ${alerts.filter(a => a.type === 'out_of_stock').length}
                          </div>
                          <div style="font-size: 12px; color: #7F1D1D; font-weight: 600; text-transform: uppercase;">Out of Stock</div>
                        </div>
                      </td>
                      <td style="padding: 8px;">
                        <div style="background: #FFFBEB; border-radius: 12px; padding: 16px; text-align: center;">
                          <div style="font-size: 24px; font-weight: 800; color: #D97706;">
                            ${alerts.filter(a => a.type === 'low_stock').length}
                          </div>
                          <div style="font-size: 12px; color: #78350F; font-weight: 600; text-transform: uppercase;">Low Stock</div>
                        </div>
                      </td>
                      <td style="padding: 8px;">
                        <div style="background: #FEF2F2; border-radius: 12px; padding: 16px; text-align: center;">
                          <div style="font-size: 24px; font-weight: 800; color: #7C2D12;">
                            ${alerts.filter(a => a.type === 'expired').length}
                          </div>
                          <div style="font-size: 12px; color: #7C2D12; font-weight: 600; text-transform: uppercase;">Expired</div>
                        </div>
                      </td>
                    </tr>
                  </table>

                  <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #E2E8F0; border-radius: 12px; overflow: hidden;">
                    <thead>
                      <tr style="background: #F8FAFC;">
                        <th style="padding: 12px 16px; text-align: left; font-size: 12px; color: #64748B; text-transform: uppercase; font-weight: 700;">Medicine</th>
                        <th style="padding: 12px 16px; text-align: left; font-size: 12px; color: #64748B; text-transform: uppercase; font-weight: 700;">Batch</th>
                        <th style="padding: 12px 16px; text-align: center; font-size: 12px; color: #64748B; text-transform: uppercase; font-weight: 700;">Status</th>
                        <th style="padding: 12px 16px; text-align: center; font-size: 12px; color: #64748B; text-transform: uppercase; font-weight: 700;">Qty</th>
                        <th style="padding: 12px 16px; text-align: left; font-size: 12px; color: #64748B; text-transform: uppercase; font-weight: 700;">Expiry</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${alertRows}
                    </tbody>
                  </table>

                  <p style="margin: 24px 0 0 0; color: #94A3B8; font-size: 13px; text-align: center;">
                    This is an automated alert from your Pharmacy Inventory System.
                  </p>
                </td>
              </tr>
              <tr>
                <td style="background: #F8FAFC; padding: 24px; text-align: center; border-top: 1px solid #E2E8F0;">
                  <p style="margin: 0; color: #94A3B8; font-size: 12px;">
                    © ${new Date().getFullYear()} Pharmacy Inventory System. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

// 🆕 Now accepts recipient emails as a parameter
export const sendStockAlertEmail = async (alerts, recipientEmails, pharmacyName) => {
  if (!alerts || alerts.length === 0) {
    console.log('No alerts to send via email');
    return { success: false, message: 'No alerts' };
  }

  // Filter out invalid/empty emails
  const validEmails = (recipientEmails || [])
    .map(email => email?.trim())
    .filter(email => email && email.includes('@'));

  if (validEmails.length === 0) {
    console.warn('⚠️ No valid admin emails provided. Skipping email notification.');
    return { success: false, message: 'No admin emails provided' };
  }

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('⚠️ Gmail credentials not configured. Skipping email notification.');
    return { success: false, message: 'Email not configured' };
  }

  try {
    const transport = getTransporter();

    const hasOutOfStock = alerts.some(a => a.type === 'out_of_stock');
    const hasExpired = alerts.some(a => a.type === 'expired');

    let subject = '📦 Stock Alert';
    if (hasOutOfStock) subject = '🚨 URGENT: Medicine Out of Stock';
    else if (hasExpired) subject = '⛔ Expired Medicines Alert';
    else if (alerts.some(a => a.type === 'low_stock')) subject = '📉 Low Stock Alert';

    // Personalize subject with pharmacy name
    if (pharmacyName) {
      subject = `${subject} - ${pharmacyName}`;
    }

    const mailOptions = {
      from: `"Pharmacy Inventory" <${process.env.EMAIL_USER}>`,
      to: validEmails.join(','),
      subject,
      html: createStockAlertEmail(alerts, pharmacyName),
    };

    const info = await transport.sendMail(mailOptions);
    console.log(`✅ Stock alert email sent to ${validEmails.length} admin(s) of ${pharmacyName || 'pharmacy'}:`, info.messageId);

    return { success: true, messageId: info.messageId, sentTo: validEmails };
  } catch (error) {
    console.error('❌ Failed to send stock alert email:', error);
    throw error;
  }
};
