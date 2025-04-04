import { Port, PortType, statusPort } from "./types/types";
import { Request, Response } from "express";
import cors from "cors";
const express = require('express');
import { prisma } from "./lib/prisma";
import PortMatcher = require("../port_mapper/mapper");

interface PortMatcherResult {
  port_data: Port;
  confidence_score: number;
  match_type: string;
  sources: string[];
}

const app = express();
const port = 3000;
let portMatcher: PortMatcher | null = null;

app.use(cors());
app.use(express.json());

// Initialize database and PortMatcher
const initializePortMatcher = async () => {
  try {
    console.log("Initializing PortMatcher...");
    const portsData = await PortMatcher.loadPortsData();
    portMatcher = new PortMatcher(portsData);
    console.log("PortMatcher initialized successfully");
  } catch (error) {
    console.error("Failed to initialize PortMatcher:", error);
    throw error;
  }
};

app.get("/", (_req: Request, res: Response) => {
  res
    .status(200)
    .json({ status: "healthy", message: "Port Mapping API is running" });
});

app.get("/search-ports", async (req: Request, res: Response) => {
  try {
    if (!portMatcher) {
      throw new Error("PortMatcher not initialized");
    }

    const query = (req.query.q as string)?.toLowerCase() || "";
    const type = req.query.type as string;
    console.log(`Searching ports with query: "${query}" and type: "${type}"`);

    let results = [];
    if (type === "all") results = await portMatcher.aggregatedResults(query, null);
    else results = await portMatcher.aggregatedResults(query, type);
    
    if (results.length === 0) {
      console.log("No ports found");
      const tempPort: Partial<Port> = {
        _id: `temp-${Date.now()}`,
        id: `temp-${Date.now()}`,
        name: query,
        display_name: query,
        port_type: type as PortType,
        code: "",
        other_names: [],
        city: "",
        state_name: "",
        country: "",
        country_code: "",
        region: "",
        lat_lon: { lat: 0, lon: 0 },
        nearby_ports: JSON.parse("{}"),
        other_details: JSON.parse("{}"),
        deleted: true,
        client_group_id: "",
        created_at: new Date(),
        updated_at: new Date(),
        sort_order: 0,
        verified: false,
        sailing_schedule_available: false,
        item_type: "",
        master_port: false,
        address: "",
        fax_number: "",
        telephone_number: "",
        website: "",
        description: "",
        seo_code: "",
        seo_updated: false,
        is_head_port: false,
        prefer_inland: false,
        country_port: false,
      };
      const statusPort: statusPort = {
        port: tempPort as Port,
        verified: false,
        match_score: Math.floor(Math.random() * (50 - 30) + 30),
      };
      res.status(200).json([statusPort]);
      return;
    }

    const transformedPorts = results.map((result: PortMatcherResult) => ({
      port: result.port_data,
      verified: true,
      match_score: result.confidence_score,
    }));


    res.status(200).json(transformedPorts);
  } catch (error) {
    console.error("Error searching ports:", error);
    res.status(500).json({
      error: "Failed to search ports",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

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

    console.log("Shipment created:", shipment);
    res.status(200).json(shipment);
  } catch (error) {
    console.error("Error creating shipment:", error);
    res.status(500).json({
      error: "Failed to create shipment",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

app.get("/get-shipments", async (req: Request, res: Response) => {
  try {
    const order = (req.query.order as string) || "desc";
    const filterType = (req.query.type as string) || "all";
    console.log(
      `Fetching shipments with order: ${order}, filter: ${filterType}`
    );
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

app.delete("/delete-shipment/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  await prisma.shipment.delete({ where: { id } });
  res.status(200).json({ message: "Shipment deleted successfully" });
});

// Initialize server
const startServer = async () => {
  try {
    await initializePortMatcher();
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
