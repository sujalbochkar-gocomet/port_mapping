const Fuse = require("fuse.js");
const fs = require("fs");
const path = require("path");
const fsPromises = fs.promises;
// const { spawn } = require('child_process');
// const os = require('os');

class PortMatcher {
  constructor(portsData) {
    /**
     * Initialize the PortMatcher with a list of port data dictionaries.
     * @param {Array} portsData - List of dictionaries containing port information.
     * @throws {Error} If portsData is not an array or is empty.
     */
    if (!Array.isArray(portsData) || portsData.length === 0) {
      throw new Error("portsData must be a non-empty array");
    }
    this.portsData = portsData;
    // this._createFuseIndex();
    // Initialize searchable keys
    this.searchableKeys = ["name", "code","display_name"];
    // Initialize Location searchable keys
    this.locationSearchableKeys = ["country", "region", "city", "state_name"];
    // Initialize ignored keywords
    this.ignoredKeywords = new Set([
      "harbor",
      "seaport",
      "wharf",
      "dock",
      "jetty",
      "anchorage",
      "haven",
      "marina",
      "harborage",
      "mooring",
      "landing",
      "boatyard",
      "roadstead",
      "dockyard",
      "quay",
      "pier",
      "basin",
      "inlet",
      "cove",
      "bay",
      "terminus",
      "depot",
      "station",
      "concluding",
      "final",
      "last",
      "closing",
      "end",
      "terminating",
      "ultimate",
      "extreme",
      "endmost",
      "nethermost",
      "outmost",
      "utmost",
      "terminal",
      "port",
      "international",
      "airport",
    ]);

    this._createFuseIndex();

  }

  

  static async loadPortsData(filePath) {
    /**
     * Asynchronously load port data from a JSON file and filter out unverified ports.
     * @param {string} filePath - The path to the JSON file.
     * @returns {Promise<Array>} Parsed array of verified port data.
     */
    try {
      const data = await fsPromises.readFile(filePath, "utf8");
      const allPorts = JSON.parse(data);

      // Filter out unverified ports
      const verifiedPorts = allPorts.filter(port => {
        // Check if verification_status exists and is true
        // Also ensure the port has required fields
        return port.verified === true &&
          port.display_name;
      });

      return verifiedPorts;
    } catch (error) {
      console.error(`Error loading port data from ${filePath}:`, error);
      throw error;
    }
  }



  normalizeString(str) {
    /**
     * Remove special characters from a string and normalize it.
     * @param {string} str - The input string.
     * @returns {string} Normalized string without special characters.
     */
    return (
      str
        ?.toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ") // Remove special characters except spaces
        .replace(/\s+/g, " ") // Replace multiple spaces with single space
        .trim() || ""
    );
  }

  filterByLocation(inputString) {
    /**
     * Filter ports by location based on input string using exact word matching.
     * @param {string} inputString - The string to match against port names.
     * @returns {Array} List of objects containing matched port data with Location 
     * @throws {Error} If parameters are invalid.
     */
    if (typeof inputString !== "string" || !inputString.trim()) {
      return [];
    }

    const locationKeywords = this.normalizeString(inputString)
      .split(/\s+/)
      .filter(word => !this.ignoredKeywords.has(word));

    return this.portsData.filter(port => {
      // Get all location fields as an array of words
      const locationWords = this.locationSearchableKeys
        .map(key => this.normalizeString(port[key]))
        .join(' ')
        .split(/\s+/)
        .filter(word => word.length > 0);

      // Check if any keyword exactly matches any location word
      return locationKeywords.some(keyword =>
        locationWords.some(word => word === keyword)
      );
    });
  }

  completeNameSearch(inputString) {
    /**
     * Find ports where the input string exactly matches any of the searchable fields.
     * Words must be in the same order.
     * @param {string} inputString - The string to match against port names.
     * @returns {Array} List of objects containing matched port data ,confidence scores and Match Type.
     */
    if (typeof inputString !== "string" || !inputString.trim()) {
      return [];
    }

    const normalizedInput = this.normalizeString(inputString);
    const results = [];

    for (const port of this.portsData) {
      let matchType = "";
      let matched = false;

      for (const key of this.searchableKeys) {
        const normalizedField = this.normalizeString(port[key]);
        if (normalizedField && normalizedField === normalizedInput) {
          matchType = `_${key.toLowerCase().replace(/\s+/g, '_')}`;
          matched = true;
          break;
        }
      }

      for (const alt_name of port["other_names"]) {
        const normalizedField = this.normalizeString(alt_name);
        if (normalizedField && normalizedField === normalizedInput) {
          matchType = "other_names";
          matched = true;
          break;
        }
      }

      if (matched) {
        results.push({
          port_data: port,
          confidence_score: 100,
          match_type: matchType,
          matching_algo: "complete_name"
        });
      }
    }

    return results;
  }


