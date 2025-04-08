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

export interface Shipment {
  id: string;
  carrierType: string;

  // POL data
  pol_id: string;
  polId: string;
  polName?: string;
  polType?: string;
  polCountry?: string;
  polCountryCode?: string;
  polCode?: string;
  polIsCustom: boolean;
  polVerified: boolean;
  polMatchScore?: number;
  polLatLon?: LatLon;
  polDisplay_name?: string;
  polOther_names: string[];
  polCity?: string;
  polState_name?: string;
  polRegion?: string;
  polPort_type?: string;
  polLat_lon: LatLon;
  polNearby_ports?: JSON;
  polOther_details?: JSON;

  // POD data
  pod_id: string;
  podId: string;
  podName?: string;
  podType?: string;
  podCountry?: string;
  podCountryCode?: string;
  podCode?: string;
  podIsCustom: boolean;
  podVerified: boolean;
  podMatchScore?: number;
  podLatLon?: LatLon;
  podDisplay_name?: string;
  podOther_names: string[];
  podCity?: string;
  podState_name?: string;
  podRegion?: string;
  podPort_type?: string;
  podLat_lon: LatLon;
  podNearby_ports?: JSON;
  podOther_details?: JSON;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export interface statusPort {
  port: Port;
  verified: boolean;
  match_score: number;
}

export interface PortDisplayData {
  port: {
    _id: string;
    id: string;
    name: string;
    type: string;
    country: string;
    countryCode: string;
    code: string;
    isCustom: boolean;
    verified: boolean;
    matchScore: number;
    latLon: LatLon;
    display_name?: string;
    other_names: string[];
    city?: string;
    state_name?: string;
    region?: string;
    port_type: string;
    lat_lon: LatLon;
    nearby_ports?: JSON;
    other_details?: JSON;
  };
  carrierType: string;
  createdAt: Date;
}
