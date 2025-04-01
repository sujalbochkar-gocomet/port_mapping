import { Port, PortType } from "./types/types";
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

    // Only include port_type in where clause if type is provided
    const whereClause: any = {
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { code: { contains: query, mode: "insensitive" } },
        { display_name: { contains: query, mode: "insensitive" } },
        { country: { contains: query, mode: "insensitive" } },
        { city: { contains: query, mode: "insensitive" } },
      ],
    };
    if (type && type !== "all") {
      whereClause.port_type = type;
    }
    const ports = await prisma.port.findMany({
      where: whereClause,
      orderBy: [{ verified: "desc" }, { sort_order: "asc" }, { name: "asc" }],
      take: 20,
    });
    res.status(200).json(ports);
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
  console.log(pol, pod, carrierType);
  //   const shipment = await prisma.shipment.create({
  //     data: {
  //       pol,
  //       pod,
  //       carrierType,
  //     },
  //   });
  res.status(200).json({ message: "Shipment added successfully" });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
