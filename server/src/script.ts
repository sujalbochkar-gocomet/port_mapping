import { Request, Response } from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";

import { CascadingResult,PortMatcherResult} from "./types/types";
import { prisma } from "./lib/prisma";
import PortMatcher from "../port_mapper/mapper";
import swaggerOptions from "./lib/swagger";
import { MemoryMonitor } from "./utils/memory-monitor";

const express = require("express");
const app = express();
const port = 3000;
let portMatcher: PortMatcher | null = null;
let refreshInterval: NodeJS.Timeout | null = null;
const swaggerDocs = swaggerJsdoc(swaggerOptions);


app.use(cors());
app.use(express.json());

// Serve Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Add the refresh function
async function refreshPortData() {
  try {
    if (portMatcher) {
      await portMatcher.refreshData();
    }
  } catch (error) {
    console.error("Failed to refresh port data:", error);
    // If refresh fails, try to reinitialize the PortMatcher
    try {
      await initializePortMatcher();
    } catch (reinitError) {
      console.error("Failed to reinitialize PortMatcher:", reinitError);
    }
  }
}

// Modify the initializePortMatcher function to set up the refresh interval
const initializePortMatcher = async () => {
  try {
    portMatcher = await PortMatcher.getInstance();

    // Clear any existing refresh interval
    if (refreshInterval) {
      clearInterval(refreshInterval);
    }

    // Set up hourly refresh (3600000 ms = 1 hour)
    refreshInterval = setInterval(refreshPortData, 3600000);
  } catch (error) {
    console.error("Failed to initialize PortMatcher:", error);
    throw error;
  }
};


