const Fuse = require("fuse.js");
const fs = require("fs");
const path = require("path");
const fsPromises = fs.promises;

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
    this._createFuseIndex();
    // Initialize ignored keywords
    this.ignoredKeywords = new Set([
      "Harbor",
      "Seaport",
      "Wharf",
      "Dock",
      "Jetty",
      "Anchorage",
      "Haven",
      "Marina",
      "Harborage",
      "Mooring",
      "Landing",
      "Boatyard",
      "Roadstead",
      "Dockyard",
      "Quay",
      "Pier",
      "Basin",
      "Inlet",
      "Cove",
      "Bay",
      "Terminus",
      "Depot",
      "Station",
      "Concluding",
      "Final",
      "Last",
      "Closing",
      "End",
      "Terminating",
      "Ultimate",
      "Extreme",
      "Endmost",
      "Nethermost",
      "Outmost",
      "Utmost",
      "Terminal",
      "Port",
    ]);
  }

  _createFuseIndex() {
    /**
     * Create the Fuse index using enhanced options.
     */
    const options = {
      keys: ["Main Port Name", "Alternate Port Name", "UN/LOCODE"],
      threshold: 0.5,
      includeScore: true,
      includeMatches: false, //Lets Use this if we want to understand why it matched
      findAllMatches: false,
    };
    this.fuse = new Fuse(this.portsData, options);
  }

  static async loadPortsData(filePath) {
    /**
     * Asynchronously load port data from a JSON file.
     * @param {string} filePath - The path to the JSON file.
     * @returns {Promise<Array>} Parsed array of port data.
     */
    try {
      const data = await fsPromises.readFile(filePath, "utf8");
      return JSON.parse(data);
    } catch (error) {
      console.error(`Error loading port data from ${filePath}:`, error);
      throw error;
    }
  }

  normalizeString(str) {
    // Helper method for string normalization.
    return str?.toLowerCase().trim() || "";
  }

  calculateAccuracy(input, target) {
    /**
     * Calculate confidence score between input and target strings.
     * @param {string} input - The input string to compare
     * @param {string} target - The target string to compare against
     * @returns {number} Confidence score between 0 and 100
     */
    if (!input || !target) return 0;

    const normalizedInput = this.normalizeString(input);
    const normalizedTarget = this.normalizeString(target);

    // If strings are exactly equal after normalization
    if (normalizedInput === normalizedTarget) return 100;

    // Calculate word-level similarity
    const inputWords = normalizedInput.split(/\s+/);
    const targetWords = normalizedTarget.split(/\s+/);

    // Count matching words
    const matchingWords = inputWords.filter((word) =>
      targetWords.includes(word)
    );
    const totalWords = Math.max(inputWords.length, targetWords.length);

    // Calculate confidence based on matching words
    const wordConfidence = (matchingWords.length / totalWords) * 100;

    // Calculate position-based confidence
    let positionConfidence = 0;
    if (matchingWords.length > 0) {
      const inputWordPositions = matchingWords.map((word) =>
        inputWords.indexOf(word)
      );
      const targetWordPositions = matchingWords.map((word) =>
        targetWords.indexOf(word)
      );

      // Calculate how well word positions match
      const positionMatches = inputWordPositions.filter(
        (pos, idx) => Math.abs(pos - targetWordPositions[idx]) <= 1
      );

      positionConfidence =
        (positionMatches.length / matchingWords.length) * 100;
    }

    // Combine confidences with weights
    return wordConfidence * 0.7 + positionConfidence * 0.3;
  }

  removeSpecialCharacters(str) {
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

  exactFullNameSearch(inputString) {
    /**
     * Find ports where the input string exactly matches any of the searchable fields.
     * Words must be in the same order.
     * @param {string} inputString - The string to match against port names.
     * @returns {Array} List of objects containing matched port data and confidence scores.
     */
    if (typeof inputString !== "string" || !inputString.trim()) {
      return [];
    }

    const normalizedInput = this.normalizeString(inputString);
    const results = this.portsData
      .filter((port) => {
        const mainPortName = this.normalizeString(port["Main Port Name"]);
        const alternatePortName = this.normalizeString(
          port["Alternate Port Name"]
        );
        const unLocode = this.normalizeString(port["UN/LOCODE"]);

        const mainMatch = mainPortName === normalizedInput;
        const alternateMatch = alternatePortName === normalizedInput;
        const unLocodeMatch = unLocode === normalizedInput;

        return mainMatch || alternateMatch || unLocodeMatch;
      })
      .map((port) => {
        const mainPortName = this.normalizeString(port["Main Port Name"]);
        const alternatePortName = this.normalizeString(
          port["Alternate Port Name"]
        );
        const unLocode = this.normalizeString(port["UN/LOCODE"]);
        const normalizedInput = this.normalizeString(inputString);

        let matchType = "";
        if (mainPortName === normalizedInput) matchType += "_main_port";
        else if (alternatePortName === normalizedInput)
          matchType += "_alternate_port";
        else if (unLocode === normalizedInput) matchType += "_unlocode";

        return {
          port_data: port,
          confidence_score: 100,
          match_type: matchType,
        };
      });

    // Sort results by confidence score (highest first)
    return results.sort((a, b) => b.confidence_score - a.confidence_score);
  }

  fullNameSearch(inputString) {
    /**
     * Find ports where all words from the input string are present in any of the searchable fields,
     * regardless of word order.
     * @param {string} inputString - The string to match against port names.
     * @returns {Array} List of objects containing matched port data and confidence scores.
     */
    if (typeof inputString !== "string" || !inputString.trim()) {
      return [];
    }

    const inputWords = this.normalizeString(inputString).split(/\s+/);

    const results = this.portsData
      .filter((port) => {
        const mainPortName = this.normalizeString(port["Main Port Name"]);
        const alternatePortName = this.normalizeString(
          port["Alternate Port Name"]
        );
        const unLocode = this.normalizeString(port["UN/LOCODE"]);

        const mainMatch = inputWords.every((word) =>
          mainPortName.includes(word)
        );
        const alternateMatch = inputWords.every((word) =>
          alternatePortName.includes(word)
        );
        const unLocodeMatch = inputWords.every((word) =>
          unLocode.includes(word)
        );

        return mainMatch || alternateMatch || unLocodeMatch;
      })
      .map((port) => {
        const mainPortName = this.normalizeString(port["Main Port Name"]);
        const alternatePortName = this.normalizeString(
          port["Alternate Port Name"]
        );
        const unLocode = this.normalizeString(port["UN/LOCODE"]);
        const inputWords = this.normalizeString(inputString).split(/\s+/);

        let matchType = "";
        if (inputWords.every((word) => mainPortName.includes(word)))
          matchType += "_main_port";
        else if (inputWords.every((word) => alternatePortName.includes(word)))
          matchType += "_alternate_port";
        else if (inputWords.every((word) => unLocode.includes(word)))
          matchType += "_unlocode";

        const searchableText = [mainPortName, alternatePortName, unLocode].join(
          " "
        );

        return {
          port_data: port,
          confidence_score: this.calculateAccuracy(inputString, searchableText),
          match_type: matchType,
        };
      });

    // Sort results by confidence score (highest first)
    return results.sort((a, b) => b.confidence_score - a.confidence_score);
  }

  findByWordSearch(inputString) {
    /**
     * Find ports by matching individual words, ignoring special characters and common keywords.
     * @param {string} inputString - The string to match against port names.
     * @returns {Array} List of objects containing matched port data and confidence scores.
     */
    if (typeof inputString !== "string" || !inputString.trim()) {
      return [];
    }

    // Clean and split input string into words
    const inputWords = this.removeSpecialCharacters(inputString)
      .split(/\s+/)
      .filter((word) => !this.ignoredKeywords.has(word));

    if (inputWords.length === 0) {
      return [];
    }

    // For each word, try to find matching ports
    for (const word of inputWords) {
      const matchingPorts = this.portsData.filter((port) => {
        // Clean and split all searchable fields
        const mainPortName = this.removeSpecialCharacters(
          port["Main Port Name"]
        );
        const alternatePortName = this.removeSpecialCharacters(
          port["Alternate Port Name"]
        );
        const unLocode = this.removeSpecialCharacters(port["UN/LOCODE"]);

        // Split into words and filter out ignored keywords
        const mainWords = mainPortName
          .split(/\s+/)
          .filter((w) => !this.ignoredKeywords.has(w));
        const alternateWords = alternatePortName
          .split(/\s+/)
          .filter((w) => !this.ignoredKeywords.has(w));
        const unLocodeWords = unLocode
          .split(/\s+/)
          .filter((w) => !this.ignoredKeywords.has(w));

        // Check if the current word matches any of the searchable words
        return (
          mainWords.includes(word) ||
          alternateWords.includes(word) ||
          unLocodeWords.includes(word)
        );
      });

      // If we found matches for this word, return them with confidence scores
      if (matchingPorts.length > 0) {
        const results = matchingPorts.map((port) => {
          const mainPortName = this.normalizeString(port["Main Port Name"]);
          const alternatePortName = this.normalizeString(
            port["Alternate Port Name"]
          );
          const unLocode = this.normalizeString(port["UN/LOCODE"]);
          const searchableText = [
            mainPortName,
            alternatePortName,
            unLocode,
          ].join(" ");

          let matchType = "";
          const mainWords = this.removeSpecialCharacters(port["Main Port Name"])
            .split(/\s+/)
            .filter((w) => !this.ignoredKeywords.has(w));
          const alternateWords = this.removeSpecialCharacters(
            port["Alternate Port Name"]
          )
            .split(/\s+/)
            .filter((w) => !this.ignoredKeywords.has(w));
          const unLocodeWords = this.removeSpecialCharacters(port["UN/LOCODE"])
            .split(/\s+/)
            .filter((w) => !this.ignoredKeywords.has(w));

          if (mainWords.includes(word)) matchType += "_main_port";
          else if (alternateWords.includes(word))
            matchType += "_alternate_port";
          else if (unLocodeWords.includes(word)) matchType += "_unlocode";

          return {
            port_data: port,
            confidence_score: this.calculateAccuracy(
              inputString,
              searchableText
            ),
            match_type: matchType,
          };
        });

        // Sort results by confidence score (highest first)
        return results.sort((a, b) => b.confidence_score - a.confidence_score);
      }
    }

    return [];
  }

  fuzzySearch(inputString, threshold = 60, maxResults = 3) {
    /**
     * Find matching ports based on input string using Fuse.js fuzzy matching.
     * @param {string} inputString - The string to match against port names.
     * @param {number} threshold - Minimum confidence score (0-100) for matches.
     * @param {number} maxResults - Maximum number of results to return.
     * @returns {Array} List of objects containing matched port data and confidence scores.
     * @throws {Error} If parameters are invalid.
     */
    if (typeof inputString !== "string" || !inputString.trim()) {
      return [];
    }
    if (typeof threshold !== "number" || threshold < 0 || threshold > 100) {
      throw new Error("Threshold must be a number between 0 and 100");
    }
    if (typeof maxResults !== "number" || maxResults < 1) {
      throw new Error("maxResults must be a positive number");
    }

    inputString = this.normalizeString(inputString);
    const fuseResults = this.fuse.search(inputString, { limit: maxResults });

    // Convert Fuse's score (0 = perfect match) to a confidence score (0-100)
    const results = fuseResults
      .map((result) => {
        const matches = result.matches || [];
        let matchType = "";

        // Determine which key matched
        if (matches.length > 0) {
          const matchedKey = matches[0].key;
          if (matchedKey === "Main Port Name") matchType += "_main_port";
          else if (matchedKey === "Alternate Port Name")
            matchType += "_alternate_port";
          else if (matchedKey === "UN/LOCODE") matchType += "_unlocode";
        }

        return {
          port_data: result.item,
          confidence_score: (1 - result.score) * 100,
          matches: matches,
          match_type: matchType,
        };
      })
      .filter((result) => result.confidence_score >= threshold);

    return results;
  }

  cascadingSearch(inputString, fuzzyThreshold = 60, maxResults = 3) {
    /**
     * Perform a cascading search that tries different search methods in order:
     * 1. Exact Full Name Search
     * 2. Full Name Search (words in any order)
     * 3. Word Search
     * 4. Fuzzy Search
     * @param {string} inputString - The string to match against port names.
     * @param {number} fuzzyThreshold - Minimum confidence score (0-100) for fuzzy matches.
     * @param {number} maxResults - Maximum number of results to return for fuzzy search.
     * @returns {Array} List of objects containing matched port data.
     */
    if (typeof inputString !== "string" || !inputString.trim()) {
      return [];
    }

    // Step 1: Try Exact Full Name Search
    const exactMatches = this.exactFullNameSearch(inputString);
    if (exactMatches.length > 0) {
      return exactMatches.map((port) => ({
        ...port,
        match_algo_type: "exact",
      }));
    }

    // Step 2: Try Full Name Search
    const fullNameMatches = this.fullNameSearch(inputString);
    if (fullNameMatches.length > 0) {
      return fullNameMatches.map((port) => ({
        ...port,
        match_algo_type: "full_name",
      }));
    }

    // Step 3: Try Word Search
    const wordMatches = this.findByWordSearch(inputString);
    if (wordMatches.length > 0) {
      return wordMatches.map((port) => ({
        ...port,
        match_algo_type: "word",
      }));
    }

    // Step 4: Try Fuzzy Search
    const fuzzyMatches = this.fuzzySearch(
      inputString,
      fuzzyThreshold,
      maxResults
    );
    if (fuzzyMatches.length > 0) {
      return fuzzyMatches.map((result) => ({
        ...result,
        match_algo_type: "fuzzy",
      }));
    }

    return [];
  }
}

