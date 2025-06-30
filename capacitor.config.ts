import { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.saratchandraacademy.hostelmanagement',
  appName: 'Hostel Management',
  webDir: 'dist',
  // During local builds we want the WebView to load bundled assets.
  // Remove remote URL to avoid stale production site while testing.
  server: {
    androidScheme: 'https',
    // url: 'https://hostel-gray.vercel.app/kiosk'
  },
}

export default config 