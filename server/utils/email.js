const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST, port: Number(process.env.EMAIL_PORT) || 587,
  secure: false, auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

const sendEmail = async ({ to, subject, html }) => {
  if (!process.env.EMAIL_USER) { console.log('[Email skipped — no config]'); return; }
  await transporter.sendMail({ from: process.env.EMAIL_FROM, to, subject, html });
};

const base = (body) => `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;background:#f7f8fa;">
  <div style="background:#131921;padding:20px 32px;display:flex;align-items:center;gap:6px;">
    <span style="color:#ff9900;font-size:22px;font-weight:900;letter-spacing:-1px;">BEKI</span>
    <span style="color:#fff;font-size:22px;font-weight:300;letter-spacing:4px;">SHOP</span>
  </div>
  <div style="background:#fff;padding:32px;">${body}</div>
  <div style="background:#131921;padding:14px 32px;text-align:center;">
    <p style="color:#888;font-size:12px;margin:0;">© ${new Date().getFullYear()} BEKI Shop. All rights reserved.</p>
  </div>
</div>`;

const h2 = (t) => `<h2 style="color:#131921;margin-top:0;">${t}</h2>`;
const p = (t) => `<p style="color:#555;line-height:1.6;">${t}</p>`;
const btn = (url, text) => `<a href="${url}" style="display:inline-block;background:#ff9900;color:#131921;padding:12px 28px;text-decoration:none;border-radius:6px;font-weight:700;margin:16px 0;">${text}</a>`;

const templates = {
  welcome: (user) => ({
    subject: `Welcome to BEKI Shop, ${user.name}!`,
    html: base(`${h2(`Hi ${user.name}, welcome!`)}${p('Your account is ready. Discover thousands of products across every category.')}${btn(`${process.env.CLIENT_URL}/products`, 'Start Shopping →')}`),
  }),

  orderConfirmation: (order, user) => ({
    subject: `Order Confirmed #${order.id.slice(-8).toUpperCase()} — BEKI Shop`,
    html: base(`
      ${h2('Your order is confirmed! 🎉')}
      ${p(`Hi ${user.name}, we received your order and are processing it now.`)}
      <div style="background:#f7f8fa;border-radius:6px;padding:16px;margin:16px 0;border-left:4px solid #ff9900;">
        <p style="margin:0;font-size:13px;color:#888;">ORDER ID</p>
        <p style="margin:4px 0 0;font-weight:900;font-size:20px;color:#131921;">#${order.id.slice(-8).toUpperCase()}</p>
        <p style="margin:4px 0 0;font-size:13px;color:#555;">Status: <strong>${order.status.toUpperCase()}</strong> · Payment: <strong>${order.isPaid ? '✓ PAID' : 'PENDING'}</strong></p>
      </div>
      <table style="width:100%;border-collapse:collapse;">
        <thead><tr style="background:#131921;">
          <th style="padding:10px;text-align:left;color:#fff;font-size:12px;">Product</th>
          <th style="padding:10px;text-align:center;color:#fff;font-size:12px;">Qty</th>
          <th style="padding:10px;text-align:right;color:#fff;font-size:12px;">Price</th>
        </tr></thead>
        <tbody>${(order.items||[]).map((i,idx) => `<tr style="background:${idx%2===0?'#fff':'#f9f9f9'}">
          <td style="padding:10px;font-size:13px;color:#333;">${i.productName}</td>
          <td style="padding:10px;text-align:center;color:#555;font-size:13px;">×${i.quantity}</td>
          <td style="padding:10px;text-align:right;font-weight:700;color:#131921;font-size:13px;">$${(Number(i.price)*i.quantity).toFixed(2)}</td>
        </tr>`).join('')}</tbody>
      </table>
      <div style="border-top:2px solid #ff9900;margin-top:12px;padding-top:12px;text-align:right;">
        ${order.discountAmount > 0 ? `<p style="color:#e74c3c;font-size:13px;margin:2px 0;">Discount: -$${Number(order.discountAmount).toFixed(2)}</p>` : ''}
        <p style="color:#555;font-size:13px;margin:2px 0;">Shipping: ${Number(order.shippingPrice)===0?'FREE':'$'+Number(order.shippingPrice).toFixed(2)}</p>
        <p style="color:#555;font-size:13px;margin:2px 0;">Tax: $${Number(order.taxPrice).toFixed(2)}</p>
        <p style="font-size:20px;font-weight:900;color:#131921;margin:8px 0 0;">Total: $${Number(order.totalPrice).toFixed(2)}</p>
      </div>
      <div style="background:#f7f8fa;border-radius:6px;padding:14px;margin-top:16px;">
        ${p(`<strong>Shipping to:</strong> ${order.shippingFullName}, ${order.shippingAddress}, ${order.shippingCity}, ${order.shippingPostalCode}, ${order.shippingCountry}`)}
        ${p(`<strong>Payment method:</strong> ${order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Credit Card (Stripe)'}`)}
      </div>
      ${btn(`${process.env.CLIENT_URL}/orders/${order.id}`, 'Track Your Order →')}
    `),
  }),

  paymentConfirmed: (order, user) => ({
    subject: `Payment Confirmed — Order #${order.id.slice(-8).toUpperCase()}`,
    html: base(`
      ${h2('✅ Payment Confirmed!')}
      ${p(`Hi ${user.name}, your payment of <strong>$${Number(order.totalPrice).toFixed(2)}</strong> has been received.`)}
      <div style="background:#d4edda;border-radius:6px;padding:16px;margin:16px 0;border-left:4px solid #28a745;">
        <p style="color:#155724;font-weight:700;margin:0;">Your order is now being processed and will ship soon.</p>
      </div>
      ${btn(`${process.env.CLIENT_URL}/orders/${order.id}`, 'View Order Status →')}
    `),
  }),

  codVerified: (order, user) => ({
    subject: `Cash Payment Verified — Order #${order.id.slice(-8).toUpperCase()}`,
    html: base(`
      ${h2('Cash Payment Verified ✓')}
      ${p(`Hi ${user.name}, your cash payment for order <strong>#${order.id.slice(-8).toUpperCase()}</strong> has been verified by our delivery team.`)}
      ${p(`Amount collected: <strong>$${Number(order.totalPrice).toFixed(2)}</strong>`)}
      ${btn(`${process.env.CLIENT_URL}/orders/${order.id}`, 'View Order →')}
    `),
  }),

  passwordReset: (url) => ({
    subject: 'Reset Your BEKI Shop Password',
    html: base(`${h2('Password Reset')}${p('You requested a password reset. This link expires in 15 minutes.')}${btn(url, 'Reset Password →')}${p('<small style="color:#aaa;">If you did not request this, ignore this email.</small>')}`),
  }),

  orderShipped: (order, user) => ({
    subject: `Your Order Has Shipped! — #${order.id.slice(-8).toUpperCase()}`,
    html: base(`
      ${h2('Your order is on its way! 🚚')}
      ${p(`Hi ${user.name}, order <strong>#${order.id.slice(-8).toUpperCase()}</strong> has been shipped.`)}
      ${order.trackingNumber ? `<div style="background:#e8f4ff;border-radius:6px;padding:14px;margin:14px 0;border-left:4px solid #0070f3;">${p(`<strong>Tracking Number:</strong> ${order.trackingNumber}`)}</div>` : ''}
      ${btn(`${process.env.CLIENT_URL}/orders/${order.id}`, 'Track Your Package →')}
    `),
  }),
};

module.exports = { sendEmail, templates };
