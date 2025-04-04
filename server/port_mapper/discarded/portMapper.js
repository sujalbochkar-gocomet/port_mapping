const PortMatcher = require('../mapper');
const path = require('path');

let matcher = null;

// Initialize the matcher
async function initializeMatcher() {
    if (matcher) return; // Already initialized
    
    try {
        // Get the path to data.json
        const dataDir = path.join(__dirname, "../Data");
        const dataPath = path.join(dataDir, "data.json");
        
        // Load port data and initialize matcher
        const portsData = await PortMatcher.loadPortsData(dataPath);
        matcher = new PortMatcher(portsData);
    } catch (error) {
        console.error("Error initializing port matcher:", error);
        throw error;
    }
}

/**
 * Search for ports matching the input query
 * @param {string} inputQuery - The search query string
 * @param {string} portType - Optional port type ('sea' or 'air')
 * @returns {Promise<Array>} Array of matching ports with confidence scores
 */
async function map_port(inputQuery, portType = null) {
    // Initialize matcher if not already done
    await initializeMatcher();
    
    try {
        const results = await matcher.aggregatedResults(inputQuery, portType);
        return results;
    } catch (error) {
        console.error("Error searching ports:", error);
        throw error;
    }
}

module.exports = map_port; 