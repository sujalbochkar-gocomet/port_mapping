import { useState, useEffect, useRef } from "react";
import { FiSearch, FiMapPin, FiChevronDown } from "react-icons/fi";
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
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const [isAlternativeNamesOpen, setIsAlternativeNamesOpen] = useState(false);
  const [selectedPort, setSelectedPort] = useState<Port | null>(null);
  const [searchType, setSearchType] = useState("sea");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        event.target !== inputRef.current
      ) {
        setIsSearchDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const searchPorts = async () => {
      if (!searchTerm.trim()) {
        setSearchResults([]);
        setIsSearchDropdownOpen(false);
        return;
      }

      setIsSearching(true);

      let searchTypeParam = searchType;
      if (searchType === "sea") searchTypeParam = "sea_port";
      else if (searchType === "air") searchTypeParam = "air_port";
      else if (searchType === "land") searchTypeParam = "inland_port";
      else if (searchType === "address") searchTypeParam = "address";

      try {
        const response = await fetch(
          `http://localhost:3000/issue-search?q=${searchTerm}&type=${searchTypeParam}`
        );
        const data = await response.json();
        setSearchResults(data);
        setIsSearchDropdownOpen(true);
      } catch (error) {
        console.error("Error searching ports:", error);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(searchPorts, 1000);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm, searchType]);

  const handlePortSelect = (port: Port) => {
    setSelectedPort(port);
    onPortSelected(port.id);
    setIsSearchDropdownOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-6">
          <FiMapPin className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-medium text-gray-800">
            Map "{keyword}" to Existing Port
          </h2>
          <div className="flex gap-2 ml-auto">
            {["sea", "air", "land", "address"].map((type) => (
              <button
                key={type}
                className={`px-3 py-1 rounded-md text-sm font-medium border transition-colors ${
                  searchType === type
                    ? "bg-blue-100 text-blue-800 border-blue-200"
                    : "bg-white text-gray-600 border-gray-300 hover:bg-gray-100"
                }`}
                onClick={() => setSearchType(type)}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="relative" ref={dropdownRef}>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiSearch className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search by port name, code, or location..."
                  className="block w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => setIsSearchDropdownOpen(true)}
                />
              </div>
            </div>

            {isSearchDropdownOpen && searchResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg max-h-96 overflow-y-auto border border-gray-200">
                {searchResults.map((port) => (
                  <div
                    key={port.id}
                    className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0"
                    onClick={() => handlePortSelect(port)}
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
                            {[port.city, port.state_name, port.country]
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
                          <button className="bg-blue-500 text-white cursor-pointer px-4 py-1 rounded-md">
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

          {selectedPort && (
            <div className="mt-6 p-6 border border-gray-200 rounded-lg bg-white">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  {selectedPort.country_code ? (
                    <img
                      src={`https://flagsapi.com/${selectedPort.country_code.toUpperCase()}/flat/64.png`}
                      alt={`${selectedPort.country} flag`}
                      className="w-6 h-4 object-cover rounded-sm shadow-sm"
                    />
                  ) : (
                    <FlagIcon />
                  )}
                  <h3 className="text-xl font-medium text-gray-900">
                    {(() => {
                      const displaynamearr = selectedPort.display_name
                        .split(",")
                        .filter(Boolean);
                      const displayText = [
                        displaynamearr.join(", "),
                        selectedPort.code || "",
                      ];
                      return displayText.join(", ");
                    })()}
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-6 mt-4">
                  <div>
                    <div className="text-sm font-medium text-gray-500 mb-1">
                      Location:
                    </div>
                    <div className="text-gray-900">
                      {[selectedPort.city, selectedPort.country]
                        .filter(Boolean)
                        .join(", ")}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-medium text-gray-500 mb-1">
                      Address:
                    </div>
                    <div className="text-gray-900">
                      {selectedPort.address || "Not available"}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-medium text-gray-500 mb-1">
                      Region:
                    </div>
                    <div className="text-gray-900">
                      {selectedPort.region?.toUpperCase() || "Not available"}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-medium text-gray-500 mb-1">
                      Coordinates:
                    </div>
                    <div className="text-gray-900">
                      {selectedPort.lat_lon
                        ? `${selectedPort.lat_lon.lat}, ${selectedPort.lat_lon.lon}`
                        : "Not available"}
                    </div>
                  </div>
                </div>

                {selectedPort.other_names &&
                  selectedPort.other_names.length > 0 && (
                    <div className="mt-4">
                      <div
                        className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2 cursor-pointer hover:text-blue-600"
                        onClick={() =>
                          setIsAlternativeNamesOpen(!isAlternativeNamesOpen)
                        }
                      >
                        Alternative Names:
                        <FiChevronDown
                          className={`w-4 h-4 transition-transform ${
                            isAlternativeNamesOpen ? "rotate-180" : ""
                          }`}
                        />
                      </div>
                      {isAlternativeNamesOpen && (
                        <div className="flex flex-wrap gap-2">
                          {selectedPort.other_names.map((name, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                            >
                              {name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => onPortSelected(selectedPort.id)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <FiMapPin className="w-4 h-4" />
                    Map to This Port
                  </button>
                </div>
              </div>
            </div>
          )}
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
