import { PrismaClient } from "@prisma/client";
import { PortType } from "./types/types";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

async function main() {
  try {
    // Load data from JSON file
    const dataPath = path.join(__dirname, "../data/dummyData.json");
    const rawData = fs.readFileSync(dataPath, "utf-8");
    const data = JSON.parse(rawData);

    console.log(data);

    // // delete just the data from the ports table  not the table itself
    // try {
    //   await prisma.port.deleteMany();
    //   console.log("Ports table deleted successfully");
    // } catch (error) {
    //   console.error("Error deleting ports:", error);
    // }

    // console.log(`Found ${data.length} ports to import`);

    // Transform and insert each record
    let successCount = 0;
    let errorCount = 0;

    for (const port of data) {
      try {
        const transformedPort = {
          id: port.id,
          name: port.name || null,
          code: port.code || null,
          display_name: port.display_name || null,
          country: port.country || null,
          country_code: port.country_code || null,
          port_type: transformPortType(port.port_type),
          created_at: new Date(port.created_at || Date.now()),
          updated_at: new Date(port.updated_at || Date.now()),
          sort_order: typeof port.sort_order === "number" ? port.sort_order : 0,
          deleted: Boolean(port.deleted),
          other_names: Array.isArray(port.other_names) ? port.other_names : [],
          lat_lon: {
            lat: parseFloat(port.lat_lon?.lat) || 0,
            lon: parseFloat(port.lat_lon?.lon) || 0,
          },
          nearby_ports: port.nearby_ports
            ? JSON.parse(JSON.stringify(port.nearby_ports))
            : null,
          other_details: port.other_details
            ? JSON.parse(JSON.stringify(port.other_details))
            : null,
          verified: typeof port.verified === "boolean" ? port.verified : false,
          sailing_schedule_available: Boolean(port.sailing_schedule_available),
          master_port: Boolean(port.master_port),
          is_head_port: Boolean(port.is_head_port),
          prefer_inland: Boolean(port.prefer_inland),
          country_port: Boolean(port.country_port),
          seo_updated: Boolean(port.seo_updated),
          city: port.city || null,
          state_name: port.state_name || null,
          region: port.region || null,
          address: port.address || null,
          fax_number: port.fax_number || null,
          telephone_number: port.telephone_number || null,
          website: port.website || null,
          description: port.description || null,
          seo_code: port.seo_code || null,
          item_type: port.item_type || null,
          client_group_id: port.client_group_id || null,
        };

        await prisma.port.create({
          data: transformedPort,
        });
        successCount++;

        if (successCount % 100 === 0) {
          console.log(`Progress: ${successCount} ports imported successfully`);
        }
      } catch (error) {
        console.error(
          `Failed to import port:`,
          port.name || port.display_name || port.code
        );
        console.error(error);
        errorCount++;
      }
    }

    console.log(`Import completed:
    - Successfully imported: ${successCount} ports
    - Failed to import: ${errorCount} ports
    - Total processed: ${data.length} ports`);
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}

function transformPortType(type: string): PortType {
  switch (type?.toLowerCase()) {
    case "sea":
    case "sea_port":
      return PortType.SEA;
    case "inland":
    case "inland_port":
      return PortType.INLAND;
    case "air":
    case "air_port":
      return PortType.AIR;
    case "address":
      return PortType.ADDRESS;
    default:
      return PortType.SEA; // default to sea_port
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
