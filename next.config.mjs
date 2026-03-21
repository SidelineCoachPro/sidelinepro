/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // @react-pdf/renderer has Node-only deps; stub them out for the browser bundle
      config.resolve.alias = {
        ...config.resolve.alias,
        canvas: false,
        encoding: false,
      }
    }
    return config
  },
}

export default nextConfig
