const dotenv = require("dotenv");

dotenv.config();

module.exports = {
  rista: {
    input: {
      // Use live Rista Swagger endpoint for latest API types
      target:
        process.env.RISTA_SWAGGER_URL ||
        "https://ristaapps.com/api/documentation/swagger.json",
      
      // Filter to only include needed endpoints and types
      filters: {
        tags: ["Sale", "Business", "Analytics"],
      },
    },
    output: {
      target: "./src/generated/rista/ristaApi.ts",
      mode: "single",
      schemas: "./src/generated/rista/models",
      client: "axios",
      clean: true,
      prettier: true,
      tslint: true,
      override: {
        mutator: {
          path: "./src/lib/ristaClient.ts",
          name: "customInstance",
        },
      },
    },
  },
};
