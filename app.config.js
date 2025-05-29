import "dotenv/config";
export default {
  expo: {
    name: "Viet Chef",
    slug: "viet-chef",
    owner: "thangcayep",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/logo.png",
    scheme: "vietchef",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    splash: {
      image: "./assets/images/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.thangcayep.vietchef",
    },
    android: {
      permissions: ["ACCESS_FINE_LOCATION", "ACCESS_COARSE_LOCATION", "POST_NOTIFICATIONS"],
      googleServiceFile: "./google-services.json",
      adaptiveIcon: {
        foregroundImage: "./assets/images/logo1.png",
        backgroundColor: "#ffffff",
      },
      package: "com.thangcayep.vietchef",
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png",
    },
    plugins: ["expo-router", "@react-native-google-signin/google-signin"],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      router: {
        origin: false,
      },
      eas: {
        projectId: "af076336-773f-45ab-a366-b43c92c97da5",
      },
    },
    notification: {
      icon: "./assets/images/logo.png",
      color: "#FFFFFF"
    }
  },
};
