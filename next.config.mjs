/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Product placeholders are SVG files we ship ourselves.
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // Uploaded photos come from our own /api/uploads route.
    localPatterns: [{ pathname: '/api/uploads/**' }, { pathname: '/placeholders/**' }, { pathname: '/brand/**' }],
    // On Vercel, uploads live in Vercel Blob.
    remotePatterns: [{ protocol: 'https', hostname: '*.public.blob.vercel-storage.com', pathname: '/products/**' }],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        ],
      },
    ];
  },
};

export default nextConfig;
