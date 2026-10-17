/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: [
    '*.ngrok-free.app',
    '*.ngrok.app',
    '*.ngrok.io',
    'localhost:3000',
    '127.0.0.1:3000',
  ],
};

export default nextConfig;

