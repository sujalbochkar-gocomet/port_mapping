import { MappedPort, Port, PortType, statusPort } from "./types/types";
import { Request, Response } from "express";
import cors from "cors";
import express from "express";
import { prisma } from "./lib/prisma";

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

app.get("/", (_req: Request, res: Response) => {
  res
    .status(200)
    .json({ status: "healthy", message: "Port Mapping API is running" });
});

app.get("/search-ports", async (req: Request, res: Response) => {
  try {
    const query = (req.query.q as string)?.toLowerCase() || "";

    const type = req.query.type as string;
    console.log(`Searching ports with query: "${query}" and type: "${type}"`);

    // const ports = await prisma.port.findMany({
    //   where: {
    //     OR: [
    //       { name: { contains: query, mode: "insensitive" } },
    //       { code: { contains: query, mode: "insensitive" } },
    //       { display_name: { contains: query, mode: "insensitive" } },
    //       { country: { contains: query, mode: "insensitive" } },
    //       { city: { contains: query, mode: "insensitive" } },
    //       { other_names: { has: query } },
    //     ],
    //     ...(type !== "all" && {
    //       AND: [{ port_type: { equals: type } }, { verified: true }],
    //     }),
    //   },
    //   take: 40,
    // });

    const ports: MappedPort[] = [];
    
    // const ports = map_port_name(query);

    if (ports.length === 0) {
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
    // const transformedPorts = ports.map((port) => ({
    //   port: port,
    //   verified: true,
    //   match_score: Math.floor(Math.random() * (100 - 90) + 90),
    // }));
    const transformedPorts = ports.map((port) => ({
      port: port.port_data,
      verified: true,
      match_score: port.confidence_score,
    }));
    transformedPorts.sort((a, b) => b.match_score - a.match_score);
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

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
