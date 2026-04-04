// @ts-check

/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    // timelockrecovery-specter was released with a link to https://niot.space/a3JwIlQqwcb8WLEe.mp4
    // instead of https://files.niot.space/a3JwIlQqwcb8WLEe.mp4
    return [
      {
        source: "/a3JwIlQqwcb8WLEe.mp4",
        destination: "https://files.niot.space/a3JwIlQqwcb8WLEe.mp4",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
