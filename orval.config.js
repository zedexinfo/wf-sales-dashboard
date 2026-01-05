module.exports = {
  rista: {
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
