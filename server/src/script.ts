import { Port, PortType, statusPort } from "./types/types";
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
        ...(type !== "all" && { AND: [{ port_type: { equals: type } }] }),
      },
      take: 40,
    });

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
        verified: true,
        match_score: Math.floor(Math.random() * (100 - 90) + 90),
      };
      res.status(200).json(statusPort);
      return;
    }
    const transformedPorts = ports.map((port) => ({
      port: port,
      verified: true,
      match_score: Math.floor(Math.random() * (100 - 90) + 90),
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
  const { pol, pod, carrierType } = req.body;
  const shipment = await prisma.shipment.create({
    data: {
      pol,
      pod,
      carrierType,
    },
  });
  res.status(200).json({ shipment });
});

app.get("/get-shipments", async (req: Request, res: Response) => {
  const shipments = await prisma.shipment.findMany();
  res.status(200).json({ shipments });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