  wordSearch(inputString) {
    /**
     * Find ports by matching individual words and calculating confidence based on word overlap and order.
     * Ignores common keywords defined in ignoredKeywords.
     * @param {string} inputString - The string to match against port names.
     * @returns {Array} List of objects containing matched port data, confidence scores and match type.
     */
    if (typeof inputString !== "string" || !inputString.trim()) {
      return [];
    }

    // Pre-process input words once
    const inputWords = this.normalizeString(inputString)
      .split(/\s+/)
      .filter(word => !this.ignoredKeywords.has(word));

    if (inputWords.length === 0) {
      return [];
    }

    const inputWordsSet = new Set(inputWords);
    const results = [];

    // Helper function to calculate word overlap score
    const calculateOverlapScore = (fieldWordsSet) => {
      const commonWords = [...inputWordsSet].filter(word => fieldWordsSet.has(word)).length;
      const totalWords = inputWordsSet.size + fieldWordsSet.size;
      return totalWords === 0 ? 0 : (2 * commonWords * 100) / totalWords;
    };

    // Helper function to calculate word order score
    const calculateOrderScore = (fieldWords) => {
      if (fieldWords.length === 0) return 0;

      let maxConsecutiveMatches = 0;
      const minLength = Math.min(inputWords.length, fieldWords.length);

      // Optimize order score calculation with a single pass
      for (let i = 0; i <= inputWords.length - minLength; i++) {
        for (let j = 0; j <= fieldWords.length - minLength; j++) {
          let matches = 0;
          while (matches < minLength && inputWords[i + matches] === fieldWords[j + matches]) {
            matches++;
          }
          maxConsecutiveMatches = Math.max(maxConsecutiveMatches, matches);
        }
      }

      return (maxConsecutiveMatches / minLength) * 100;
    };

    // Helper function to process a field value
    const processField = (value, fieldType) => {
      if (!value) return null;

      const fieldWords = this.normalizeString(value)
        .split(/\s+/)
        .filter(word => !this.ignoredKeywords.has(word));

      if (fieldWords.length === 0) return null;

      const fieldWordsSet = new Set(fieldWords);
      const overlapScore = calculateOverlapScore(fieldWordsSet);
      const orderScore = calculateOrderScore(fieldWords);
      const confidence = (overlapScore * 0.6) + (orderScore * 0.4);

      return confidence > 10 ? {
        confidence,
        matchType: fieldType
      } : null;
    };

    // Process each port
    for (const port of this.portsData) {
      let bestMatch = { confidence: 0, matchType: "" };

      // Check searchable fields
      for (const key of this.searchableKeys) {
        const match = processField(port[key], key.toLowerCase().replace(/\s+/g, '_'));
        if (match && match.confidence > bestMatch.confidence) {
          bestMatch = match;
        }
      }




      // Check other names
      for (const altName of port.other_names) {
        const match = processField(altName, "other_names");
        if (match && match.confidence > bestMatch.confidence) {
          bestMatch = match;
        }
      }

      if (bestMatch.confidence > 10) {
        results.push({
          port_data: port,
          confidence_score: parseFloat(bestMatch.confidence.toFixed(2)),
          match_type: bestMatch.matchType
        });
      }
    }

    return results.sort((a, b) => b.confidence_score - a.confidence_score);
  }


  _createFuseIndex() {
    const searchableKeyConfigs = this.searchableKeys.map(key => ({
      name: key,
      getFn: (port) => {
        const value = port[key];
        return value ? this.normalizeString(value).split(/\s+/)
        .filter(word => !this.ignoredKeywords.has(word))
        .join(" ") : '';
      }
    }));
  
    const otherNamesConfig = {
      name: 'other_names',
      getFn: (port) => {
        if (!Array.isArray(port.other_names)) return [];
        return port.other_names
          .map(name => {
            const normalized = this.normalizeString(name);
            return normalized
              .split(/\s+/)                    
              .filter(word => !this.ignoredKeywords.has(word)) 
              .join(" ");                      
          })
          .filter(name => name.trim() !== "");  // Remove empty entries
      }
    };
  
    const options = {
      keys: [...searchableKeyConfigs, otherNamesConfig],
      threshold: 0.4,
      includeScore: true,
      findAllMatches: true,
      includeMatches: true,
      tokenize: true,
      tokenSeparator: / +/
    };
  
    this.fuse = new Fuse(this.portsData, options);
  }

