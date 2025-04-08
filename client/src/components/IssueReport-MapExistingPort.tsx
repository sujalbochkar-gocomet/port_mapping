import { useState, useEffect } from "react";
import { FiSearch, FiMapPin } from "react-icons/fi";
import { Port } from "../types/types";
import flagIcon from "../assets/flag.svg";

interface MapExistingPortProps {
  keyword: string;
  onPortSelected: (portId: string) => void;
}

const MapExistingPort = ({ keyword, onPortSelected }: MapExistingPortProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Port[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    const searchPorts = async () => {
      if (!searchTerm.trim()) {
        setSearchResults([]);
        setIsDropdownOpen(false);
        return;
      }

      setIsSearching(true);
      try {
        const response = await fetch(
          `http://localhost:3000/issue-search?q=${searchTerm}`
        );
        const data = await response.json();
        setSearchResults(data);
        setIsDropdownOpen(true);
        setIsSearching(false);
      } catch (error) {
        console.error("Error searching ports:", error);
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(searchPorts, 1000);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-6">
          <FiMapPin className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-medium text-gray-800">
            Map "{keyword}" to Existing Port
          </h2>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiSearch className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search by port name, code, or location..."
                  className="block w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {isDropdownOpen && searchResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg max-h-96 overflow-y-auto border border-gray-200">
                {searchResults.map((port) => (
                  <div
                    key={port.id}
                    className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0"
                    onClick={() => {
                      onPortSelected(port.id);
                      setIsDropdownOpen(false);
                    }}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        {port.country_code ? (
                          <img
                            src={`https://flagsapi.com/${port.country_code.toUpperCase()}/flat/64.png`}
                            alt={`${port.country} flag`}
                            className="w-6 h-4 object-cover rounded-sm shadow-sm"
                          />
                        ) : (
                          <FlagIcon />
                        )}
                        <div>
                          <div className="font-medium text-gray-900">
                            {(() => {
                              const displaynamearr = port.display_name
                                .split(",")
                                .filter(Boolean);
                              const displayText = [
                                displaynamearr.join(", "),
                                port.code || "",
                              ]
                                .filter(Boolean)
                                .join(", ");
                              return displayText;
                            })()}
                          </div>
                          <div className="text-sm text-gray-500">
                            {[
                              port.city || "",
                              port.state_name || "",
                              port.country || "",
                            ]
                              .filter(Boolean)
                              .join(", ")}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-sm text-gray-500">
                          Port Type: {port.port_type}
                        </div>
                        <div>
                          <button className="bg-blue-500 text-white px-4 py-1 rounded-md">
                            Map
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {isSearching && (
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const FlagIcon = () => {
  return (
    <img
      src={flagIcon}
      alt="Default flag"
      className="w-6 h-6 object-cover rounded-sm shadow-sm"
    />
  );
};

export default MapExistingPort;
