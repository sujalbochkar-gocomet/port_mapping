import React, { useState } from "react";
import axios from "axios";
const SearchInput = () => {
  const [searchInput, setSearchInput] = useState("");
  const [results, setResults] = useState<Port[]>([]);

  const searchPorts = async (term: string) => {
    try {
      const response = await axios.get(
        `http://localhost:3000/search-ports?q=${encodeURIComponent(term)}`
      );
      setResults(response.data);
    } catch (error) {
      console.error("Error fetching ports:", error);
      setResults([]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value);
    searchPorts(value);
  };

  const handlePortSelect = (port: Port) => {
    setSearchInput(port.name || "");
    setResults([]);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-4">Search Port</h1>
      <div className="relative">
        <input
          type="text"
          placeholder="Search ports..."
          value={searchInput}
          onChange={handleInputChange}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />

        {/* Dropdown for search results */}
        {searchInput && results.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg max-h-96 overflow-y-auto border border-gray-200">
            {results.map((port, index) => (
              <div
                key={index}
                className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0"
                onClick={() => handlePortSelect(port)}
              >
                <div className="flex justify-between">
                  <div className="flex items-center gap-3">
                    {port.country_code && (
                      <img
                        src={`https://flagsapi.com/${port.country_code.toUpperCase()}/flat/64.png`}
                        alt={`${port.country} flag`}
                        className="w-6 h-4 object-cover rounded-sm shadow-sm mr-3"
                      />
                    )}
                    <p className="text-sm text-gray-800 font-medium">
                      {port.name ? port.name : ""}
                      {port.city ? `, ${port.city}` : ""}
                      {port.country ? `, ${port.country}` : ""}
                      {port.code ? `, ${port.code}` : ""}
                    </p>
                  </div>
                  <div className="text-xs text-gray-500">
                    Port type: {checkPortType(port.port_type)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

interface Port {
  id: string;
  name: string;
  display_name: string;
  city: string;
  country: string;
  country_code: string;
  code: string;
  port_type: string;
  deleted: boolean;
  client_group_id: null;
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

const checkPortType = (portType: string) => {
  if (portType === "sea_port") return "Sea Port";
  if (portType === "air_port") return "Air Port";
  if (portType === "address") return "Address";
  return portType;
};

export default SearchInput;