  fuzzySearch(inputString) {
    /**
     * Find matching ports based on input string using Fuse.js fuzzy matching.
     * @param {string} inputString - The string to match against port names.
     * @returns {Array} List of objects containing matched port data and confidence scores.
     * @throws {Error} If parameters are invalid.
     */
    if (typeof inputString !== "string" || !inputString.trim()) {
      return [];
    }

    inputString = this.normalizeString(inputString)
      .split(/\s+/)
      .filter(word => !this.ignoredKeywords.has(word))
      .join(" ");

    const fuseResults = this.fuse.search(inputString, { limit: 10 });

    // Convert Fuse's score (0 = perfect match) to a confidence score (0-100)
    const results = fuseResults
      .map((result) => {
        let matchType = result.matches[0].key;

        // If the match is from other_names, we need to check which specific name matched
        if (matchType === 'other_names') {
          const matchedName = result.matches[0].value;
          // Find the specific other name that matched
          const matchedOtherName = result.item.other_names.find(
            name => this.normalizeString(name) === matchedName
          );
          if (matchedOtherName) {
            matchType = `other_names:${matchedOtherName}`;
          }
        }

        return {
          port_data: result.item,
          confidence_score: (1 - result.score) * 100,
          match_type: matchType,
        };
      });

    return results;
  }

  
  async cascadingSearch(inputString, portType = null) {
    /**
     * Perform a cascading search that tries different search methods in order,
     * filtering first by port_type if specified, then by location if possible.
     * @param {string} inputString - The string to match against port names.
     * @param {string} portType - Optional port type to filter results (e.g., 'sea', 'air')
     * @returns {Array} List of objects containing matched port data.
     */
    if (typeof inputString !== "string" || this.normalizeString(inputString) === "") {
      return [];
    }

    // Store original portsData
    const originalPortsData = this.portsData;

    try {
      // Step 1: Filter by port_type if specified
      if (portType) {
        this.portsData = this.portsData.filter(port => port.port_type === portType);
        // If no ports match the type, return empty results
        if (this.portsData.length === 0) {
          return [];
        }
      }

      // Step 2: Try location filtering
      const locationMatches = this.filterByLocation(inputString);
      if (locationMatches.length > 0) {
        this.portsData = locationMatches;
      }

      // Step 3: Try Exact Full Name Search
      const completeMatches = this.completeNameSearch(inputString);
      if (completeMatches.length > 0) {
        return completeMatches.map((port) => ({
          ...port,
          match_algo_type: "exact",
        }));
      }

      // Step 4: Try Word Search
      const wordMatches = this.wordSearch(inputString);
      if (wordMatches.length > 0) {
        return wordMatches.map((port) => ({
          ...port,
          match_algo_type: "word",
        }));
      }

      

      // // Step 6: Try Fuzzy Search (Fuse.js)
      // const fuzzyMatches = this.fuzzySearch(inputString);
      // if (fuzzyMatches.length > 0) {
      //   return fuzzyMatches.map((result) => ({
      //     ...result,
      //     match_algo_type: "fuzzy",
      //   }));
      // }

      return [];
    } finally {
      // Always restore the original portsData
      this.portsData = originalPortsData;
    }
  }


}
// 

// Example usage
if (require.main === module) {
  (async () => {
    try {
      // Get the absolute path to DummyData.json
      const currentDir = __dirname;
      const dataDir = path.join(path.dirname(currentDir), "./Data");
      const dummyDataPath = path.join(dataDir, "data.json");

      // Load port data asynchronously
      const portsData = await PortMatcher.loadPortsData(dummyDataPath);

      // Initialize matcher
      const matcher = new PortMatcher(portsData);

      // Example searches based on actual data
      const testCases = ["Port Klang"];

      console.log("Testing port matching with various inputs:");
      console.log("-".repeat(50));

      // matcher.printData();
      testCases.forEach((testInput) => {
        console.log(`\nSearching for: ${testInput}`);
        const results = matcher.cascadingSearch(testInput,"air_port");
        console.log(JSON.stringify(results[0], null, 2));
      });
    } catch (error) {
      console.error("Error during initialization:", error);
    }
  })();
}

module.exports = PortMatcher;




// Functions to print the database

// printData() {
// /**
//  * Print the contents of the port data in a readable format.
//  */
// if (!this.portsData.length) {
//   console.log("\nNo port data available");
//   return;
// }
// console.log("\nPort Data Contents:");
// console.log("-".repeat(50));
// this.portsData.forEach(port => {
//   console.log("\nPort Data:");
//   Object.entries(port).forEach(([key, value]) => {
//     console.log(`  ${key}: ${value}`);
//   });
// });
// console.log("\n");
// }
