import { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.sca.hostel',
  appName: 'sca hostel',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    url: 'https://hostel-gray.vercel.app/kiosk'
  },
}

export default config 