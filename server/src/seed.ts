import { PrismaClient } from "@prisma/client";
import { PortType } from "./types/types";

const prisma = new PrismaClient();

async function main() {
  // Create the Port table schema

  await prisma.port.create({
    data: {
      uuid: "port-1",
      code: "PORT1",
      name: "Port 1",
      port_type: PortType.SEA,
      lat_lon: {
        lat: 1.0,
        lon: 1.0,
      },
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
