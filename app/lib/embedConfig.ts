export const streamlyEmbed = {
  version: "1",
  imageUrl: "https://streamly-app.vercel.app/embed.png",
  button: {
    title: "🎥Open Streamly",
    action: {
      type: "launch_miniapp",
      url: "https://streamly-app.vercel.app",
      name: "Streamly",
      splashImageUrl: "https://streamly-app.vercel.app/icon.png",
      splashBackgroundColor: "#ffffff"
    }
  }
};

// For backward compatibility
export const streamlyEmbedFrame = {
  version: "1",
  imageUrl: "https://streamly-app.vercel.app/embed.png",
  button: {
    title: "🎥 Open Streamly",
    action: {
      type: "launch_frame",
      url: "https://streamly-app.vercel.app",
      name: "Streamly",
      splashImageUrl: "https://streamly-app.vercel.app/icon.png",
      splashBackgroundColor: "#ffffff"
    }
  }
};
