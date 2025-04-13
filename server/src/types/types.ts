export interface LatLon {
  lat: number;
  lon: number;
}

export interface Port {
  _id: string;
  id: string;
  code: string;
  name: string;
  display_name: string;
  other_names: string[];

  city: string;
  state_name: string;
  country: string;
  country_code: string;
  region: string;

  port_type: PortType;
  lat_lon: LatLon;
  nearby_ports: JSON | undefined;
  other_details: JSON | undefined;

  deleted: boolean;
  client_group_id: string | undefined;
  created_at: string;
  updated_at: string;
  sort_order: number;
  verified: boolean | undefined;
  sailing_schedule_available: boolean | undefined;
  item_type: string | undefined;
  master_port: boolean | undefined;
  address: string | undefined;
  fax_number: string | undefined;
  telephone_number: string | undefined;
  website: string | undefined;
  description: string | undefined;
  seo_code: string | undefined;
  seo_updated: boolean | undefined;
  is_head_port: boolean | undefined;
  prefer_inland: boolean | undefined;
  country_port: boolean | undefined;
}

export enum PortType {
  SEA = "sea_port",
  INLAND = "inland_port",
  AIR = "air_port",
  ADDRESS = "address",
}

export interface statusPort {
  port: Port;
  verified: boolean;
  match_score: number;
}

export interface MappedPort {
  port_data: Port;
  confidence_score: number;
  match_type: string;
  sources: string[];
}


export interface CascadingResult {
  /**
   * Interface representing a cascading search result
   */
  port_data: Port;
  confidence_score: number;
  match_type: string;
  match_algo_type: string;
}
export interface PortMatcherResult {
  port_data: Port;
  confidence_score: number;
  match_type: string;
  sources: string[];
}