// Example usage
if (require.main === module) {
  (async () => {
    try {
      // Get the absolute path to DummyData.json
      const currentDir = __dirname;
      const dataDir = path.join(path.dirname(currentDir), "../Data");
      const dummyDataPath = path.join(dataDir, "DummyData.json");

      // Load port data asynchronously
      const portsData = await PortMatcher.loadPortsData(dummyDataPath);

      // Initialize matcher
      const matcher = new PortMatcher(portsData);

      // Example searches based on actual data
      const testCases = ["Jebal ali", "New York"];

      console.log("Testing port matching with various inputs:");
      console.log("-".repeat(50));

      testCases.forEach((testInput) => {
        console.log(`\nSearching for: ${testInput}`);
        const results = matcher.cascadingSearch(testInput, 50);
        console.log(JSON.stringify(results, null, 2));
      });
    } catch (error) {
      console.error("Error during initialization:", error);
    }
  })();
}

module.exports = PortMatcher;

//Functions to print the database

// printData() {
//   /**
//    * Print the contents of the port data in a readable format.
//    */
//   if (!this.portsData.length) {
//     console.log("\nNo port data available");
//     return;
//   }
//   console.log("\nPort Data Contents:");
//   console.log("-".repeat(50));
//   this.portsData.forEach(port => {
//     console.log("\nPort Data:");
//     Object.entries(port).forEach(([key, value]) => {
//       console.log(`  ${key}: ${value}`);
//     });
//   });
//   console.log("\n");
// }

//Function to update the database

// async updateData(newPortsData) {
//   /**
//    * Update the port data and rebuild the Fuse index.
//    * @param {Array} newPortsData - New list of port data dictionaries.
//    */
//   if (!Array.isArray(newPortsData) || newPortsData.length === 0) {
//     throw new Error('newPortsData must be a non-empty array');
//   }
//   this.portsData = newPortsData;
//   this._createFuseIndex();
// }
