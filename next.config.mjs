/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // @react-pdf/renderer no debe ser empaquetado por el bundler del servidor.
  serverExternalPackages: ["@react-pdf/renderer"],
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb", // evidencias/documentos
    },
  },
};

export default nextConfig;
