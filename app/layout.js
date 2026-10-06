import './globals.css';
import { BRAND } from '@/lib/brand';

export const metadata = {
  metadataBase: new URL(BRAND.siteUrl),
  title: {
    default: 'Aurum — Jewellery that gives a smile',
    template: '%s · Aurum',
  },
  description:
    'Gift-ready rings, necklaces, earrings and bracelets from Aurum. Every piece arrives boxed with a handwritten To/From tag.',
  openGraph: {
    title: 'Aurum — Jewellery that gives a smile',
    description: 'Gift-ready jewellery, boxed and tagged for someone you love.',
    images: ['/brand/aurum-logo.jpg'],
    type: 'website',
    locale: 'en_IN',
  },
};

export const viewport = {
  themeColor: '#8a3c43',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500&family=Jost:wght@300;400;500;600&family=Parisienne&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
