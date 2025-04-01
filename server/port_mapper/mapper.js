const Fuse = require("fuse.js");
const fs = require("fs");
const path = require("path");
const fsPromises = fs.promises;
const natural = require('natural');

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
    this.searchableKeys = ["name", "display_name", "code"];
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
    // Initialize phonetic matchers
    this.metaphone = new natural.Metaphone();
    this.soundEx = new natural.SoundEx();
  }

  // _createFuseIndex() {
  //   /**
  //    * Create the Fuse index using enhanced options.
  //    */
  //   const options = {
  //     keys: this.searchableKeys,
  //     threshold: 0.5,
  //     includeScore: true,
  //     includeMatches: false,
  //     findAllMatches: false,
  //   };
  //   this.fuse = new Fuse(this.portsData, options);
  // }

  // Functions to print the database

printData() {
  /**
   * Print the contents of the port data in a readable format.
   */
  if (!this.portsData.length) {
    console.log("\nNo port data available");
    return;
  }
  console.log("\nPort Data Contents:");
  console.log("-".repeat(50));
  this.portsData.forEach(port => {
    console.log("\nPort Data:");
    Object.entries(port).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });
  });
  console.log("\n");
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
    return str?.toLowerCase().trim().replace(/\s+/g, " ") || "";

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

      for(const alt_name of port["other_names"]){
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
          match_type: matchType
        });
      }
    }

    return results;
  }

  jumbledNameSearch(inputString) {
    /**
     * Find ports where all words from the input string are present in any of the searchable fields,
     * regardless of word order, and no extra words are present.
     * @param {string} inputString - The string to match against port names.
     * @returns {Array} List of objects containing matched port data and confidence scores.
     */
    if (typeof inputString !== "string" || !inputString.trim()) {
      return [];
    }

    const inputWords = this.normalizeString(inputString).split(/\s+/);
    const results = [];

    for (const port of this.portsData) {
      let matchType = "";
      let isMatch = false;

      for (const key of this.searchableKeys) {
        const fieldValue = this.normalizeString(port[key]);
        const fieldWords = fieldValue.split(/\s+/);

        if (inputWords.every(word => fieldWords.includes(word)) && 
            fieldWords.length === inputWords.length) {
          matchType = `_${key.toLowerCase().replace(/\s+/g, '_')}`;
          isMatch = true;
          break;
        }
      }

      for(const alt_name of port["other_names"]){
        const fieldValue = this.normalizeString(alt_name);
        const fieldWords = fieldValue.split(/\s+/);
        if (inputWords.every(word => fieldWords.includes(word)) && 
            fieldWords.length === inputWords.length) {
          matchType = `_other_names`;
          isMatch = true;
          break;
        }
      }

      if (isMatch) {
        results.push({
          port_data: port,
          confidence_score: 99.9,
          match_type: matchType
        });
      }
    }

    return results;
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

    const results = [];
    // Process each port once
    for (const port of this.portsData) {
      // Clean and split all searchable fields
      const fieldValues = this.searchableKeys.map(key => 
        this.removeSpecialCharacters(port[key])
      );

      // Split into words and filter out ignored keywords
      const fieldWords = fieldValues.map(value => 
        value.split(/\s+/).filter(w => !this.ignoredKeywords.has(w))
      );

      // Check if any input word matches
      for (const word of inputWords) {
        let matchType = "";
        let matched = false;

        for (let i = 0; i < this.searchableKeys.length; i++) {
          if (fieldWords[i].includes(word)) {
            matchType = `_${this.searchableKeys[i].toLowerCase().replace(/\s+/g, '_')}`;
            matched = true;
            break;
          }
        }

        if (matched) {
          // If we found a match, calculate confidence and add to results
          const searchableText = fieldValues.join(" ");
          results.push({
            port_data: port,
            confidence_score: this.calculateAccuracy(inputString, searchableText),
            match_type: matchType
          });
          break; // Found a match for this port, move to next port
        }
      }
    }

    // Sort results by confidence score (highest first)
    return results.sort((a, b) => b.confidence_score - a.confidence_score);
  }

  phoneticSearch(inputString, threshold = 60) {
    /**
     * Find ports using phonetic matching (sounds-like) algorithms.
     * @param {string} inputString - The string to match against port names.
     * @param {number} threshold - Minimum confidence score (0-100) for matches.
     * @returns {Array} List of objects containing matched port data and confidence scores.
     */
    if (typeof inputString !== "string" || !inputString.trim()) {
      return [];
    }

    const normalizedInput = this.normalizeString(inputString);
    const results = [];

    // Process input string phonetically
    const inputMetaphone = this.metaphone.process(normalizedInput);
    const inputSoundEx = this.soundEx.process(normalizedInput);

    for (const port of this.portsData) {
      let matchType = "";
      let matched = false;
      let bestScore = 0;

      for (const key of this.searchableKeys) {
        const fieldValue = this.normalizeString(port[key]);
        if (!fieldValue) continue;

        // Process field value phonetically
        const fieldMetaphone = this.metaphone.process(fieldValue);
        const fieldSoundEx = this.soundEx.process(fieldValue);

        // Calculate phonetic similarity scores
        const metaphoneScore = fieldMetaphone === inputMetaphone ? 100 : 0;
        const soundExScore = fieldSoundEx === inputSoundEx ? 100 : 0;

        // Use the higher score between Metaphone and SoundEx
        const phoneticScore = Math.max(metaphoneScore, soundExScore);

        // If we have a good phonetic match, calculate word-level similarity
        if (phoneticScore > 0) {
          const wordScore = this.calculateAccuracy(normalizedInput, fieldValue);
          const combinedScore = (phoneticScore * 0.6) + (wordScore * 0.4);

          if (combinedScore > bestScore) {
            bestScore = combinedScore;
            matchType = `_${key.toLowerCase().replace(/\s+/g, '_')}`;
            matched = true;
          }
        }
      }

      if (matched && bestScore >= threshold) {
        results.push({
          port_data: port,
          confidence_score: bestScore,
          match_type: matchType
        });
      }
    }

    // Sort results by confidence score (highest first)
    return results.sort((a, b) => b.confidence_score - a.confidence_score);
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
      const testCases = ["Beirut International Airport, Beirut, Lebanon, BEY"];

      console.log("Testing port matching with various inputs:");
      console.log("-".repeat(50));

      // matcher.printData();
      testCases.forEach((testInput) => {
        console.log(`\nSearching for: ${testInput}`);
        const results = matcher.exactFullNameSearch(testInput);
        console.log(JSON.stringify(results, null, 2));
      });
    } catch (error) {
      console.error("Error during initialization:", error);
    }
  })();
}

