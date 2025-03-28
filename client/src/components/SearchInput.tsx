import React from "react";
import { useEffect, useState } from "react";

const SearchInput = () => {
  const [searchInput, setSearchInput] = useState("");
  const [results, setResults] = useState<Port[]>([]);

  useEffect(() => {
    const fetchPorts = async () => {
      try {
        const response = await fetch("http://localhost:3000/search-ports");
        const data = await response.json();
        setResults(data);
      } catch (error) {
        console.error("Error fetching ports:", error);
      }
    };

    fetchPorts();
  }, [searchInput]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="relative">
        <input
          type="text"
          placeholder="Search ports..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        {/* dropdown which displays below the search input for all ports */}
        {results.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg max-h-96 overflow-y-auto">
            {results.map((port, index) => (
              <PortDisplay key={index} port={port} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchInput;

interface Port {
  name?: string;
  country?: string;
  code?: string;
  countryCode?: string;
}

interface PortDisplayProps {
  port: Port;
}

const PortDisplay = ({ port }: PortDisplayProps) => {
  return (
    <div className="px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100 last:border-0">
      <div className="flex items-center">
        {/* Country flag */}
        <div className="w-6 h-4 flex-shrink-0 mr-3">
          {port.countryCode && (
            <img
              src={`https://flagcdn.com/w20/${port.countryCode.toLowerCase()}.png`}
              alt={`${port.country} flag`}
              className="w-full h-full object-cover rounded-sm shadow-sm"
            />
          )}
        </div>

        {/* Port information */}
        <div className="flex-1">
          <p className="text-sm text-gray-800 font-medium">
            {port.name && port.country
              ? `${port.name}, ${port.country}`
              : port.name || "Unknown Port"}
            {port.code && (
              <span className="ml-1 text-gray-500">{port.code}</span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};
