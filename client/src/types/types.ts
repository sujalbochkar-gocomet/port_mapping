export interface LatLon {
  lat: number;
  lon: number;
}

export interface Port {
  _id: string;
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
  match_score: number;
  port?: Port;
}

export interface Shipment {
  id: string;
  carrierType: string;
  pol: PortVerification;
  pod: PortVerification;
}

export interface statusPort {
  port: Port;
  verified: boolean;
  match_score: number;
}
