import { Port } from "../src/types/types";
import { Groq } from 'groq-sdk';
// import OpenAI from 'openai';
import { spawn } from 'child_process';
import { join } from 'path';
import connectDB = require('../lib/db');
import PortModel = require('../models/Port');

interface PortMatcherResult {
  port_data: Port;
  confidence_score: number;
  match_type: string;
  sources: string[];
}

interface CascadingResult {
  port_data: Port;
  confidence_score: number;
  match_type: string;
  match_algo_type: string;
}


class PortMatcher {
  private portsData: Port[];
  private searchableKeys: string[];
  private locationSearchableKeys: string[];
  private ignoredKeywords: Set<string>;
  private groq: Groq;
  // private openai: OpenAI;

  constructor(portsData: Port[]) {
    if (!Array.isArray(portsData) || portsData.length === 0) {
      throw new Error("Ports data must be a non-empty array");
    }

    this.portsData = portsData;
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
    ]);

    this.groq = new Groq({
      apiKey: process.env.GROQ_API_KEY || "",
      dangerouslyAllowBrowser: true,
    });

    // this.openai = new OpenAI({
    //   apiKey: process.env.OPENAI_API_KEY || "",
    // });

  }

  static async loadPortsData(): Promise<Port[]> {
    try {
      await connectDB();
      const allPorts = await PortModel.find({
        deleted: false,
        verified: true,
      }).lean();
      return allPorts as unknown as Port[];
    } catch (error) {
      console.error('Error loading port data from MongoDB:', error);
      throw error;
    }
  }

  public async refreshData(): Promise<void> {
    try {
      const freshData = await PortMatcher.loadPortsData();
      this.portsData = freshData;
    } catch (error) {
      console.error("Error refreshing port data:", error);
      throw error;
    }
  }

  private normalizeString(str: string | undefined): string {
    return (
      str
        ?.toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim() || ""
    );
  }

  private filterByLocation(inputString: string, portsData: Port[] = this.portsData): Port[] {
    if (typeof inputString !== "string" || !inputString.trim()) {
      return [];
    }

    const locationKeywords = this.normalizeString(inputString)
      .split(/\s+/)
      .filter(word => !this.ignoredKeywords.has(word));

    return portsData.filter(port => {
      const locationWords = this.locationSearchableKeys
        .map(key => this.normalizeString(port[key as keyof Port] as string))
        .join(' ')
        .split(/\s+/)
        .filter(word => word.length > 0);

      return locationKeywords.some(keyword =>
        locationWords.some(word => word === keyword)
      );
    });
  }

  private completeNameSearch(inputString: string, portsData: Port[] = this.portsData): CascadingResult[] {
    if (typeof inputString !== "string" || !inputString.trim()) {
      return [];
    }

    const normalizedInput = this.normalizeString(inputString);

    const results: CascadingResult[] = [];

    for (const port of portsData) {
      let matchType = "";
      let matched = false;
      let confidenceScore = 0;

      for (const key of this.searchableKeys) {
        
  
        const normalizedField = this.normalizeString(port[key as keyof Port] as string);

        if (normalizedField && normalizedField == normalizedInput) {
          matchType = `_${key.toLowerCase().replace(/\s+/g, '_')}`;
          matched = true;
          confidenceScore = 100;
          break;
        }
      }

      for (const alt_name of port.other_names || []) {
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
          confidence_score: confidenceScore,
          match_type: matchType,
          match_algo_type: "exact"
        });
      }
    }

    return results.sort((a, b) => b.confidence_score - a.confidence_score);
  }

  private wordSearch(inputString: string, portsData: Port[] = this.portsData): CascadingResult[] {
    if (typeof inputString !== "string" || !inputString.trim()) {
      return [];
    }

    const inputWords = this.normalizeString(inputString)
      .split(/\s+/)
      .filter(word => !this.ignoredKeywords.has(word));

    if (inputWords.length === 0) {
      return [];
    }

    const inputWordsSet = new Set(inputWords);
    const results: CascadingResult[] = [];
    const MIN_CONFIDENCE = 10;

    const getNormalizedWords = (value: string | undefined): { words: string[], set: Set<string> } | null => {
      if (!value) return null;

      const fieldWords = this.normalizeString(value)
        .split(/\s+/)
        .filter(word => !this.ignoredKeywords.has(word));

      if (fieldWords.length === 0) return null;

      return {
        words: fieldWords,
        set: new Set(fieldWords)
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
        const normalized = getNormalizedWords(port[key as keyof Port] as string );
        if (!normalized) continue;

        const overlapScore = calculateOverlapScore(normalized.set);
        if (overlapScore < MIN_CONFIDENCE) continue;

        const orderScore = calculateOrderScore(normalized.words);
        const confidence = (overlapScore * 0.6) + (orderScore * 0.4);

        if (confidence > bestMatch.confidence) {
          bestMatch = { confidence, matchType: key.toLowerCase().replace(/\s+/g, '_') };
        }
      }

      if (bestMatch.confidence > 80) {
        results.push({
          port_data: port,
          confidence_score: parseFloat(bestMatch.confidence.toFixed(2)),
          match_type: bestMatch.matchType,
          match_algo_type: "word"
        });
        continue;
      }

      for (const altName of port.other_names || []) {
        const normalized = getNormalizedWords(altName );
        if (!normalized) continue;

        const overlapScore = calculateOverlapScore(normalized.set);
        if (overlapScore < MIN_CONFIDENCE) continue;

        const orderScore = calculateOrderScore(normalized.words);
        const confidence = (overlapScore * 0.7) + (orderScore * 0.3);

        if (confidence > bestMatch.confidence) {
          bestMatch = { confidence, matchType: 'other_names' };
        }
      }

      if (bestMatch.confidence > MIN_CONFIDENCE) {
        results.push({
          port_data: port,
          confidence_score: parseFloat(bestMatch.confidence.toFixed(2)),
          match_type: bestMatch.matchType,
          match_algo_type: "word"
        });
      }
    }

    return results.sort((a, b) => b.confidence_score - a.confidence_score);
  }


  private async rubyFuzzySearch(inputString: string, portsData: Port[] = this.portsData): Promise<CascadingResult[]> {
    if (typeof inputString !== "string" || !inputString.trim()) {
      return [];
    }

    const searchData = portsData.map(port => {
      const searchableFields = this.searchableKeys
        .map(key => port[key as keyof Port] as string)
        .filter(Boolean);
      return searchableFields.join(' ');
    });

    const rubyInput = {
      search_data: searchData,
      query: inputString,
      ports_data: portsData,
      stop_words: Array.from(this.ignoredKeywords),
      searchable_fields: this.searchableKeys
    };

    return new Promise((resolve, reject) => {
      const rubyScriptPath = join(__dirname, './ruby_fuzzy/fuzzy_match.rb');
      const rubyProcess = spawn('ruby', [rubyScriptPath]);

      let result = '';
      let error = '';

      rubyProcess.stdout.on('data', (data) => {
        result += data.toString();
      });

      rubyProcess.stderr.on('data', (data) => {
        error += data.toString();
      });

      rubyProcess.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Ruby process exited with code ${code}: ${error}`));
          return;
        }

        try {
          const results = JSON.parse(result.trim());
          resolve(results);
        } catch (err) {
          reject(new Error(`Failed to parse Ruby output: ${err instanceof Error ? err.message : 'Unknown error'}`));
        }
      });

      rubyProcess.stdin.write(JSON.stringify(rubyInput));
      rubyProcess.stdin.end();
    });
  }

 
  private validateLLMResponse(data: any): boolean {
    if (!data || typeof data !== 'object' || !Array.isArray(data.ports)) {
      return false;
    }

    for (const port of data.ports) {
      if (typeof port !== 'object') return false;

      if (
        !port.hasOwnProperty('name') || typeof port.name !== 'string' ||
        !port.hasOwnProperty('alternative_names') || !Array.isArray(port.alternative_names) ||
        port.alternative_names.some((name: any) => typeof name !== 'string') ||
        !port.hasOwnProperty('port_code') || typeof port.port_code !== 'string' ||
        !port.hasOwnProperty('confidence_score') || typeof port.confidence_score !== 'number' ||
        port.confidence_score < 0 || port.confidence_score > 100
      ) {
        return false;
      }
    }

    return true;
  }


  private async getGroqResponse(keyword: string, portType: string | null): Promise<string> {
     try {
       const query = `User Prompt Format:
                       Input Keyword is ${keyword} and Port Type is ${portType || 'any'}.
 
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
  
  private async getLLMResponse(keyword: string, portType: string | null = null): Promise<PortMatcherResult[]> {
    try {
      if (keyword === "") {
        return [];
      }

      const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
          Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
          Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
      };

      const findMatchingPort = (llmPort: any): Port[] | null => {
        const llmNames = [
          llmPort.name,
          ...llmPort.alternative_names
        ].filter(Boolean).map(name => name.toLowerCase());

        const filteredPorts = portType ? this.portsData.filter(port => port.port_type === portType) : this.portsData;
        
        const matches = filteredPorts.filter(dbPort => {
          const dbNames = [
            dbPort.name,
            dbPort.display_name,
            ...(dbPort.other_names || [])
          ].filter(Boolean).map(name => name.toLowerCase());

          const nameMatch = llmNames.some(llmName => 
            dbNames.some(dbName => dbName === llmName)
          );

          const codeMatch = dbPort.code?.toLowerCase() === llmPort.port_code?.toLowerCase();

          let locationMatch = false;
          if (llmPort.latitude && llmPort.longitude && 
              dbPort.lat_lon?.lat && dbPort.lat_lon?.lon) {
            const distance = calculateDistance(
              parseFloat(llmPort.latitude),
              parseFloat(llmPort.longitude),
              dbPort.lat_lon.lat,
              dbPort.lat_lon.lon
            );
            locationMatch = distance <= 100;
          }

          if (nameMatch || codeMatch || locationMatch) {
            const matchTypes = [];
            if (nameMatch) matchTypes.push('name');
            if (codeMatch) matchTypes.push('code');
            if (locationMatch) matchTypes.push('location');
            (dbPort as any).match_criteria = matchTypes;
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
        
        return matchedPorts ? matchedPorts.map(port => {
          let confidenceAdjustment = 0;
          if (llmPort.latitude && llmPort.longitude && 
              port.lat_lon?.lat && port.lat_lon?.lon) {
            const distance = calculateDistance(
              parseFloat(llmPort.latitude),
              parseFloat(llmPort.longitude),
              port.lat_lon.lat,
              port.lat_lon.lon
            );
            confidenceAdjustment = -(Math.floor(distance / 5));
          }

          let multiCriteriaBonus = 0;
          const matchCount = ((port as any).match_criteria as string[]).length;
          if (matchCount > 1) {
            multiCriteriaBonus = (matchCount - 1) * 5;
          }

          let adjustedConfidence = llmPort.confidence_score + confidenceAdjustment + multiCriteriaBonus;
          adjustedConfidence = Math.max(0, Math.min(100, adjustedConfidence));

          return {
            port_data: port,
            confidence_score: parseFloat(adjustedConfidence.toFixed(2)),
            match_type: `llm:${(port as any).match_criteria.join('+')}`
          };
        }) : [];
      });

      return matchedPorts.sort((a: PortMatcherResult, b: PortMatcherResult) => b.confidence_score - a.confidence_score);
    } catch (error) {
      console.error("Error in getLLMResponse:", error);
      return [];
    }
  }

  private async cascadingSearch(inputString: string, portType: string | null = null): Promise<CascadingResult[]> {
    if (typeof inputString !== "string" || this.normalizeString(inputString) === "") {
      return [];
    }

    // Create a copy of portsData to work with
    let workingPortsData = [...this.portsData];

    try {
      if (portType) {
        workingPortsData = workingPortsData.filter(port => port.port_type === portType);
      }

      const exactResults = this.completeNameSearch(inputString, workingPortsData);
      if (exactResults.length > 0) {
        return exactResults.map(result => ({
          ...result,
          match_algo_type: "exact"
        }));
      }

      workingPortsData = this.filterByLocation(inputString, workingPortsData);

      const wordResults = this.wordSearch(inputString, workingPortsData);
      if (wordResults.length > 0) {
        return wordResults.map(result => ({
          ...result,
          match_algo_type: "word"
        }));
      }

      const rubyResults = await this.rubyFuzzySearch(inputString, workingPortsData);
      if (rubyResults.length > 0) {
        return rubyResults.map(result => ({
          ...result,
          match_algo_type: "fuzzy"
        }));
      }

      const llmResults = await this.getLLMResponse(inputString, portType);
      if (llmResults.length > 0) {
        return llmResults.map(result => ({
          ...result,
          match_algo_type: "llm"
        }));
      }

      return [];
    } catch (error) {
      console.error("Error in cascadingSearch:", error);
      return [];
    }
  }

  async aggregatedResults(keyword: string, portType: string | null = null): Promise<PortMatcherResult[]> {
    try {
      const cascadingResults = await this.cascadingSearch(keyword, portType);
      const highConfidenceMatches = cascadingResults.filter(result => 
        result.confidence_score >= 80 && 
        (result.match_algo_type === "exact" || result.match_algo_type === "word")
      );

      if (highConfidenceMatches.length > 0) {
        return highConfidenceMatches.map(result => ({
          port_data: result.port_data,
          confidence_score: result.confidence_score,
          match_type: result.match_type,
          sources: ['cascading']
        }));
      }

      const [llmResults, remainingCascadingResults] = await Promise.all([
        this.getLLMResponse(keyword, portType),
        Promise.resolve(cascadingResults.filter(result => 
          result.confidence_score < 80 || 
          (result.match_algo_type !== "exact" && result.match_algo_type !== "word")
        ))
      ]);

      if (llmResults.length === 0 && remainingCascadingResults.length === 0) {
        return [];
      }

      const portMap = new Map<string, {
        port_data: Port;
        llm_score: number;
        cascading_score: number;
        match_type: string;
        sources: string[];
      }>();

      for (const result of llmResults) {
        const portId = result.port_data.id;
        portMap.set(portId, {
          port_data: result.port_data,
          llm_score: result.confidence_score,
          cascading_score: 0,
          match_type: result.match_type,
          sources: ['llm']
        });
      }

      for (const result of remainingCascadingResults) {
        const portId = result.port_data.id;
        if (portMap.has(portId)) {
          const existingEntry = portMap.get(portId)!;
          existingEntry.cascading_score = result.confidence_score;
          existingEntry.sources.push('cascading');
          existingEntry.match_type = `${existingEntry.match_type}+${result.match_algo_type}`;
        } else {
          portMap.set(portId, {
            port_data: result.port_data,
            llm_score: 0,
            cascading_score: result.confidence_score,
            match_type: `cascading:${result.match_algo_type}`,
            sources: ['cascading']
          });
        }
      }

      const finalResults: PortMatcherResult[] = Array.from(portMap.values()).map(entry => {
        let finalScore: number;

        if (entry.sources.length === 2) {
          finalScore = (
            (entry.llm_score * 0.6) +
            (entry.cascading_score * 0.4) +
            10
          );
        } else if (entry.sources[0] === 'llm') {
          finalScore = entry.llm_score * 0.9;
        } else {
          finalScore = entry.cascading_score * 0.8;
        }

        finalScore = Math.max(0, Math.min(100, finalScore));

        return {
          port_data: entry.port_data,
          confidence_score: parseFloat(finalScore.toFixed(2)),
          match_type: entry.match_type,
          sources: entry.sources
        };
      });

      return finalResults.sort((a, b) => b.confidence_score - a.confidence_score);
    } catch (error) {
      console.error("Error in aggregatedResults:", error);
      return [];
    }
  }
}



export = PortMatcher; 




  // private async getChatGPTResponse(keyword: string, portType: string | null): Promise<string> {


  //   try {
  //     const query = `User Prompt Format:
  //                     Input Keyword is ${keyword} and Port Type is ${portType || 'any'}.

  //                     Identify and return an array of multiple valid ports that match the given keyword and port type.

  //                     Ensure the output follows exactly this JSON format:

  //                     [
  //                       {
  //                         "name": "<Port Name>",
  //                         "alternative_names": [
  //                           "<Alternative Name 1>",
  //                           "<Alternative Name 2>",
  //                           "<Alternative Name 3>"
  //                           ...lot and lots of alternative names
  //                         ],
  //                         "port_code": "<Official Port Code>",
  //                         "latitude": "<Latitude>",
  //                         "longitude": "<Longitude>",
  //                         "confidence_score": <Confidence Score between 0 and 100>
  //                       }
  //                     ]

  //                     Rules:
  //                     - Return multiple valid matches whenever possible
  //                     - return latitude and longitude accurately
  //                     - Return as many alternative names and commonly used names as possible
  //                     - Ensure the port name is correct and not a misspelling
  //                     - Do not return explanations or alternative suggestions if no match is found. Instead, return exactly: []
  //                     - The confidence_score must be between 0 - 100, reflecting the match accuracy
  //                     - Strictly follow this JSON structure—any deviation is incorrect`;

  //     const completion = await this.openai.chat.completions.create({
  //       messages: [
  //         { role: "system", content: process.env.SYSTEM_PROMPT || "" },
  //         { role: "user", content: query },
  //       ],
  //       model: "gpt-4-turbo-preview",
  //       response_format: { type: "json_object" },
  //       temperature: 0.1,
  //       max_tokens: 4096,
  //     });

  //     const content = completion.choices[0].message.content;
  //     if (!content) {
  //       throw new Error("No content in response");
  //     }


  //     return content;
  //   } catch (error) {
  //     console.error("ChatGPTService :: getResponse :: error", error);
  //     throw error;
  //   }
  // }
