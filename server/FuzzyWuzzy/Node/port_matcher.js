const fuzz = require('fuzzball');
const fs = require('fs');
const path = require('path');

class PortMatcher {
    constructor(portsData) {
        /**
         * Initialize the PortMatcher with a list of port data dictionaries.
         * @param {Array} portsData - List of dictionaries containing port information
         */
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
            // Map main port name
            if (port['Main Port Name']) {
                portsDict[port['Main Port Name'].toLowerCase()] = port;
            }

            // Map alternate port name if exists
            if (port['Alternate Port Name'] && port['Alternate Port Name']) {
                portsDict[port['Alternate Port Name'].toLowerCase()] = port;
            }

            // Map UN/LOCODE if exists
            if (port['UN/LOCODE'] && port['UN/LOCODE']) {
                portsDict[port['UN/LOCODE'].toLowerCase()] = port;
            }
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
         */
        if (!inputString) {
            return [];
        }

        inputString = inputString.toLowerCase();
        const portNames = Object.keys(this.portsDict);

        // Get matches using fuzzy matching
        const matches = fuzz.extract(inputString, portNames, {
            limit: maxResults,
            scorer: fuzz.ratio
        });

        // Filter matches based on threshold and format results
        const results = [];
        for (const [portName, score] of matches) {
            if (score >= threshold) {
                const portData = this.portsDict[portName];
                results.push({
                    port_data: portData,
                    confidence_score: score,
                    // match_type: this._determineMatchType(portName, inputString)
                });
            }
        }

        return results;
    }

    // _determineMatchType(matchedName, inputString) {
    //     /**
    //      * Determine the type of match based on the matched name and input string.
    //      * @param {string} matchedName - The matched port name
    //      * @param {string} inputString - The input search string
    //      * @returns {string} Type of match (exact, prefix, contains, or fuzzy)
    //      */
    //     if (matchedName === inputString) {
    //         return "exact";
    //     } else if (matchedName.startsWith(inputString)) {
    //         return "prefix";
    //     } else if (matchedName.includes(inputString)) {
    //         return "contains";
    //     } else {
    //         return "fuzzy";
    //     }
    // }

    getPortByName(portName) {
        /**
         * Get port data by exact name match (case-insensitive).
         * @param {string} portName - The exact port name to look up
         * @returns {Object|null} Port data dictionary if found, null otherwise
         */
        return this.portsDict[portName.toLowerCase()] || null;
    }

    printDictionary() {
        /**
         * Print the contents of the ports dictionary in a readable format.
         */
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
        "Maurer",      // Exact match
        "New Harbor",  // Exact match
        "United States", // Region match
        "Iharana",     // Exact match
        "Delta"        // Partial match for "Delta Terminal"
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