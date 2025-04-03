import Fuse from "fuse.js";
import prisma from "../src/lib/prisma";

const ignoredKeywords = new Set([
  "Harbor",
  "Seaport",
  "Wharf",
  "Dock",
  "Jetty",
  "Anchorage",
  "Haven",
  "Marina",
  "Harborage",
  "Mooring",
  "Landing",
  "Boatyard",
  "Roadstead",
  "Dockyard",
  "Quay",
  "Pier",
  "Basin",
  "Inlet",
  "Cove",
  "Bay",
  "Terminus",
  "Depot",
  "Station",
  "Concluding",
  "Final",
  "Last",
  "Closing",
  "End",
  "Terminating",
  "Ultimate",
  "Extreme",
  "Endmost",
  "Nethermost",
  "Outmost",
  "Utmost",
  "Terminal",
  "Port",
]);

function normalizeString(str: string) {
  return str?.toLowerCase().trim() || "";
}


export class PortMapper {
  private portsData: any[] = [];
  private fuse: Fuse<any>;
  constructor(data: any[]) {
    this.portsData = data;
    this._createFuseIndex();
  }
  private _createFuseIndex(): void {
    const options = {
      keys: ["Main Port Name", "Alternate Port Name", "UN/LOCODE"],
      threshold: 0.5,
      includeScore: true,
      includeMatches: false, //Lets Use this if we want to understand why it matched
      findAllMatches: false,
    };
    this.fuse = new Fuse(this.portsData, options);
  }

  static async loadPortsData(filePath: string): Promise<any[]> {
    const data = await prisma.port.findMany();
    return data;
  }
}
