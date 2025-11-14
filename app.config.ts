import "dotenv/config"; // allows use of .env

export default {
  expo: {
    name: "Foodmate",
    slug: "foodmate",
    version: "1.0.0",
    extra: {
      apiUrl: process.env.API_BASE_URL,
      env: process.env.APP_ENV || "development",
      eas: {
        projectId: "ff6ed863-bfd2-4c47-ac5b-ff8d37baff13",
      },
    },
    android: {
      package: "com.cindy.foodmate",
    },
  },
};
