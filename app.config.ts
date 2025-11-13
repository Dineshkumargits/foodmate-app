import 'dotenv/config'; // allows use of .env

export default {
  expo: {
    name: "Foodmate",
    slug: "foodmate",
    version: "1.0.0",
    extra: {
      apiUrl: process.env.API_BASE_URL,
      env: process.env.APP_ENV || "development",
    },
  },
};
