import { CapacitorConfig } from '@capacitor/core';

const config: CapacitorConfig = {
  appId: 'app.lovable.f8e882a13df0405f9761156eb73300cf',
  appName: 'rua-iluminada-ticketing',
  webDir: 'dist',
  server: {
    url: 'https://f8e882a1-3df0-405f-9761-156eb73300cf.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    }
  }
};

export default config;