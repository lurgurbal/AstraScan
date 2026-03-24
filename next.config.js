/** @type {import('next').NextConfig} */
const nextConfig = {
  // Active le mode strict de React
  reactStrictMode: true,

  // En production, les logs de requêtes API sont compressés
  compress: true,

  // Configuration expérimentale (optionnel)
  experimental: {
    // typedRoutes: true, // Décommenter quand stable
  },
};

module.exports = nextConfig;
