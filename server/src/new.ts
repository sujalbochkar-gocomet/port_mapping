import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testDatabaseConnection() {
  try {
    const ports = await prisma.port.findMany({
      take: 5,
      select: {
        id: true,
        name: true,
        code: true,
        display_name: true,
        country: true,
        port_type: true,
      },
    });

    console.log("Successfully connected to database. Retrieved 5 ports:");
    console.log(ports);
  } catch (error) {
    console.error("Error connecting to database:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabaseConnection();
