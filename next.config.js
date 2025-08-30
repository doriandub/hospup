/** @type {import('next').NextConfig} */
// Force restart to apply image domains configuration
const nextConfig = {
  reactStrictMode: false,
  transpilePackages: ['@hospup/shared-types'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'hospup-saas.s3.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 'hospup-demo-videos.s3.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 'hospup-files.s3.eu-west-1.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 'hospup-files.s3.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'www.learningcontainer.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: 'commondatastorage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
      {
        protocol: 'https',
        hostname: 'dummyimage.com',
      }
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // headers: async () => [
  //   {
  //     source: '/(.*)',
  //     headers: [
  //       {
  //         key: 'X-Frame-Options',
  //         value: 'DENY',
  //       },
  //       {
  //         key: 'X-Content-Type-Options',
  //         value: 'nosniff',
  //       },
  //       {
  //         key: 'Referrer-Policy',
  //         value: 'origin-when-cross-origin',
  //       },
  //       {
  //         key: 'Content-Security-Policy',
  //         value: "default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;",
  //       },
  //     ],
  //   },
  // ],
  // env: {
  //   NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  //   NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  // },
}

module.exports = nextConfig