// src/lib/invoice.js
// Generates a print-ready HTML invoice in a new window. The browser's
// "Save as PDF" in the print dialog produces a downloadable PDF — no backend
// or library needed. (A backend PDF endpoint with sequential invoice numbers
// can be added later for official/GST invoices.)

const COMPANY = {
  name: 'Rudhita',
  tagline: 'Crafted Luxury',
  email: 'hello@rudhita.com',
  // Edit these to your registered business details for a compliant invoice:
  address: 'Rudhita Studio, Pune, Maharashtra, India',
  gstin: '',   // add your GSTIN here if registered
};

function inr(n) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(Number(n) || 0);
}

export function generateInvoice(order) {
  const items = order.items || [];
  const subtotal = items.reduce((s, i) => s + (i.line_total ?? (Number(i.price_at_purchase) * i.quantity)), 0);
  const total = Number(order.total_amount) || subtotal;
  // Derive tax/shipping as the difference (backend stored the authoritative total)
  const taxAndShip = Math.max(0, total - subtotal);
  const invoiceNo = `RUD-INV-${String(order.id).padStart(5, '0')}`;
  const date = order.created_at ? new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '';

  const rows = items.map((i) => `
    <tr>
      <td>${escapeHtml(i.product_name || 'Item')}</td>
      <td style="text-align:center">${i.quantity}</td>
      <td style="text-align:right">${inr(i.price_at_purchase)}</td>
      <td style="text-align:right">${inr(i.line_total ?? (Number(i.price_at_purchase) * i.quantity))}</td>
    </tr>`).join('');

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${invoiceNo}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #16120f; margin: 0; padding: 40px; }
    .head { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #16120f; padding-bottom: 20px; }
    .brand { font-size: 30px; font-weight: 800; letter-spacing: -0.5px; }
    .brand span { color: #e8472a; }
    .tag { font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #888; margin-top: 4px; }
    .meta { text-align: right; font-size: 13px; line-height: 1.6; }
    .meta b { font-size: 16px; }
    h2 { font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; color: #888; margin: 28px 0 8px; }
    .box { font-size: 14px; line-height: 1.6; }
    table { width: 100%; border-collapse: collapse; margin-top: 28px; font-size: 14px; }
    th { background: #16120f; color: #fff; text-align: left; padding: 10px 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; }
    th:nth-child(2){text-align:center} th:nth-child(3),th:nth-child(4){text-align:right}
    td { padding: 12px; border-bottom: 1px solid #e5e0d8; }
    .totals { margin-top: 20px; margin-left: auto; width: 280px; font-size: 14px; }
    .totals div { display: flex; justify-content: space-between; padding: 6px 0; }
    .totals .grand { border-top: 2px solid #16120f; margin-top: 6px; padding-top: 10px; font-size: 18px; font-weight: 800; }
    .foot { margin-top: 50px; padding-top: 20px; border-top: 1px solid #e5e0d8; font-size: 12px; color: #888; text-align: center; }
    .status { display:inline-block; padding:3px 10px; border:2px solid #16120f; font-size:11px; text-transform:uppercase; letter-spacing:1px; font-weight:700;}
    @media print { body { padding: 20px; } .noprint { display: none; } }
  </style></head><body>
    <div class="head">
      <div>
        <div class="brand">${COMPANY.name}<span>.</span></div>
        <div class="tag">${COMPANY.tagline}</div>
      </div>
      <div class="meta">
        <b>INVOICE</b><br>
        ${invoiceNo}<br>
        ${date}<br>
        <span class="status">${escapeHtml(order.payment_status || '')}</span>
      </div>
    </div>

    <div style="display:flex; gap:60px;">
      <div>
        <h2>Billed To</h2>
        <div class="box">
          <b>${escapeHtml(order.customer_name || '')}</b><br>
          ${escapeHtml(order.customer_email || '')}<br>
          ${order.customer_phone ? escapeHtml(order.customer_phone) + '<br>' : ''}
          ${escapeHtml(order.shipping_address || '')}
        </div>
      </div>
      <div>
        <h2>From</h2>
        <div class="box">
          <b>${COMPANY.name}</b><br>
          ${COMPANY.address}<br>
          ${COMPANY.email}${COMPANY.gstin ? '<br>GSTIN: ' + COMPANY.gstin : ''}
        </div>
      </div>
    </div>

    <table>
      <thead><tr><th>Item</th><th>Qty</th><th>Unit Price</th><th>Amount</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>

    <div class="totals">
      <div><span>Subtotal</span><span>${inr(subtotal)}</span></div>
      <div><span>Tax + Shipping</span><span>${inr(taxAndShip)}</span></div>
      <div class="grand"><span>Total</span><span>${inr(total)}</span></div>
    </div>

    <div class="foot">
      Thank you for shopping with ${COMPANY.name}. ${COMPANY.gstin ? '' : 'This is not a GST tax invoice.'}<br>
      Questions? ${COMPANY.email}
    </div>

    <div class="noprint" style="text-align:center; margin-top:30px;">
      <button onclick="window.print()" style="padding:12px 28px; background:#16120f; color:#fff; border:none; font-size:14px; cursor:pointer;">Print / Save as PDF</button>
    </div>
  </body></html>`;

  const w = window.open('', '_blank');
  if (!w) { alert('Please allow pop-ups to view the invoice.'); return; }
  w.document.write(html);
  w.document.close();
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
