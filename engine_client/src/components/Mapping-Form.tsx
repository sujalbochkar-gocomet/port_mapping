import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { statusPort } from "../types/types";
import flagIcon from "../assets/flag.svg";
import { toast } from "react-toastify";
import ModeSelector from "./ModeSelector";

const MappingForm = () => {
  const [carrierType, setCarrierType] = useState<string>("sea_port");
  const [searchInput, setSearchInput] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<statusPort[]>([]);
  const resultsRef = useRef<HTMLDivElement>(null);

  const handleSearch = async () => {
    if (!searchInput.trim()) {
      toast.error("Please enter a search term");
      return;
    }

    try {
      setIsSearching(true);
      const response = await axios.get(
        `http://localhost:3000/search-ports?q=${encodeURIComponent(searchInput)}&type=${carrierType}`
      );
      setSearchResults(response.data);
    } catch (error) {
      console.error("Error searching ports:", error);
      toast.error("Failed to search ports");
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (resultsRef.current && !resultsRef.current.contains(event.target as Node)) {
        setSearchResults([]);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div>
      {/* Mode Selector Block */}
      <div className="mb-6">
        <label className="block text-lg font-bold text-gray-600 mb-2">
          Port Type <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center gap-4">
          <ModeSelector
            selectedMode={carrierType || "all"}
            onModeSelect={setCarrierType}
          />
        </div>
      </div>

      {/* Search Block */}
      <div className="flex items-center gap-4">
        <div className="w-full relative">
          <label className="block text-lg font-bold text-gray-600 mb-1">
            Search Port <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch();
                  }
                }}
                placeholder="Enter port name, city, or code..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={isSearching}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSearching ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Searching...
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  Search
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div
          ref={resultsRef}
          className="mt-4"
        >
          <div className="space-y-4">
            {searchResults.map((port) => (
              <div
                key={port.port._id}
                className="w-full bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-all duration-200 group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 bg-gray-50 px-2 py-1 rounded-lg text-sm">
                          <span className="text-gray-500">Country Code:</span>
                          <span className="font-medium text-gray-900">{port.port.country_code}</span>
                        </div>
                        <div className="text-gray-500 text-sm">|</div>
                        <div className="flex items-center gap-2 bg-gray-50 px-2 py-1 rounded-lg text-sm">
                          <span className="text-gray-500">Code:</span>
                          <span className="font-medium text-gray-900">{port.port.id}</span>
                        </div>
                        <div className="text-gray-500 text-sm">|</div>
                        <div className="flex items-center gap-2 bg-gray-50 px-2 py-1 rounded-lg text-sm">
                          <span className="text-gray-500">Lat & Lon:</span>
                          <span className="font-medium text-gray-900">
                            {port.port.lat_lon.lat.toFixed(4)}, {port.port.lat_lon.lon.toFixed(4)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-sm text-gray-500 flex items-center gap-2">
                          <div className="text-sm text-gray-500 flex items-center gap-2 mr-4">
                            <span
                              className={`px-2 py-0.5 text-xs font-medium rounded-full border flex items-center gap-1 ${
                                port.verified
                                  ? "text-green-700 bg-green-50 border-green-100"
                                  : "text-red-700 bg-red-50 border-red-100"
                              }`}
                            >
                              {port.verified ? (
                                <>
                                  <svg
                                    className="w-3.5 h-3.5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M5 13l4 4L19 7"
                                    />
                                  </svg>
                                  <span>Verified</span>
                                </>
                              ) : (
                                <>
                                  <svg
                                    className="w-3.5 h-3.5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                    />
                                  </svg>
                                  <span>Alert Unverified Port</span>
                                </>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Port Details Section */}
                    <div className="mt-4">
                      <div className="flex items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium text-gray-600">
                              Port
                            </span>
                            <div className="relative">
                              <svg
                                className="w-4 h-4 text-gray-400 cursor-help"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                            </div>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                {port.port.country_code ? (
                                  <img
                                    src={`https://flagsapi.com/${port.port.country_code.toUpperCase()}/flat/64.png`}
                                    alt={`${port.port.country} flag`}
                                    className="w-6 h-4 object-cover rounded-sm shadow-sm"
                                  />
                                ) : (
                                  <img
                                    src={flagIcon}
                                    alt="Default flag"
                                    className="w-6 h-6 object-cover rounded-sm shadow-sm mr-3"
                                  />
                                )}
                                <div>
                                  <p className="font-medium text-gray-900">
                                    {port.port.display_name || port.port.name}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    {port.port.city}, {port.port.country}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-gray-500">Confidence Score:</span>
                                <span className="text-sm text-gray-500">{port.match_score}%</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MappingForm;