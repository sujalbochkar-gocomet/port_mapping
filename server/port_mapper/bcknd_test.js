const map_port = require('./portMapper');

// Example usage
async function example() {
    try {
        // Search for ports
        const results = await map_port("jfk", "sea_port");
        console.log(results[0].id);
        
        // Search without port type
        const allResults = await map_port("jfk");
        console.log(allResults);
    } catch (error) {
        console.error("Error:", error);
    }
}

example();