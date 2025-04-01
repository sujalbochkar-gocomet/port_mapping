export interface LatLon {
  lat: number;
  lon: number;
}

export interface Port {
  id: string;
  name: string;
  display_name: string;
  city: string;
  country: string;
  country_code: string;
  code: string;
  port_type: string;
  deleted: boolean;
  client_group_id: string | null;
  region: string;
  lat_lon: { lat: number; lon: number };
  created_at: string;
  updated_at: string;
  other_names: string[];
  sort_order: number;
  other_details: { origin: string };
  verified: boolean;
  sailing_schedule_available: boolean;
  item_type: string;
  master_port: boolean;
  nearby_ports: string[];
  address: string;
  fax_number: string | null;
  telephone_number: string | null;
  website: string | null;
  description: string;
  seo_code: string | null;
  seo_updated: boolean;
  state_name: string;
  is_head_port: boolean;
  prefer_inland: boolean;
  country_port: boolean;
}

export interface PortVerification {
  portId: string;
  verified: boolean;
  verified_message: string;
  port?: Port;
}

export interface Shipment {
  id: string;
  carrierType: string;
  pol: PortVerification;
  pod: PortVerification;
}

export const tempShipmentData: Shipment[] = [
  {
    id: "ship_123",
    carrierType: "Ocean Freight",
    pol: {
      portId: "pol_123",
      verified: true,
      verified_message: "95%",
      port: {
        id: "port_1",
        name: "Port of Singapore",
        display_name: "Singapore Port",
        city: "Singapore",
        country: "Singapore",
        country_code: "SG",
        code: "SGSIN",
        port_type: "sea_port",
        deleted: false,
        client_group_id: null,
        region: "Southeast Asia",
        lat_lon: { lat: 1.29027, lon: 103.851959 },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        other_names: ["PSA Singapore"],
        sort_order: 1,
        other_details: { origin: "manual" },
        verified: true,
        sailing_schedule_available: true,
        item_type: "port",
        master_port: true,
        nearby_ports: [],
        address: "Maritime Square, Singapore",
        fax_number: null,
        telephone_number: null,
        website: "https://www.singaporepsa.com",
        description: "Major port in Southeast Asia",
        seo_code: null,
        seo_updated: false,
        state_name: "Singapore",
        is_head_port: true,
        prefer_inland: false,
        country_port: true,
      },
    },
    pod: {
      portId: "pod_123",
      verified: false,
      verified_message: "45%",
      port: {
        id: "port_2",
        name: "Port of Rotterdam",
        display_name: "Rotterdam Port",
        city: "Rotterdam",
        country: "Netherlands",
        country_code: "NL",
        code: "NLRTM",
        port_type: "sea_port",
        deleted: false,
        client_group_id: null,
        region: "Western Europe",
        lat_lon: { lat: 51.9225, lon: 4.47917 },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        other_names: ["Port of Rotterdam Authority"],
        sort_order: 2,
        other_details: { origin: "manual" },
        verified: false,
        sailing_schedule_available: true,
        item_type: "port",
        master_port: true,
        nearby_ports: [],
        address: "Wilhelminakade 909, Rotterdam",
        fax_number: null,
        telephone_number: null,
        website: "https://www.portofrotterdam.com",
        description: "Largest port in Europe",
        seo_code: null,
        seo_updated: false,
        state_name: "South Holland",
        is_head_port: true,
        prefer_inland: false,
        country_port: true,
      },
    },
  },
];
