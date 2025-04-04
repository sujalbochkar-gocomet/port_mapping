const Fuse = require("fuse.js");
const fs = require("fs");
const path = require("path");
const fsPromises = fs.promises;
const { spawn } = require('child_process');
const { Groq } = require('groq-sdk');
const Port = require('../../models/Port');
const connectDB = require('../../lib/db');
const mongoose = require('mongoose');

// Update the path to .env file
require("dotenv").config({ path: path.join(__dirname, '../.env') });

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
    this.searchableKeys = ["name", "code", "display_name"];
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

    this.groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
      dangerouslyAllowBrowser: true,
    });

    this._createFuseIndex();
  }

  static async loadPortsData() {
    /**
     * Asynchronously load port data from MongoDB and filter out unverified ports.
     * @returns {Promise<Array>} Parsed array of verified port data.
     */
    try {
      // Connect to MongoDB if not already connected
      await connectDB();

      // Fetch all ports from MongoDB using Mongoose
      const allPorts = await Port.find({
        deleted: false,
        verified: true,
      }).lean();
      
      console.log(`Loaded ${allPorts.length} verified ports from MongoDB`);
      return allPorts;
    } catch (error) {
      console.error('Error loading port data from MongoDB:', error);
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
      let confidenceScore = 0;

      for (const key of this.searchableKeys) {
        const normalizedField = this.normalizeString(port[key]);
        if (normalizedField && normalizedField === normalizedInput) {
          matchType = `_${key.toLowerCase().replace(/\s+/g, '_')}`;
          matched = true;
          confidenceScore = 100;
          break;
        }
      }

      for (const alt_name of port["other_names"]) {
        const normalizedField = this.normalizeString(alt_name);
        if (normalizedField && normalizedField === normalizedInput) {
          matchType = "other_names";
          matched = true;
          confidenceScore = 99;
          break;
        }
      }

      if (matched) {
        results.push({
          port_data: port,
          confidence_score : confidenceScore,
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

    // Pre-process input words once and cache the result
    const inputWords = this.normalizeString(inputString)
      .split(/\s+/)
      .filter(word => !this.ignoredKeywords.has(word));

    if (inputWords.length === 0) {
      return [];
    }

    const inputWordsSet = new Set(inputWords);
    const results = [];
    const MIN_CONFIDENCE = 10;

    // Cache for normalized field values to avoid repeated processing
    const fieldCache = new Map();

    // Helper function to get normalized words for a field value
    const getNormalizedWords = (value, fieldType) => {
      if (!value) return null;
      
      const cacheKey = `${fieldType}:${value}`;
      if (fieldCache.has(cacheKey)) {
        return fieldCache.get(cacheKey);
      }

      const fieldWords = this.normalizeString(value)
        .split(/\s+/)
        .filter(word => !this.ignoredKeywords.has(word));

      if (fieldWords.length === 0) return null;

      const result = {
        words: fieldWords,
        set: new Set(fieldWords)
      };
      
      fieldCache.set(cacheKey, result);
      return result;
    };

    // Optimized overlap score calculation
    const calculateOverlapScore = (fieldWordsSet) => {
      let commonWords = 0;
      for (const word of inputWordsSet) {
        if (fieldWordsSet.has(word)) commonWords++;
      }
      const totalWords = inputWordsSet.size + fieldWordsSet.size;
      return totalWords === 0 ? 0 : (2 * commonWords * 100) / totalWords;
    };

    // Optimized order score calculation using sliding window
    const calculateOrderScore = (fieldWords) => {
      if (fieldWords.length === 0) return 0;

      const minLength = Math.min(inputWords.length, fieldWords.length);
      let maxConsecutiveMatches = 0;
      
      // Use sliding window approach for better performance
      for (let i = 0; i <= fieldWords.length - minLength; i++) {
        let matches = 0;
        for (let j = 0; j < minLength; j++) {
          if (fieldWords[i + j] === inputWords[j]) {
            matches++;
          } else {
            break;
          }
        }
        maxConsecutiveMatches = Math.max(maxConsecutiveMatches, matches);
      }

      return (maxConsecutiveMatches / minLength) * 100;
    };

    // Process each port with early exit conditions
    for (const port of this.portsData) {
      let bestMatch = { confidence: 0, matchType: "" };

      // Check searchable fields
      for (const key of this.searchableKeys) {
        const normalized = getNormalizedWords(port[key], key);
        if (!normalized) continue;

        const overlapScore = calculateOverlapScore(normalized.set);
        // Early exit if overlap score is too low
        if (overlapScore < MIN_CONFIDENCE) continue;

        const orderScore = calculateOrderScore(normalized.words);
        const confidence = (overlapScore * 0.6) + (orderScore * 0.4);

        if (confidence > bestMatch.confidence) {
          bestMatch = { confidence, matchType: key.toLowerCase().replace(/\s+/g, '_') };
        }

      }

      // Early exit if we already have a good match
      if (bestMatch.confidence > 80) {
        results.push({
          port_data: port,
          confidence_score: parseFloat(bestMatch.confidence.toFixed(2)),
          match_type: bestMatch.matchType
        });
        continue;
      }

      // Check other names only if we don't have a good match
      for (const altName of port.other_names) {
        const normalized = getNormalizedWords(altName, 'other_names');
        if (!normalized) continue;

        const overlapScore = calculateOverlapScore(normalized.set);
        if (overlapScore < MIN_CONFIDENCE) continue;

        const orderScore = calculateOrderScore(normalized.words);
        const confidence = (overlapScore * 0.6) + (orderScore * 0.4);

        if (confidence > bestMatch.confidence) {
          bestMatch = { confidence, matchType: 'other_names' };
        }
      }

      if (bestMatch.confidence > MIN_CONFIDENCE) {
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

  // Ruby Fuzzy Search
  async rubyFuzzySearch(inputString) {
    /**
     * Perform fuzzy matching using Ruby's fuzzy_match gem through child process
     * @param {string} inputString - The string to match against port names
     * @returns {Promise<Array>} List of objects containing matched port data and confidence scores
     */
    if (typeof inputString !== "string" || !inputString.trim()) {
      return [];
    }

    // Prepare search data from searchable fields
    const searchData = this.portsData.map(port => {
      const searchableFields = this.searchableKeys.map(key => port[key]).filter(Boolean);
      return searchableFields.join(' ');
    });

    // Prepare input for Ruby script
    const rubyInput = {
      search_data: searchData,
      query: inputString,
      ports_data: this.portsData, // Send the full ports data
      stop_words: Array.from(this.ignoredKeywords), // Convert Set to Array for JSON serialization
      searchable_fields: this.searchableKeys
    };

    return new Promise((resolve, reject) => {
      // Get the path to the Ruby script
      const rubyScriptPath = path.join(__dirname, './ruby_fuzzy/fuzzy_match.rb');

      // Spawn Ruby process
      const rubyProcess = spawn('ruby', [rubyScriptPath]);

      let result = '';
      let error = '';

      // Handle stdout
      rubyProcess.stdout.on('data', (data) => {
        result += data.toString();
      });

      // Handle stderr
      rubyProcess.stderr.on('data', (data) => {
        error += data.toString();
      });

      // Handle process completion
      rubyProcess.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Ruby process exited with code ${code}: ${error} `));
          return;
        }

        try {
          const results = JSON.parse(result.trim());

          // Map results to include the port data from Ruby
          // const mappedResults = results.map(r => ({
          //   port_data: r.port_data,
          //   confidence_score: r.confidence_score,
          // }));
          resolve(results);
        } catch (err) {
          reject(new Error(`Failed to parse Ruby output: ${err.message} `));
        }
      });

      // Write input to Ruby process
      rubyProcess.stdin.write(JSON.stringify(rubyInput));
      rubyProcess.stdin.end();
    });
  }

  async getGroqResponse(keyword, portType) {
    try {
      const query = `User Prompt Format:
                      Input Keyword is ${keyword} and Port Type is ${portType}.

                      Identify and return an array of multiple valid ports that match the given keyword and port type.

                      Ensure the output follows exactly this JSON format:

                      [
                        {
                          "name": "<Port Name>",
                          "alternative_names": [
                            "<Alternative Name 1>",
                            "<Alternative Name 2>",
                            "<Alternative Name 3>"
                            ...lot and lots of alternative names
                          ],
                          "port_code": "<Official Port Code>",
                          "latitude": "<Latitude>",
                          "longitude": "<Longitude>",
                          "confidence_score": <Confidence Score between 0 and 100>
                        }
                      ]

                      Rules:
                      - Return multiple valid matches whenever possible
                      - return latitude and longitude accurately
                      - Return as many alternative names and commonly used names as possible
                      - Ensure the port name is correct and not a misspelling
                      - Do not return explanations or alternative suggestions if no match is found. Instead, return exactly: []
                      - The confidence_score must be between 0 - 100, reflecting the match accuracy
                      - Strictly follow this JSON structure—any deviation is incorrect`;

      const completion = await this.groq.chat.completions.create({
        messages: [
          { role: "system", content: process.env.GROQ_SYSTEM_PROMPT },
          { role: "user", content: query },
        ],
        model: "llama3-70b-8192",
        response_format: {
          type: "json_object",
        },
        temperature: 0.1,
        max_completion_tokens: 8192,
      });

      console.log(process.env.GROQ_SYSTEM_PROMPT);
      return completion.choices[0].message.content;
    } catch (error) {
      console.error("GroqService :: getResponse :: error", error);
      throw error;
    }
  }

  validateLLMResponse(data) {
    if (!data || typeof data !== 'object' || !Array.isArray(data.ports)) {
      return false;
    }

    for (const port of data.ports) {
      if (typeof port !== 'object') return false;

      if (
        !port.hasOwnProperty('name') || typeof port.name !== 'string' ||
        !port.hasOwnProperty('alternative_names') || !Array.isArray(port.alternative_names) ||
        port.alternative_names.some(name => typeof name !== 'string') ||
        !port.hasOwnProperty('port_code') || typeof port.port_code !== 'string' ||
        !port.hasOwnProperty('confidence_score') || typeof port.confidence_score !== 'number' ||
        port.confidence_score < 0 || port.confidence_score > 100
      ) {
        return false;
      }
    }

    return true;
  }

  async getLLMResponse(keyword, portType = null) {
    try {
      if (keyword === "") {
        return [];
      }

      // Helper function to calculate distance between two points using Haversine formula
      const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371; // Earth's radius in kilometers
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
          Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
          Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
      };

      // Helper function to find matching database ports
      const findMatchingPort = (llmPort) => {
        // Combine all possible names into a single array and convert to lowercase
        const llmNames = [
          llmPort.name,
          ...llmPort.alternative_names
        ].filter(Boolean).map(name => name.toLowerCase());

        const fileteredPorts = portType ? this.portsData.filter(port => port.port_type === portType) : this.portsData;
        
        // Find matching ports in our database
        const matches = fileteredPorts.filter(dbPort => {
          // Get all possible names from the database port
          const dbNames = [
            dbPort.name,
            dbPort.display_name,
            ...dbPort.other_names
          ].filter(Boolean).map(name => name.toLowerCase());

          // Check if any name matches
          const nameMatch = llmNames.some(llmName => 
            dbNames.some(dbName => dbName === llmName)
          );

          // Check if port codes match
          const codeMatch = dbPort.code?.toLowerCase() === llmPort.port_code?.toLowerCase();

          // Check geographical proximity if both have coordinates
          let locationMatch = false;
          if (llmPort.latitude && llmPort.longitude && 
              dbPort.lat_lon?.lat && dbPort.lat_lon?.lon) {
            const distance = calculateDistance(
              parseFloat(llmPort.latitude),
              parseFloat(llmPort.longitude),
              dbPort.lat_lon.lat,
              dbPort.lat_lon.lon
            );
            // Consider ports within 50km as potential matches
            locationMatch = distance <= 50;
          }

          // Store the match type if any match is found
          if (nameMatch || codeMatch || locationMatch) {
            const matchTypes = [];
            if (nameMatch) matchTypes.push('name');
            if (codeMatch) matchTypes.push('code');
            if (locationMatch) matchTypes.push('location');
            dbPort.match_criteria = matchTypes;
          }

          return nameMatch || codeMatch || locationMatch;
        });

        return matches.length > 0 ? matches : null;
      };

      // Get the raw response from getResponse
      const rawResponse = await this.getGroqResponse(keyword, portType);
      
      // Parse the response
      let parsedResponse;
      try {
        parsedResponse = JSON.parse(rawResponse);
      } catch (error) {
        console.error("Failed to parse LLM response:", error);
        return [];
      }

      if (!this.validateLLMResponse(parsedResponse)) {
        return [];
      }

      // Process each port from LLM response using the helper function
      const matchedPorts = parsedResponse.ports.flatMap(llmPort => {
        const matchedPorts = findMatchingPort(llmPort);
        
        return matchedPorts ? matchedPorts.map(port => {
          // Calculate distance-based confidence adjustment
          let confidenceAdjustment = 0;
          if (llmPort.latitude && llmPort.longitude && 
              port.lat_lon?.lat && port.lat_lon?.lon) {
            const distance = calculateDistance(
              parseFloat(llmPort.latitude),
              parseFloat(llmPort.longitude),
              port.lat_lon.lat,
              port.lat_lon.lon
            );
            
            // Linear adjustment: -1% for every 4km of distance
            // For example:
            // 4km = -1%
            // 8km = -2%
            // 12km = -3%
            // etc.
            confidenceAdjustment = -(Math.floor(distance / 5));
          }

          // Calculate multi-criteria bonus
          let multiCriteriaBonus = 0;
          const matchCount = port.match_criteria.length;
          if (matchCount > 1) {
            // Add bonus for multiple matching criteria:
            // 2 criteria = +5%
            // 3 criteria = +10%
            multiCriteriaBonus = (matchCount - 1) * 5;
          }

          // Ensure confidence score stays within 0-100 range
          let adjustedConfidence = llmPort.confidence_score + confidenceAdjustment + multiCriteriaBonus;
          adjustedConfidence = Math.max(0, Math.min(100, adjustedConfidence));

          return {
            port_data: port,
            confidence_score: parseFloat(adjustedConfidence.toFixed(2)),
            match_type: `llm:${port.match_criteria.join('+')}`
          };
        }) : [];
      });

      // Sort matched ports by confidence score in descending order
      return matchedPorts.sort((a, b) => b.confidence_score - a.confidence_score);
    } catch (error) {
      console.error("Error in getLLMResponse:", error);
      return [];
    }
  }

  async cascadingSearch(inputString, portType = null) {
    /**
     * Perform a cascading search that tries different search methods in order,
     * including Ruby fuzzy matching
     * @param {string} inputString - The string to match against port names.
     * @param {string} portType - Optional port type to filter results (e.g., 'sea', 'air')
     * @returns {Array} List of objects containing matched port data.
     */
    if (typeof inputString !== "string" || this.normalizeString(inputString) === "") {
      return [];
    }

    // Store original portsData
    const originalPortsData = this.portsData;
    const CONFIDENCE_THRESHOLD = 50;

    try {
      // Step 1: Filter by port_type if specified
      if (portType) {
        this.portsData = this.portsData.filter(port => port.port_type === portType);
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
        return completeMatches
          .filter(match => match.confidence_score >= CONFIDENCE_THRESHOLD)
          .map((port) => ({
            ...port,
            match_algo_type: "exact",
          }));
      }

      // Step 4: Try Word Search
      const wordMatches = this.wordSearch(inputString);
      if (wordMatches.length > 0) {
        return wordMatches
          .filter(match => match.confidence_score >= CONFIDENCE_THRESHOLD)
          .map((port) => ({
            ...port,
            match_algo_type: "word",
          }));
      }

      // Step 5: Try Ruby Fuzzy Search
      try {
        const rubyMatches = await this.rubyFuzzySearch(inputString);

        if (rubyMatches.length > 0) {
          return rubyMatches
            .filter(match => match.confidence_score >= CONFIDENCE_THRESHOLD)
            .map((port) => ({
              ...port,
              match_algo_type: "fuzzy",
            }));
        }
      } catch (error) {
        console.error('Ruby fuzzy search failed:', error);
      }

      return [];
    } finally {
      // Always restore the original portsData
      this.portsData = originalPortsData;
    }
  }

  async aggregatedResults(keyword, portType = null) {
    try {
      // First try exact and word matching
      const cascadingResults = await this.cascadingSearch(keyword, portType);
      
      // Check for high confidence matches (above 80%)
      const highConfidenceMatches = cascadingResults.filter(result => 
        result.confidence_score >= 80 && 
        (result.match_algo_type === "exact" || result.match_algo_type === "word")
      );

      // If we have high confidence matches, return them immediately
      if (highConfidenceMatches.length > 0) {
        return highConfidenceMatches.map(result => ({
          port_data: result.port_data,
          confidence_score: result.confidence_score,
          match_type: result.match_algo_type,
          sources: ['cascading']
        }));
      }

      // If no high confidence matches, proceed with full search
      const [llmResults, remainingCascadingResults] = await Promise.all([
        this.getLLMResponse(keyword, portType),
        Promise.resolve(cascadingResults.filter(result => 
          result.confidence_score < 80 || 
          (result.match_algo_type !== "exact" && result.match_algo_type !== "word")
        ))
      ]);

      // If both results are empty, return empty array
      if (llmResults.length === 0 && remainingCascadingResults.length === 0) {
        return [];
      }

      // Create a map to track ports and their sources
      const portMap = new Map();

      // Process LLM results first (weight: 0.6)
      for (const result of llmResults) {
        const portId = result.port_data.id; // Assuming each port has a unique ID
        portMap.set(portId, {
          port_data: result.port_data,
          llm_score: result.confidence_score,
          cascading_score: 0,
          match_type: result.match_type,
          sources: ['llm']
        });
      }

      // Process remaining cascading results (weight: 0.4)
      for (const result of remainingCascadingResults) {
        const portId = result.port_data.id;
        if (portMap.has(portId)) {
          // Port exists in both results - increase confidence
          const existingEntry = portMap.get(portId);
          existingEntry.cascading_score = result.confidence_score;
          existingEntry.sources.push('cascading');
          existingEntry.match_type = `${existingEntry.match_type}+${result.match_algo_type}`;
        } else {
          // Port only in cascading results
          portMap.set(portId, {
            port_data: result.port_data,
            llm_score: 0,
            cascading_score: result.confidence_score,
            match_type: `cascading:${result.match_algo_type}`,
            sources: ['cascading']
          });
        }
      }

      // Calculate final confidence scores with adjustments
      const finalResults = Array.from(portMap.values()).map(entry => {
        let finalScore;

        if (entry.sources.length === 2) {
          // Port found in both sources - weighted average with bonus
          finalScore = (
            (entry.llm_score * 0.6) +      // LLM weight: 60%
            (entry.cascading_score * 0.4) + // Cascading weight: 40%
            10                              // Bonus for appearing in both sources
          );
        } else if (entry.sources[0] === 'llm') {
          // Port only in LLM results - slight penalty
          finalScore = entry.llm_score * 0.9; // 10% penalty
        } else {
          // Port only in cascading results - larger penalty
          finalScore = entry.cascading_score * 0.8; // 20% penalty
        }

        // Ensure score stays within 0-100 range
        finalScore = Math.max(0, Math.min(100, finalScore));

        return {
          port_data: entry.port_data,
          confidence_score: parseFloat(finalScore.toFixed(2)),
          match_type: entry.match_type,
          sources: entry.sources
        };
      });

      // Sort by final confidence score in descending order
      return finalResults.sort((a, b) => b.confidence_score - a.confidence_score);

    } catch (error) {
      console.error("Error in aggregatedResults:", error);
      return [];
    }
  }
}

// Example usage
if (require.main === module) {
  (async () => {
    try {
      console.log("Loading port data from MongoDB...");
      const loadStart = performance.now();
      const portsData = await PortMatcher.loadPortsData();
      const loadEnd = performance.now();
      console.log(`Port data loaded in ${(loadEnd - loadStart).toFixed(2)}ms`);

      // Initialize matcher
      const matcher = new PortMatcher(portsData);

      // Example searches based on actual data
      const testCases = ["bhava sheva"];

      console.log("\n=== Port Search Results ===\n");

      for (const testInput of testCases) {
        console.log(`Search Query: "${testInput}"`);
        console.log("=".repeat(80));

        // Measure score aggregator (which includes both cascading and LLM searches)
        const startTime = performance.now();
        const results = await matcher.aggregatedResults(testInput, "sea_port");
        const endTime = performance.now();
        
        console.log(`Search completed in ${(endTime - startTime).toFixed(2)}ms`);
        console.log(JSON.stringify(results.slice(0, 3), null, 2));
      }

      // Disconnect from MongoDB
      await mongoose.disconnect();
    } catch (error) {
      console.error("Error during initialization:", error);
      await mongoose.disconnect();
      process.exit(1);
    }
  })();
}

module.exports = PortMatcher;