// Initialize server
const startServer = async () => {
  try {
    await initializePortMatcher();
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
      console.log(
        `API documentation available at http://localhost:${port}/api-docs`
      );
      
      // Start memory monitoring (check every 1 minute)
      MemoryMonitor.startMonitoring(20000);
      
      // Log initial memory state
      MemoryMonitor.logMemoryUsage('Server Start');
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

/**
 * @swagger
 * /:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns the health status of the API
 *     responses:
 *       200:
 *         description: API is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: healthy
 *                 message:
 *                   type: string
 *                   example: Port Mapping API is running
 */
app.get("/", (_req: Request, res: Response) => {
  res
    .status(200)
    .json({ status: "healthy", message: "Port Mapping API is running" });
});

/**
 * @swagger
 * /search-ports:
 *   get:
 *     summary: Search for ports
 *     description: Search for ports based on query and type
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Port type filter
 *     responses:
 *       200:
 *         description: List of matching ports
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PortSearchResult'
 *       500:
 *         description: Server error
 */
app.get("/search-ports", async (req: Request, res: Response) => {
  try {
    if (!portMatcher) {
      throw new Error("PortMatcher not initialized");
    }

    const query = (req.query.q as string)?.toLowerCase() || "";
    const type = req.query.type as string;

    let results = [];
    if (type === "all")
      results = await portMatcher.aggregatedResults(query, null);
    else results = await portMatcher.aggregatedResults(query, type);

    if (results.length === 0) {
      res.status(200).json([]);
      return;
    }

    const transformedPorts = results.map((result: PortMatcherResult) => ({
      port: result.port_data,
      verified: true,
      match_score: result.confidence_score,
      match_type: result.match_type,
      sources: result.sources,
    }));

    res.status(200).json(transformedPorts.slice(0, 10));
  } catch (error) {
    console.error("Error searching ports:", error);
    res.status(500).json({
      error: "Failed to search ports",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * @swagger
 * /search-ports/all:
 *   get:
 *     summary: Search for ports
 *     description: Search for ports based on query and type
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Port type filter
 *     responses:
 *       200:
 *         description: List of matching ports
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PortSearchResult'
 *       500:
 *         description: Server error
 */
app.get("/search-ports/all", async (req: Request, res: Response) => {
  try {
    if (!portMatcher) {
      throw new Error("PortMatcher not initialized");
    }

    const query = (req.query.q as string)?.toLowerCase() || "";
    const type = req.query.type as string;

    let results = [];
    if (type === "all")
      results = await portMatcher.aggregatedResults(query, null, true);
    else results = await portMatcher.aggregatedResults(query, type, true);

    if (results.length === 0) {
      res.status(200).json([]);
      return;
    }

    const transformedPorts = results.map((result: PortMatcherResult) => ({
      port: result.port_data,
      verified: true,
      match_score: result.confidence_score,
      match_type: result.match_type,
      sources: result.sources,
    }));

    res.status(200).json(transformedPorts.slice(0, 10));
  } catch (error) {
    console.error("Error searching ports:", error);
    res.status(500).json({
      error: "Failed to search ports",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

app.get("/issue-search", async (req: Request, res: Response) => {
  // example link http://localhost:3000/issue-search?q=los
  const query = (req.query.q as string)?.toLowerCase() || "";
  const type = req.query.type as string;
  const ports = await prisma.port.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { code: { contains: query, mode: "insensitive" } },
        { display_name: { contains: query, mode: "insensitive" } },
        { country: { contains: query, mode: "insensitive" } },
        { city: { contains: query, mode: "insensitive" } },
        { other_names: { has: query } },
      ],
      port_type: type,
      verified: true,
    },
    take: 40,
  });
  res.status(200).json(ports);
});

/**
 * @swagger
 * /search-ports/complete-name:
 *   get:
 *     summary: Search for ports using complete name matching
 *     description: Search for ports using exact name matching algorithm
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Port type filter
 *     responses:
 *       200:
 *         description: List of matching ports
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PortSearchResult'
 *       500:
 *         description: Server error
 */
app.get("/search-ports/complete-name", async (req: Request, res: Response) => {
  try {
    if (!portMatcher) {
      throw new Error("PortMatcher not initialized");
    }

    const query = (req.query.q as string)?.toLowerCase() || "";
    const type = req.query.type as string;

    // Filter ports by type if specified
    let filteredPorts = [...portMatcher.portsData];
    if (type) {
      filteredPorts = filteredPorts.filter((port) => port.port_type === type);
    }

    // Perform complete name search
    const results = portMatcher.completeNameSearch(query, filteredPorts);

    if (results.length === 0) {
      res.status(200).json([]);
      return;
    }

    const transformedPorts = results.map((result: CascadingResult) => ({
      port: result.port_data,
      verified: true,
      match_score: result.confidence_score,
      match_type: result.match_type,
      sources: ["complete_name"],
    }));

    res.status(200).json(transformedPorts.slice(0, 10));
  } catch (error) {
    console.error("Error in complete name search:", error);
    res.status(500).json({
      error: "Failed to perform complete name search",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * @swagger
 * /search-ports/fuzzy:
 *   get:
 *     summary: Search for ports using fuzzy matching
 *     description: Search for ports using fuzzy matching algorithm with optional location filtering
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Port type filter
 *       - in: query
 *         name: use_location_filter
 *         schema:
 *           type: boolean
 *         description: Whether to enable location-based filtering
 *     responses:
 *       200:
 *         description: List of matching ports
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PortSearchResult'
 *       500:
 *         description: Server error
 */
app.get("/search-ports/fuzzy", async (req: Request, res: Response) => {
  try {
    if (!portMatcher) {
      throw new Error("PortMatcher not initialized");
    }

    const query = (req.query.q as string)?.toLowerCase() || "";
    const type = req.query.type as string;
    const useLocationFilter = req.query.use_location_filter === "true";

    // Filter ports by type if specified
    let filteredPorts = [...portMatcher.portsData];
    if (type) {
      filteredPorts = filteredPorts.filter((port) => port.port_type === type);
    }

    // Apply location filtering if enabled
    if (useLocationFilter) {
      filteredPorts = portMatcher.filterByLocation(query, filteredPorts);
    }

    // Perform fuzzy search
    const results = await portMatcher.rubyFuzzySearch(query, filteredPorts);

    if (results.length === 0) {
      res.status(200).json([]);
      return;
    }

    const transformedPorts = results.map((result: CascadingResult) => ({
      port: result.port_data,
      verified: true,
      match_score: result.confidence_score,
      match_type: result.match_type,
      sources: ["fuzzy_search"],
    }));

    res.status(200).json(transformedPorts.slice(0, 10));
  } catch (error) {
    console.error("Error in fuzzy search:", error);
    res.status(500).json({
      error: "Failed to perform fuzzy search",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * @swagger
 * /search-ports/llm:
 *   get:
 *     summary: Search for ports using LLM-based matching
 *     description: Search for ports using LLM-based matching algorithm with optional location filtering
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Port type filter
 *       - in: query
 *         name: use_location_filter
 *         schema:
 *           type: boolean
 *         description: Whether to enable location-based filtering
 *     responses:
 *       200:
 *         description: List of matching ports
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PortSearchResult'
 *       500:
 *         description: Server error
 */
app.get("/search-ports/llm", async (req: Request, res: Response) => {
  try {
    if (!portMatcher) {
      throw new Error("PortMatcher not initialized");
    }

    const query = (req.query.q as string)?.toLowerCase() || "";
    const type = req.query.type as string;
    const useLocationFilter = req.query.use_location_filter === "true";

    // Filter ports by type if specified
    let filteredPorts = [...portMatcher.portsData];
    if (type) {
      filteredPorts = filteredPorts.filter((port) => port.port_type === type);
    }

    // Apply location filtering if enabled
    if (useLocationFilter) {
      filteredPorts = portMatcher.filterByLocation(query, filteredPorts);
    }

    // Perform LLM search
    const results = await portMatcher.getLLMResponse(query, type);

    if (results.length === 0) {
      res.status(200).json([]);
      return;
    }

    const transformedPorts = results.map((result: PortMatcherResult) => ({
      port: result.port_data,
      verified: true,
      match_score: result.confidence_score,
      match_type: result.match_type,
      sources: result.sources,
    }));

    console.log("LLM search ended", transformedPorts.length);
    res.status(200).json(transformedPorts.slice(0, 10));
  } catch (error) {
    console.error("Error in LLM search:", error);
    res.status(500).json({
      error: "Failed to perform LLM search",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});


/**
 * @swagger
 * /search-ports/llm-raw:
 *   get:
 *     summary: Groq LLM Response
 *     description: Get response from Groq LLM
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Port type filter
 *     responses:
 *       200:
 *         description: List of matching ports
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PortSearchResult'
 *       500:
 *         description: Server error
 */

app.get("/search-ports/llm-raw", async (req: Request, res: Response) => {
  try {
    if (!portMatcher) {
      throw new Error("PortMatcher not initialized");
    }

    const query = (req.query.q as string)?.toLowerCase() || "";
    const type = req.query.type as string;

    // Get raw LLM response
    const rawResponse = await portMatcher.getGroqResponse(query, type);
  
      // Parse and validate the response
      const jsonResponse = JSON.parse(rawResponse);
      const isValid = portMatcher.validateLLMResponse(jsonResponse);
      
      if (!isValid) {
        throw new Error('Invalid LLM response format');
      }
      
      res.status(200).json(jsonResponse);
    } catch (error) {
    console.error("Error in LLM search:", error);
    res.status(500).json({
      error: "Failed to perform LLM search",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});



/**
 * @swagger
 * /search-ports/cascading-results:
 *   get:
 *     summary: Get cascading search results
 *     description: Get results from all cascading search methods (exact, word, fuzzy) with their respective scores
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Port type filter
 *     responses:
 *       200:
 *         description: List of matching ports with cascading results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 exact_matches:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PortSearchResult'
 *                 word_matches:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PortSearchResult'
 *                 fuzzy_matches:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PortSearchResult'
 *       500:
 *         description: Server error
 */
app.get(
  "/search-ports/cascading-results",
  async (req: Request, res: Response) => {
    try {
      if (!portMatcher) {
        throw new Error("PortMatcher not initialized");
      }

      const query = (req.query.q as string)?.toLowerCase() || "";
      const type = req.query.type as string;

      // Filter ports by type if specified
      let filteredPorts = [...portMatcher.portsData];
      if (type) {
        filteredPorts = filteredPorts.filter((port) => port.port_type === type);
      }

      const results = await portMatcher.cascadingSearch(query, type);

      if (results.length == 0) {
        res.status(200).json([]);
        return;
      }

      const transformedPorts = results.map((result: CascadingResult) => ({
        port: result.port_data,
        verified: true,
        match_score: result.confidence_score,
        match_type: result.match_type,
      }));

      res.status(200).json(transformedPorts.slice(0, 10));
    } catch (error) {
      console.error("Error getting cascading results:", error);
      res.status(500).json({
        error: "Failed to get cascading results",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

/**
 * @swagger
 * /search-ports/filter-by-location:
 *   get:
 *     summary: Filter ports by location and type
 *     description: Filter ports based on location string and port type using the PortMatcher's filtering algorithm
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Location string to filter by (e.g., "ho chi minh city, vietnam")
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Port type to filter by. Use 'all' to include all types
 *     responses:
 *       200:
 *         description: List of matching ports
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PortSearchResult'
 *       400:
 *         description: Bad request - missing required parameters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Location query parameter 'q' is required
 *       500:
 *         description: Server error
 */
app.get( "/search-ports/filter-by-location",async (req: Request, res: Response) => {
    try {
      if (!portMatcher) {
        throw new Error("PortMatcher not initialized");
      }

      const query = (req.query.q as string)?.toLowerCase() || "";
      const type = req.query.type as string;

      if (!query) {
        return res.status(400).json({
          error: "Location query parameter 'q' is required",
        });
      }

      // First filter by type if specified
      let workingPortsData = [...portMatcher.portsData];
      if (type && type !== "all") {
        workingPortsData = workingPortsData.filter(
          (port) => port.port_type === type
        );
      }

      // Then apply location filtering
      const filteredPorts = portMatcher.filterByLocation(
        query,
        workingPortsData
      );

      if (filteredPorts.length === 0) {
        return res.status(200).json([]);
      }

      console.log(filteredPorts.length);

      // Transform the results to match the PortSearchResult schema

      return res.status(200).json(filteredPorts.slice(0, 10));
    } catch (error) {
      console.error("Error filtering ports by location:", error);
      return res.status(500).json({
        error: "Failed to filter ports by location",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);



/**
 * @swagger
 * /add-shipment:
 *   post:
 *     summary: Add a new shipment
 *     description: Create a new shipment with POL and POD information
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - pol
 *               - pod
 *               - carrierType
 *             properties:
 *               pol:
 *                 type: object
 *                 properties:
 *                   port:
 *                     $ref: '#/components/schemas/Port'
 *                   verified:
 *                     type: boolean
 *                   match_score:
 *                     type: number
 *               pod:
 *                 type: object
 *                 properties:
 *                   port:
 *                     $ref: '#/components/schemas/Port'
 *                   verified:
 *                     type: boolean
 *                   match_score:
 *                     type: number
 *               carrierType:
 *                 type: string
 *     responses:
 *       200:
 *         description: Shipment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Shipment'
 *       500:
 *         description: Server error
 */
app.post("/add-shipment", async (req: Request, res: Response) => {
  try {
    const { pol, pod, carrierType } = req.body;

    // Create shipment with the structure matching your schema
    const shipment = await prisma.shipment.create({
      data: {
        carrierType,

        // POL fields
        pol_id: pol.port._id ? pol.port._id : "",
        polId: pol.port.id || "",
        polName: pol.port.name || "",
        polType: pol.port.port_type || "",
        polCountry: pol.port.country || "",
        polCountryCode: pol.port.country_code || "",
        polCode: pol.port.country_code || "",
        polIsCustom: pol.port.id?.startsWith("temp-") || false,
        polVerified: pol.verified || false,
        polMatchScore: pol.match_score || 0,
        polLatLon: pol.port.lat_lon
          ? {
              lat: pol.port.lat_lon.lat || 0,
              lon: pol.port.lat_lon.lon || 0,
            }
          : null,
        polDisplay_name: pol.port.display_name || "",
        polOther_names: pol.port.other_names || [],
        polCity: pol.port.city || "",
        polState_name: pol.port.state_name || "",
        polRegion: pol.port.region || "",
        polPort_type: pol.port.port_type || "",
        polLat_lon: {
          lat: pol.port.lat_lon?.lat || 0,
          lon: pol.port.lat_lon?.lon || 0,
        },
        polNearby_ports: pol.port.nearby_ports || {},
        polOther_details: pol.port.other_details || {},

        // POD fields
        pod_id: pod.port._id || "",
        podId: pod.port.id || "",
        podName: pod.port.name || "",
        podType: pod.port.port_type || "",
        podCountry: pod.port.country || "",
        podCountryCode: pod.port.country_code || "",
        podCode: pod.port.country_code || "",
        podIsCustom: pod.port.id?.startsWith("temp-") || false,
        podVerified: pod.verified || false,
        podMatchScore: pod.match_score || 0,
        podLatLon: pod.port.lat_lon
          ? {
              lat: pod.port.lat_lon.lat || 0,
              lon: pod.port.lat_lon.lon || 0,
            }
          : null,
        podDisplay_name: pod.port.display_name || "",
        podOther_names: pod.port.other_names || [],
        podCity: pod.port.city || "",
        podState_name: pod.port.state_name || "",
        podRegion: pod.port.region || "",
        podPort_type: pod.port.port_type || "",
        podLat_lon: {
          lat: pod.port.lat_lon?.lat || 0,
          lon: pod.port.lat_lon?.lon || 0,
        },
        podNearby_ports: pod.port.nearby_ports || {},
        podOther_details: pod.port.other_details || {},
      },
    });

    res.status(200).json(shipment);
  } catch (error) {
    console.error("Error creating shipment:", error);
    res.status(500).json({
      error: "Failed to create shipment",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * @swagger
 * /get-shipments:
 *   get:
 *     summary: Get all shipments
 *     description: Retrieve all shipments with optional filtering and sorting
 *     parameters:
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Sort order
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [all, verified, unverified]
 *         description: Filter type
 *     responses:
 *       200:
 *         description: List of shipments
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Shipment'
 *       500:
 *         description: Server error
 */
app.get("/get-shipments", async (req: Request, res: Response) => {
  try {
    const order = (req.query.order as string) || "desc";
    const filterType = (req.query.type as string) || "all";

    let whereClause = {};
    if (filterType === "verified") {
      whereClause = {
        AND: [{ polVerified: true }, { podVerified: true }],
      };
    } else if (filterType === "unverified") {
      whereClause = {
        OR: [{ polVerified: false }, { podVerified: false }],
      };
    }

    const shipments = await prisma.shipment.findMany({
      orderBy: {
        createdAt: order === "asc" ? "asc" : "desc",
      },
      where: whereClause,
    });
    res.status(200).json(shipments);
  } catch (error) {
    console.error("Error fetching shipments:", error);
    res.status(500).json({
      error: "Failed to fetch shipments",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * @swagger
 * /delete-shipment/{id}:
 *   delete:
 *     summary: Delete a shipment
 *     description: Delete a shipment by its ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Shipment ID
 *     responses:
 *       200:
 *         description: Shipment deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Shipment deleted successfully
 *       500:
 *         description: Server error
 */
app.delete("/delete-shipment/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.shipment.delete({ where: { id } });
    res.status(200).json({ message: "Shipment deleted successfully" });
  } catch (error) {
    console.error("Error deleting shipment:", error);
    res.status(500).json({
      error: "Failed to delete shipment",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});




