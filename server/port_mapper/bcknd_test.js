const map_port = require('./portMapper');

// Example usage
async function example() {
    try {
        // Search for ports
        const results = await map_port("jfk", "air_port");
        console.log(results.slice(0, 3));
        

        console.log("=".repeat(80));
        // Search without port type
        const allResults = await map_port("jfk");
        console.log(allResults.slice(0, 3));
    } catch (error) {
        console.error("Error:", error);
    }
}

example();