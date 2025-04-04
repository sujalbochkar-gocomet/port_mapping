// Import map_port function
const map_port = require("../port_mapper/portMapper.js");

// Define an async function to test map_port
async function testPortMapper() {
  try {
    // Test parameters
    const query = "jfk";
    const portType = "air_port";

    console.log(
      `Searching for ports with query: "${query}" and type: "${portType}"`
    );

    // Call map_port function
    const results = await map_port(query, portType);

    // Print results
    console.log("Search results:");
    console.log(JSON.stringify(results, null, 2));
    console.log(`Found ${results.length} matching ports`);

    // Print top 3 matches with key information
  } catch (error) {
    console.error("Error during port mapping:", error);
  }
}

// Execute the test function
testPortMapper()
  .then(() => console.log("Test completed"))
  .catch((err) => console.error("Test failed:", err));
