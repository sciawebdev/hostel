import { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.sca.hostel',
  appName: 'sca hostel',
  webDir: 'dist',
  server: {
    androidScheme: 'http',
    hostname: '192.168.0.103',
    port: 3002,
    cleartext: true,
  },
}

export default config 