const RISTA_SWAGGER_URL =
  process.env.RISTA_SWAGGER_URL ||
  "https://ristaapps.com/api/documentation/swagger.json";

module.exports = {
  rista: {
    input: {
      target: RISTA_SWAGGER_URL,
      filters: {
        tags: ["Sale", "Business", "Analytics"],
      },
    },
    output: {
      target: "./src/api",
      mode: "tags-split",
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
