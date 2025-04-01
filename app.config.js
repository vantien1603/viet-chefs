import 'dotenv/config';
export default
  {
    "expo": {
      "name": "viet-chef",
      "slug": "viet-chef",
      "version": "1.0.0",
      "orientation": "portrait",
      "icon": "./assets/images/icon.png",
      "scheme": "vietchef",
      "userInterfaceStyle": "automatic",
      "newArchEnabled": true,
      "splash": {
        "image": "./assets/images/splash-icon.png",
        "resizeMode": "contain",
        "backgroundColor": "#ffffff"
      },
      "ios": {
        "supportsTablet": true,
        "bundleIdentifier": "com.thangcayep.vietchef"
      },
      "android": {
        "permissions": [
          "ACCESS_FINE_LOCATION",
          "ACCESS_COARSE_LOCATION"
        ],
        "adaptiveIcon": {
          "foregroundImage": "./assets/images/adaptive-icon.png",
          "backgroundColor": "#ffffff"
        },
        "package": "com.thangcayep.vietchef",
      },
      "web": {
        "bundler": "metro",
        "output": "static",
        "favicon": "./assets/images/favicon.png"
      },
      "plugins": [
        "expo-router"
      ],
      "experiments": {
        "typedRoutes": true
      },
      "extra": {
        "router": {
          "origin": false
        },
        "eas": {
          "projectId": "7633a8b3-2237-454d-98da-394babd667ae"
        },
        "apiKey": process.env.API_KEY,
        "authDomain": process.env.AUTH_DOMAIN,
        "projectId": process.env.PROJECT_ID,
        "storageBucket": process.env.STORAGE_BUCKET,
        "messagingSenderId": process.env.MESSAGING_SENDER_ID,
        "appId": process.env.APP_ID
      }
    }
  }