module.exports = PortMatcher;


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



// cascadingSearch(inputString, fuzzyThreshold = 60, maxResults = 3) {
  //     /**
  //      * Perform a cascading search that tries different search methods in order:
  //      * 1. Exact Full Name Search
  //      * 2. Full Name Search (words in any order)
  //      * 3. Word Search
  //      * 4. Phonetic Search
  //      * 5. Fuzzy Search
  //      * @param {string} inputString - The string to match against port names.
  //      * @param {number} fuzzyThreshold - Minimum confidence score (0-100) for fuzzy matches.
  //      * @param {number} maxResults - Maximum number of results to return for fuzzy search.
  //      * @returns {Array} List of objects containing matched port data.
  //      */
  //     if (typeof inputString !== "string" || !inputString.trim()) {
  //       return [];
  //     }
  
  //     // Step 1: Try Exact Full Name Search
  //     const exactMatches = this.exactFullNameSearch(inputString);
  //     if (exactMatches.length > 0) {
  //       const filteredMatches = exactMatches.filter(match => match.confidence_score >= fuzzyThreshold);
  //       if (filteredMatches.length > 0) {
  //         return filteredMatches.map((port) => ({
  //           ...port,
  //           match_algo_type: "exact",
  //         }));
  //       }
  //     }
  
  //     // Step 2: Try Full Name Search
  //     const fullNameMatches = this.fullNameSearch(inputString);
  //     if (fullNameMatches.length > 0) {
  //       const filteredMatches = fullNameMatches.filter(match => match.confidence_score >= fuzzyThreshold);
  //       if (filteredMatches.length > 0) {
  //         return filteredMatches.map((port) => ({
  //           ...port,
  //           match_algo_type: "full_name",
  //         }));
  //       }
  //     }
  
  //     // Step 3: Try Word Search
  //     const wordMatches = this.findByWordSearch(inputString);
  //     if (wordMatches.length > 0) {
  //       const filteredMatches = wordMatches.filter(match => match.confidence_score >= fuzzyThreshold);
  //       if (filteredMatches.length > 0) {
  //         return filteredMatches.map((port) => ({
  //           ...port,
  //           match_algo_type: "word",
  //         }));
  //       }
  //     }
  
  //     // Step 4: Try Phonetic Search
  //     const phoneticMatches = this.phoneticSearch(inputString, fuzzyThreshold);
  //     if (phoneticMatches.length > 0) {
  //       return phoneticMatches.map((port) => ({
  //         ...port,
  //         match_algo_type: "phonetic",
  //       }));
  //     }
  
  //     // Step 5: Try Fuzzy Search
  //     const fuzzyMatches = this.fuzzySearch(
  //       inputString,
  //       fuzzyThreshold,
  //       maxResults
  //     );
  //     if (fuzzyMatches.length > 0) {
  //       return fuzzyMatches.map((result) => ({
  //         ...result,
  //         match_algo_type: "fuzzy",
  //       }));
  //     }
  
  //     return [];
  //   }