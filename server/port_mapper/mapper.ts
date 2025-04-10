import { Port, CascadingResult, PortMatcherResult } from "../src/types/types";
import { Groq } from "groq-sdk";
import { spawn } from "child_process";
import { join } from "path";
import prisma from "../src/lib/prisma";


class PortMatcher {
  /**
   * Class for matching ports based on various search algorithms
   */
   portsData: Port[] = [];
   searchableKeys: string[];
   locationSearchableKeys: string[];
   ignoredKeywords: Set<string>;
   groq: Groq;
   static instance: PortMatcher | null = null;

   constructor() {
    /**
     * Creates a new PortMatcher instance
     *  constructor to enforce singleton pattern
     */
    this.searchableKeys = ["name", "code", "display_name"];
    this.locationSearchableKeys = ["country", "region", "city", "state_name"];
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
      "of",
      "the",
      "and",
      "in",
      "at",
      "by",
      "on",
      "near",
      "nearby",
    ]);

    this.groq = new Groq({
      apiKey: process.env.GROQ_API_KEY || "",
      dangerouslyAllowBrowser: true,
    });
  }

  static async loadPortsData(): Promise<Port[]> {
    /**
     * Loads port data from MongoDB
     * @returns Promise resolving to an array of Port objects
     * @throws Error if database connection or query fails
     */
    try {
      const allPorts = await prisma.port.findMany({
        where: {
          deleted: false,
          verified: true,
        },
        select: {
          id: true,
          name: true,
          display_name: true,
          city:true,
          country:true,
          country_code:true,
          code:true,
          port_type:true,
          region:true,
          lat_lon:true,
          other_names:true,
          state_name:true,
          master_port:true,
          is_head_port:true,
        }
      });
      return allPorts as unknown as Port[];
    } catch (error) {
      console.error("Error loading port data from MongoDB:", error);
      throw error;
    }
  }

  async refreshData(): Promise<void> {
    /**
     * Refreshes the port data by reloading from MongoDB
     * @returns Promise that resolves when data is refreshed
     * @throws Error if data refresh fails
     */
    try {
      this.portsData = await PortMatcher.loadPortsData();
    } catch (error) {
      console.error("Error refreshing port data:", error);
      throw error;
    }
  }

  static async getInstance(): Promise<PortMatcher> {
    if (!PortMatcher.instance) {
      PortMatcher.instance = new PortMatcher();
      await PortMatcher.instance.refreshData();
    }
    return PortMatcher.instance;
  }  

  normalizeString(str: string | undefined): string {
    /**
     * Normalizes a string by converting to lowercase and removing special characters
     * @param str - String to normalize
     * @returns Normalized string
     */

    return (
      str
        ?.toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim() || ""
    );
  }

   filterByLocation(
    inputString: string,
    portsData: Port[] = this.portsData
  ): Port[] {
    if (typeof inputString !== "string" || !inputString.trim()) {
      return [];
    }

    // Normalize input and split into clean keywords - do this once
    const normalizedInput = this.normalizeString(inputString);
    const inputKeywords = normalizedInput
      .split(/\s+/)
      .filter((word) => !this.ignoredKeywords.has(word));

    if (inputKeywords.length === 0) {
      return [];
    }

    // Convert inputKeywords to a Set for faster lookups
    const inputKeywordSet = new Set(inputKeywords);
    const results: Port[] = [];

    // Use for loop instead of forEach for better performance
    for (let i = 0; i < portsData.length; i++) {
      const port = portsData[i];

      // Use for loop with early exit instead of some
      for (let j = 0; j < this.locationSearchableKeys.length; j++) {
        const key = this.locationSearchableKeys[j];
        const fieldValue = port[key as keyof Port];

        if (typeof fieldValue !== "string") continue;

        const normalizedField = this.normalizeString(fieldValue);
        const fieldWords = normalizedField
          .split(/\s+/)
          .filter((word) => !this.ignoredKeywords.has(word));

        if (fieldWords.length === 0) continue;

        // Exactly as in original: Check if all fieldWords are present in inputKeywords
        let allWordsPresent = true;
        for (let k = 0; k < fieldWords.length; k++) {
          if (!inputKeywordSet.has(fieldWords[k])) {
            allWordsPresent = false;
            break;
          }
        }

        if (allWordsPresent) {
          results.push(port);
          break; // Stop checking other fields for this port
        }
      }
    }

    return results;
  }

   completeNameSearch(
    inputString: string,
    portsData: Port[] = this.portsData
  ): CascadingResult[] {
    /**
     * Performs exact name matching search
     * @param inputString - Search string
     * @param portsData - Optional array of ports to search through
     * @returns Array of exact match results
     */

    if (typeof inputString !== "string" || !inputString.trim()) {
      return [];
    }

    const normalizedInput = this.normalizeString(inputString);

    const results: CascadingResult[] = [];

    for (const port of portsData) {
      let matchType = "";
      let matched = false;
      let confidenceScore = 0;
      let weightedScore = 0;
      for (const key of this.searchableKeys) {
        const normalizedField = this.normalizeString(
          port[key as keyof Port] as string
        );

        if (key == "name" || key == "display_name") {
          weightedScore = 100;
        } else if (key == "code") {
          weightedScore = 99;
        }

        

        if (normalizedField && normalizedField == normalizedInput) {
          matchType = `_${key.toLowerCase().replace(/\s+/g, "_")}`;
          matched = true;
          confidenceScore = weightedScore;
          break;
        }
      }

      for (const alt_name of port.other_names || []) {
        const normalizedField = this.normalizeString(alt_name);
        if (normalizedField && normalizedField === normalizedInput) {
          matchType = "other_names";
          matched = true;
          confidenceScore = 98.5;
          break;
        }
      }

      if (matched) {
        results.push({
          port_data: port,
          confidence_score: confidenceScore,
          match_type: matchType,
          match_algo_type: "exact",
        });
      }
    }

    return results.sort((a, b) => b.confidence_score - a.confidence_score);
  }

   wordSearch(
    inputString: string,
    portsData: Port[] = this.portsData
  ): CascadingResult[] {
    if (typeof inputString !== "string" || !inputString.trim()) {
      return [];
    }

    const inputWords = this.normalizeString(inputString)
      .split(/\s+/)
      .filter((word) => !this.ignoredKeywords.has(word));

    if (inputWords.length === 0) {
      return [];
    }

    const inputWordsSet = new Set(inputWords);
    const results: CascadingResult[] = [];
    const MIN_CONFIDENCE = 60;

    const getNormalizedWords = (
      value: string | undefined
    ): { words: string[]; set: Set<string> } | null => {
      if (!value) return null;

      const fieldWords = this.normalizeString(value)
        .split(/\s+/)
        .filter((word) => !this.ignoredKeywords.has(word));

      if (fieldWords.length === 0) return null;

      return {
        words: fieldWords,
        set: new Set(fieldWords),
      };
    };

    const calculateOverlapScore = (fieldWordsSet: Set<string>): number => {
      let commonWords = 0;
      for (const word of inputWordsSet) {
        if (fieldWordsSet.has(word)) commonWords++;
      }
      const totalWords = inputWordsSet.size + fieldWordsSet.size;
      return totalWords === 0 ? 0 : (2 * commonWords * 100) / totalWords;
    };

    const calculateOrderScore = (fieldWords: string[]): number => {
      if (fieldWords.length === 0) return 0;

      const minLength = Math.min(inputWords.length, fieldWords.length);
      let maxConsecutiveMatches = 0;

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

    for (const port of portsData) {
      let bestMatch = { confidence: 0, matchType: "" };

      for (const key of this.searchableKeys) {
        const normalized = getNormalizedWords(
          port[key as keyof Port] as string
        );
        if (!normalized) continue;

        const overlapScore = calculateOverlapScore(normalized.set);
        if (overlapScore < MIN_CONFIDENCE) continue;

        const orderScore = calculateOrderScore(normalized.words);
        const confidence = overlapScore * 0.8 + orderScore * 0.2;

        if (confidence > bestMatch.confidence) {
          bestMatch = {
            confidence,
            matchType: key.toLowerCase().replace(/\s+/g, "_"),
          };
        }
      }

      if (bestMatch.confidence > 30) {
        results.push({
          port_data: port,
          confidence_score: parseFloat(bestMatch.confidence.toFixed(2)),
          match_type: bestMatch.matchType,
          match_algo_type: "word",
        });
        continue;
      }

      for (const altName of port.other_names || []) {
        const normalized = getNormalizedWords(altName);
        if (!normalized) continue;

        const overlapScore = calculateOverlapScore(normalized.set);
        if (overlapScore < MIN_CONFIDENCE) continue;

        const orderScore = calculateOrderScore(normalized.words);
        const confidence = overlapScore * 0.8 + orderScore * 0.2;

        if (confidence > bestMatch.confidence) {
          bestMatch = { confidence, matchType: "other_names" };
        }
      }

      if (bestMatch.confidence > MIN_CONFIDENCE) {
        results.push({
          port_data: port,
          confidence_score: parseFloat(bestMatch.confidence.toFixed(2)),
          match_type: bestMatch.matchType,
          match_algo_type: "word",
        });
      }
    }

    return results.sort((a, b) => b.confidence_score - a.confidence_score);
  }

   async rubyFuzzySearch(
    inputString: string,
    portsData: Port[] = this.portsData
  ): Promise<CascadingResult[]> {
    /**
     * Performs fuzzy search using Ruby script
     * @param inputString - Search string
     * @param portsData - Optional array of ports to search through
     * @returns Promise resolving to array of fuzzy match results
     */

    if (typeof inputString !== "string" || !inputString.trim()) {
      return [];
    }

    const searchData = portsData.map((port) => {
      const searchableFields = this.searchableKeys
        .map((key) => port[key as keyof Port] as string)
        .filter(Boolean);
      return searchableFields.join(" ");
    });

    const rubyInput = {
      search_data: searchData,
      query: inputString,
      ports_data: portsData,
      stop_words: Array.from(this.ignoredKeywords),
      searchable_fields: this.searchableKeys,
    };

    return new Promise((resolve, reject) => {
      const rubyScriptPath = join(__dirname, "./ruby_fuzzy/fuzzy_match.rb");
      const rubyProcess = spawn("ruby", [rubyScriptPath]);

      let result = "";
      let error = "";

      rubyProcess.stdout.on("data", (data) => {
        result += data.toString();
      });

      rubyProcess.stderr.on("data", (data) => {
        error += data.toString();
      });

      rubyProcess.on("close", (code) => {
        if (code !== 0) {
          reject(new Error(`Ruby process exited with code ${code}: ${error}`));
          return;
        }

        try {
          const results = JSON.parse(result.trim());
          resolve(results);
        } catch (err) {
          reject(
            new Error(
              `Failed to parse Ruby output: ${
                err instanceof Error ? err.message : "Unknown error"
              }`
            )
          );
        }
      });

      rubyProcess.stdin.write(JSON.stringify(rubyInput));
      rubyProcess.stdin.end();
    });
  }

   validateLLMResponse(data: any): boolean {
    /**
     * Validates LLM response format
     * @param data - Response data to validate
     * @returns Boolean indicating if response is valid
     */

    if (!data || typeof data !== "object" || !Array.isArray(data.ports)) {
      return false;
    }

    for (const port of data.ports) {
      if (typeof port !== "object") return false;

      if (
        !port.hasOwnProperty("name") ||
        typeof port.name !== "string" ||
        !port.hasOwnProperty("alternative_names") ||
        !Array.isArray(port.alternative_names) ||
        port.alternative_names.some((name: any) => typeof name !== "string") ||
        !port.hasOwnProperty("port_code") ||
        typeof port.port_code !== "string" ||
        !port.hasOwnProperty("confidence_score") ||
        typeof port.confidence_score !== "number" ||
        port.confidence_score < 0 ||
        port.confidence_score > 100
      ) {
        return false;
      }
    }

    return true;
  }

   async getGroqResponse(
    keyword: string,
    portType: string | null
  ): Promise<string> {
    /**
     * Gets response from Groq LLM service
     * @param keyword - Search keyword
     * @param portType - Optional port type filter
     * @returns Promise resolving to LLM response string
     */


    let port_type="";
    if(portType=="air_port"){
      port_type="airport";
    }else if(portType=="sea_port"){
      port_type="seaport";
    }else if(portType=="inland_port"){
      port_type="inlandport";
    }else{
      port_type="address";
    }

    try {
      const query = `Input Keyword is ${keyword} and Type is ${port_type}.


Important:
- Strictly follow the JSON structure—any deviation is incorrect`;

      const completion = await this.groq.chat.completions.create({
        messages: [
          { role: "system", content: process.env.SYSTEM_PROMPT || "" },
          { role: "user", content: query },
        ],
        model: "llama3-70b-8192",
        response_format: {
          type: "json_object",
        },
        temperature: 0.1,
        max_completion_tokens: 8192,
      });

      const content = completion.choices[0].message.content;
      if (!content) {
        throw new Error("No content in response");
      }
      return content;
    } catch (error) {
      console.error("GroqService :: getResponse :: error", error);
      throw error;
    }
  }

   async getLLMResponse(
    keyword: string,
    portType: string | null = null
  ): Promise<PortMatcherResult[]> {
    /**
     * Processes LLM response and matches with database ports
     * @param keyword - Search keyword
     * @param portType - Optional port type filter
     * @returns Promise resolving to array of matched ports
     */

    try {
      if (keyword === "") {
        return [];
      }

      const calculateDistance = (
        lat1: number,
        lon1: number,
        lat2: number,
        lon2: number
      ): number => {
        const R = 6371;
        const dLat = ((lat2 - lat1) * Math.PI) / 180;
        const dLon = ((lon2 - lon1) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
      };

      const findMatchingPort = (llmPort: any): Port[] | null => {
        const llmNames = [llmPort.name, ...llmPort.alternative_names]
          .filter(Boolean)
          .map((name) => name.toLowerCase());

        const filteredPorts = portType
          ? this.portsData.filter((port) => port.port_type === portType)
          : this.portsData;

        const matches = filteredPorts.filter((dbPort) => {
          const dbNames = [
            dbPort.name,
            dbPort.display_name,
            ...(dbPort.other_names || []),
          ]
            .filter(Boolean)
            .map((name) => name.toLowerCase());

          const nameMatch = llmNames.some((llmName) =>
            dbNames.some((dbName) => dbName === llmName)
          );

          let codeMatch = false;
          if (
            dbPort.code &&
            llmPort.port_code &&
            dbPort.code.trim() != "" &&
            llmPort.port_code.trim() != ""
          ) {
            codeMatch =
              dbPort.code?.toLowerCase() === llmPort.port_code?.toLowerCase();
          }

          let locationMatch = false;
          let distance = 0;
          if (
            llmPort.latitude &&
            llmPort.longitude &&
            dbPort.lat_lon?.lat &&
            dbPort.lat_lon?.lon
          ) {
            distance = calculateDistance(
              parseFloat(llmPort.latitude),
              parseFloat(llmPort.longitude),
              dbPort.lat_lon.lat,
              dbPort.lat_lon.lon
            );
            locationMatch = distance <= 300;
          }

          if (nameMatch || codeMatch || locationMatch) {
            const matchTypes = [];
            if (nameMatch) matchTypes.push("name");
            if (codeMatch) matchTypes.push("code");
            if (locationMatch) matchTypes.push("location");
            (dbPort as any).match_criteria = matchTypes;
            (dbPort as any).confidenceAdjustment = -Math.floor(distance / 5);
          }

          return nameMatch || codeMatch || locationMatch;
        });

        return matches.length > 0 ? matches : null;
      };

      const rawResponse = await this.getGroqResponse(keyword, portType);

      let parsedResponse;
      try {
        parsedResponse = JSON.parse(rawResponse);
      } catch (error) {
        console.error("Failed to parse LLM response:", error);
        return [];
      }

      if (!parsedResponse || !this.validateLLMResponse(parsedResponse)) {
        return [];
      }

      const matchedPorts = parsedResponse.ports.flatMap((llmPort: any) => {
        const matchedPorts = findMatchingPort(llmPort);

        return matchedPorts
          ? matchedPorts.map((port) => {
              return {
                port_data: port,
                confidence_score:
                  parseFloat(llmPort.confidence_score.toFixed(2)) +
                  (port as any).confidenceAdjustment,
                match_type: `llm:${(port as any).match_criteria.join("+")}`,
              };
            })
          : [];
      });

      return matchedPorts.sort(
        (a: PortMatcherResult, b: PortMatcherResult) =>
          b.confidence_score - a.confidence_score
      );
    } catch (error) {
      console.error("Error in getLLMResponse:", error);
      return [];
    }
  }

   async cascadingSearch(
    inputString: string,
    portType: string | null = null
  ): Promise<CascadingResult[]> {
    /**
     * Performs cascading search using multiple algorithms
     * @param inputString - Search string
     * @param portType - Optional port type filter
     * @returns Promise resolving to array of search results
     */

    if (
      typeof inputString !== "string" ||
      this.normalizeString(inputString) === ""
    ) {
      return [];
    }

    // Create a copy of portsData to work with
    let workingPortsData = [...this.portsData];

    try {
      if (portType) {
        workingPortsData = workingPortsData.filter(
          (port) => port.port_type === portType
        );
      }

      const exactResults = this.completeNameSearch(
        inputString,
        workingPortsData
      );
      if (exactResults.length > 0) {
        return exactResults.map((result) => ({
          ...result,
          match_algo_type: "exact",
        }));
      }


      let locationFilteredData = this.filterByLocation(
        inputString,
        workingPortsData
      );

      if (locationFilteredData.length == 0) {
        locationFilteredData = workingPortsData;
      }

      if (portType == "address") {
        const wordSearchResultsNew = this.wordSearch(
          inputString,
          workingPortsData
        );

        if (wordSearchResultsNew.length > 0) {
          return wordSearchResultsNew.map((result) => ({
            ...result,
            match_algo_type: "word",
          }));
        }
      } else {
        const rubyResults = await this.rubyFuzzySearch(
          inputString,
          locationFilteredData
        );

        if (rubyResults.length > 0) {
          return rubyResults.map((result) => ({
            ...result,
            match_algo_type: "fuzzy_location",
          }));
        }

        const rubyResultsNew = await this.rubyFuzzySearch(
          inputString,
          workingPortsData
        );

        if (rubyResultsNew.length > 0) {
          return rubyResultsNew.map((result) => ({
            ...result,
            match_algo_type: "fuzzy",
          }));
        }
      }

      return [];
    } catch (error) {
      console.error("Error in cascadingSearch:", error);
      return [];
    }
  }

  async aggregatedResults(
    keyword: string,
    portType: string | null = null,
    includeAll: boolean = false
  ): Promise<PortMatcherResult[]> {
    try {
      const started = performance.now();
      const [cascadingResults, llmResults] = await Promise.all([
        this.cascadingSearch(keyword, portType),
        this.getLLMResponse(keyword, portType),
      ]);

      if (llmResults.length === 0 && cascadingResults.length === 0) {
        return [];
      }

      // Convert CascadingResult to PortMatcherResult
      const convertedCascadingResults: PortMatcherResult[] =
        cascadingResults.map((result) => ({
          port_data: result.port_data,
          confidence_score: result.confidence_score,
          match_type: result.match_type,
          sources: ["cascading"],
        }));

      const convertedLLMResults: PortMatcherResult[] = llmResults.map(
        (result) => ({
          port_data: result.port_data,
          confidence_score: result.confidence_score,
          match_type: result.match_type,
          sources: ["llm"],
        })
      );

      const ended = performance.now();
      console.log(`Time taken: ${ended - started} milliseconds`);

      // Create a Map to track unique ports by ID and combine sources
      const uniqueResults = new Map<string | number, PortMatcherResult>();

      // First add cascading results
      convertedCascadingResults.forEach((result) => {
        uniqueResults.set(result.port_data.id, result);
      });

      // Then check if llm results exist in the map and merge them or add new ones
      convertedLLMResults.forEach((result) => {
        const existingResult = uniqueResults.get(result.port_data.id);
        if (existingResult) {
          // If port already exists, combine sources and use the higher confidence score
          existingResult.sources = [
            ...new Set([...existingResult.sources, ...result.sources]),
          ];
          existingResult.confidence_score = Math.max(
            existingResult.confidence_score,
            result.confidence_score
          );
        } else {
          uniqueResults.set(result.port_data.id, result);
        }
      });

      // Convert Map back to array and sort
      const results = Array.from(uniqueResults.values());

      const threshold = includeAll ? 0 : 55;
      return results
        .sort((a, b) => {
          if (a.confidence_score === b.confidence_score) {
            if (a.port_data.master_port && b.port_data.master_port) {
              return a.port_data.is_head_port ? 1 : -1;
            }
            return a.port_data.master_port ? 1 : -1;
          }
          return b.confidence_score - a.confidence_score;
        })
        .filter((result) => result.confidence_score >= threshold)
        .slice(0, 10);
    } catch (error) {
      console.error("Error in aggregatedResults:", error);
      return [];
    }
  }
}

export = PortMatcher;



