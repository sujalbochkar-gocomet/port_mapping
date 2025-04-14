// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Port Mapping API",
      version: "1.0.0",
      description: "API for port mapping and shipment management",
    },
    servers: [
      {
        url:  "http://localhost:3000",
        description: "Development server",
      },
    ],
    components: {
      schemas: {
        Port: {
          type: "object",
          properties: {
            _id: { type: "string" },
            id: { type: "string" },
            name: { type: "string" },
            display_name: { type: "string" },
            port_type: { type: "string" },
            code: { type: "string" },
            other_names: { type: "array", items: { type: "string" } },
            city: { type: "string" },
            state_name: { type: "string" },
            country: { type: "string" },
            country_code: { type: "string" },
            region: { type: "string" },
            lat_lon: {
              type: "object",
              properties: {
                lat: { type: "number" },
                lon: { type: "number" },
              },
            },
          },
        },
        PortSearchResult: {
          type: "object",
          properties: {
            port: { $ref: "#/components/schemas/Port" },
            verified: { type: "boolean" },
            match_score: { type: "number" },
            match_type: { type: "string" },
            sources: { type: "array", items: { type: "string" } },
          },
        },
        Shipment: {
          type: "object",
          properties: {
            id: { type: "string" },
            carrierType: { type: "string" },
            pol: { $ref: "#/components/schemas/Port" },
            pod: { $ref: "#/components/schemas/Port" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
      },
    },
  },
  apis: ["./src/script.ts"], // Path to the API docs
};

export default swaggerOptions;
