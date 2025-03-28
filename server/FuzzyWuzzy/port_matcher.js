const fuzz = require('fuzzball');
const fs = require('fs');
const path = require('path');

class PortMatcher {
    constructor(portsData) {
        /**
         * Initialize the PortMatcher with a list of port data dictionaries.
         * @param {Array} portsData - List of dictionaries containing port information
         * @throws {Error} If portsData is not an array or is empty
         */
        if (!Array.isArray(portsData) || portsData.length === 0) {
            throw new Error('portsData must be a non-empty array');
        }
        this.portsData = portsData;
        this.portsDict = this._createPortsDict();
    }

    _createPortsDict() {
        /**
         * Create a dictionary mapping various identifiers to port data.
         * @returns {Object} Dictionary mapping identifiers to port data
         */
        const portsDict = {};

        for (const port of this.portsData) {
            if (!port || typeof port !== 'object') {
                console.warn('Skipping invalid port entry:', port);
                continue;
            }

            // Map main port name
            if (port['Main Port Name'] && typeof port['Main Port Name'] === 'string') {
                const mainName = port['Main Port Name'].toLowerCase().trim();
                if (mainName) {
                    portsDict[mainName] = port;
                }
            }

            // Map alternate port name if exists
            if (port['Alternate Port Name'] && typeof port['Alternate Port Name'] === 'string') {
                const altName = port['Alternate Port Name'].toLowerCase().trim();
                if (altName) {
                    portsDict[altName] = port;
                }
            }

            // Map UN/LOCODE if exists
            if (port['UN/LOCODE'] && typeof port['UN/LOCODE'] === 'string') {
                const locode = port['UN/LOCODE'].toLowerCase().trim();
                if (locode) {
                    portsDict[locode] = port;
                }
            }
        }

        if (Object.keys(portsDict).length === 0) {
            throw new Error('No valid port entries found in the provided data');
        }

        return portsDict;
    }

    findMatches(inputString, threshold = 60, maxResults = 3) {
        /**
         * Find matching ports based on input string using fuzzy matching.
         * @param {string} inputString - The string to match against port names
         * @param {number} threshold - Minimum similarity score (0-100) for matches
         * @param {number} maxResults - Maximum number of results to return
         * @returns {Array} List of objects containing matched port data and confidence scores
         * @throws {Error} If parameters are invalid
         */
        // Validate input parameters
        if (typeof inputString !== 'string' || !inputString.trim()) {
            return [];
        }

        if (typeof threshold !== 'number' || threshold < 0 || threshold > 100) {
            throw new Error('Threshold must be a number between 0 and 100');
        }

        if (typeof maxResults !== 'number' || maxResults < 1) {
            throw new Error('maxResults must be a positive number');
        }

        inputString = inputString.toLowerCase().trim();
        const portNames = Object.keys(this.portsDict);

        if (portNames.length === 0) {
            return [];
        }

        // Get matches using fuzzy matching
        const matches = fuzz.extract(inputString, portNames, {
            limit: Math.min(maxResults, portNames.length),
            scorer: fuzz.ratio
        });

        // Filter matches based on threshold and format results
        const results = [];
        for (const [portName, score] of matches) {
            if (score >= threshold) {
                const portData = this.portsDict[portName];
                if (portData) {
                    results.push({
                        port_data: portData,
                        confidence_score: score
                    });
                }
            }
        }

        return results;
    }

    getPortByName(portName) {
        /**
         * Get port data by exact name match (case-insensitive).
         * @param {string} portName - The exact port name to look up
         * @returns {Object|null} Port data dictionary if found, null otherwise
         */
        if (typeof portName !== 'string' || !portName.trim()) {
            return null;
        }
        return this.portsDict[portName.toLowerCase().trim()] || null;
    }

    printDictionary() {
        /**
         * Print the contents of the ports dictionary in a readable format.
         */
        if (Object.keys(this.portsDict).length === 0) {
            console.log("\nPort Dictionary is empty");
            return;
        }

        console.log("\nPort Dictionary Contents:");
        console.log("-".repeat(50));
        
        for (const [key, value] of Object.entries(this.portsDict)) {
            console.log(`\nKey: ${key}`);
            console.log("Port Data:");
            for (const [field, fieldValue] of Object.entries(value)) {
                console.log(`  ${field}: ${fieldValue}`);
            }
        }
        console.log("\n");
    }
}

// Example usage
if (require.main === module) {
    // Get the absolute path to DummyData.json
    const currentDir = __dirname;
    const dataDir = path.join(path.dirname(currentDir), '../Data');
    const dummyDataPath = path.join(dataDir, 'DummyData.json');

    // Load port data from DummyData.json
    const portsData = JSON.parse(fs.readFileSync(dummyDataPath, 'utf8'));

    // Initialize matcher
    const matcher = new PortMatcher(portsData);


    // Example searches based on actual data
    const testCases = [
        "jnp", 
    ];

    console.log("Testing port matching with various inputs:");
    console.log("-".repeat(50));

    for (const testInput of testCases) {
        console.log(`\nSearching for: ${testInput}`);
        const results = matcher.findMatches(testInput, 50);
        console.log(JSON.stringify(results, null, 2));
    }
}

module.exports = PortMatcher;