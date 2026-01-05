module.exports = {
  rista: {
    // Use remote Swagger endpoint when accessible:
    // input: 'https://ristaapps.com/api/documentation/swagger.json',
    
    // For local development or restricted environments, use local file:
    input: './swagger.json',
    output: {
      mode: 'single',
      target: './src/generated/rista/ristaApi.ts',
      schemas: './src/generated/rista/models',
      client: 'axios',
      clean: true,
      override: {
        mutator: {
          path: './src/lib/ristaClient.ts',
          name: 'customInstance',
        },
      },
    },
  },
};
