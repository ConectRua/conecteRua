import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.bd5768e661f3400d847c62bf5af3dc5b',
  appName: 'geo-samambaia-map',
  webDir: 'dist',
  server: {
    url: 'https://bd5768e6-61f3-400d-847c-62bf5af3dc5b.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    Geolocation: {
      permissions: {
        ACCESS_COARSE_LOCATION: 'To determine your approximate location',
        ACCESS_FINE_LOCATION: 'To determine your precise location'
      }
    }
  }
};

export default config;