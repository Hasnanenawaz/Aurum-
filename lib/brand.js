// Brand details in one place. Change these (or the env vars) and the whole site updates.
export const BRAND = {
  name: 'Aurum',
  tagline: 'gives smile',
  instagramHandle: 'aurum_givessmile',
  instagramUrl: 'https://www.instagram.com/aurum_givessmile/',
  whatsappNumber: (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '').replace(/[^0-9]/g, ''),
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
};

export function whatsappLink(text) {
  if (!BRAND.whatsappNumber) return BRAND.instagramUrl;
  return `https://wa.me/${BRAND.whatsappNumber}?text=${encodeURIComponent(text)}`;
}
