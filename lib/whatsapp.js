// Builds the pre-filled WhatsApp message a customer sends after checkout.
// Aurum's real conversion happens in chat, so the website hands the
// order over to WhatsApp instead of taking card payments (for now).
import { formatINR } from './catalog.js';

export function whatsappNumber() {
  return (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '').replace(/[^0-9]/g, '');
}

export function orderWhatsappUrl(order) {
  const number = whatsappNumber();
  if (!number) return null;
  const lines = [
    `Hi Aurum! I'd like to place order #${order.number} 🎁`,
    '',
    ...order.items.map((i) => `• ${i.name} × ${i.qty} — ${formatINR(i.unitPrice * i.qty)}`),
    '',
    `Total: ${formatINR(order.total)}`,
    `Name: ${order.customer.name}`,
    `Deliver to: ${order.customer.address}`,
  ];
  if (order.customer.giftNote) lines.push(`Gift tag note: "${order.customer.giftNote}"`);
  return `https://wa.me/${number}?text=${encodeURIComponent(lines.join('\n'))}`;
}
