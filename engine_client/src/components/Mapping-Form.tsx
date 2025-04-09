import { useState, useRef, useEffect, useCallback } from "react";
import axios from "axios";
import { statusPort } from "../types/types";
import ModeSelector from "./ModeSelector";

const MappingForm = () => {
  const [carrierType, setCarrierType] = useState<string>("sea_port");
  const [searchInput, setSearchInput] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<statusPort[]>([]);
  const [showOtherNames, setShowOtherNames] = useState<{
    [key: string]: boolean;
  }>({});
  const resultsRef = useRef<HTMLDivElement>(null);

  // Add debounce timer and abort controller refs
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortController = useRef<AbortController | null>(null);

  // Debounced search function
  const debouncedSearch = useCallback(
    (term: string) => {
      // Clear existing timer
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      // Abort previous request if it exists
      if (abortController.current) {
        abortController.current.abort();
      }

      if (!term.trim()) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      // Set loading state
      setIsSearching(true);

      // Create new abort controller
      abortController.current = new AbortController();

      // Set new timer
      debounceTimer.current = setTimeout(async () => {
        try {
          const response = await axios.get(
            `http://localhost:3000/search-ports?q=${encodeURIComponent(
              term
            )}&type=${carrierType}`,
            {
              signal: abortController.current?.signal,
            }
          );
          const results = response.data;
          setSearchResults(results);
        } catch (error) {
          // Ignore errors from aborted requests
          if (axios.isCancel(error)) {
            return;
          }
          console.error("Error searching:", error);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      }, 300); // 300ms delay
    },
    [carrierType]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, []);

  const handleSearch = async () => {
    if (!searchInput.trim()) {
      return;
    }
    debouncedSearch(searchInput);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value);
    debouncedSearch(value);
  };

  // Clear search results when changing carrier type
  useEffect(() => {
    setSearchResults([]);
    setSearchInput("");
  }, [carrierType]);

  const toggleOtherNames = (portId: string) => {
    setShowOtherNames((prev) => ({
      ...prev,
      [portId]: !prev[portId],
    }));
  };

  return (
    <div>
      {/* Mode Selector Block */}
      <div className="mb-6">
        <label className="block text-lg font-bold text-gray-600 mb-2">
          Port Type <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center gap-4">
          <ModeSelector
            selectedMode={carrierType}
            onModeSelect={setCarrierType}
          />
        </div>
      </div>

      {/* Search Block */}
      <div className="flex items-center gap-4">
        <div className="w-full relative">
          <label className="block text-lg font-bold text-gray-600 mb-1">
            Enter Keyword Here <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={searchInput}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSearch();
                  }
                }}
                placeholder={
                  carrierType === "address"
                    ? "Enter address..."
                    : "Enter port name, city, or code..."
                }
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

      {/* Results Section */}
      <div ref={resultsRef} className="mt-4">
        {isSearching ? (
          <div className="flex flex-col items-center justify-center p-10 bg-gray-50 rounded-lg border border-gray-200">
            <svg
              className="animate-spin w-16 h-16 text-blue-500 mb-2"
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
            <p className="text-lg font-medium text-gray-600">Searching...</p>
          </div>
        ) : searchInput.trim() === "" ? (
          <div className="flex flex-col items-center justify-center p-10 bg-gray-50 rounded-lg border border-gray-200">
            <svg
              className="w-16 h-16 text-gray-400 mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-lg font-medium text-gray-600">
              Enter a search term to find ports
            </p>
          </div>
        ) : searchResults.length > 0 ? (
          <div className="space-y-4">
            {searchResults.map((port) => (
              <div
                key={port.port._id}
                className="w-full bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200"
              >
                {/* Header Section */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {port.port.country_code && (
                        <img
                          src={`https://flagsapi.com/${port.port.country_code.toUpperCase()}/flat/64.png`}
                          alt={`${port.port.country} flag`}
                          className="w-8 h-6 object-cover rounded-sm shadow-sm"
                        />
                      )}
                      <h3 className="text-xl font-semibold text-gray-800">
                        {port.port.name}
                      </h3>
                      <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-medium border border-gray-200">
                        {port.port.code}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        port.verified
                          ? "bg-green-100 text-green-800 border border-green-200"
                          : "bg-yellow-100 text-yellow-800 border border-yellow-200"
                      }`}
                    >
                      {port.verified ? "Verified" : "Unverified"}
                    </span>
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium border border-blue-200">
                      Match: {port.match_score.toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <span className="text-gray-500 min-w-24">Location:</span>
                      <span className="text-gray-800">
                        {port.port.city}, {port.port.country}
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-gray-500 min-w-24">Region:</span>
                      <span className="text-gray-800">{port.port.region}</span>
                    </div>
                    {port.port.other_names.length > 0 && (
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                        <button
                          onClick={() => toggleOtherNames(port.port._id)}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-colors"
                        >
                          <span className="font-medium">
                            {showOtherNames[port.port._id]
                              ? "Hide Other Names"
                              : "Show Other Names"}
                          </span>
                          <svg
                            className={`w-4 h-4 transition-transform duration-200 ${
                              showOtherNames[port.port._id] ? "rotate-180" : ""
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <span className="text-gray-500 min-w-24">Address:</span>
                      <span className="text-gray-800 flex-1">
                        {port.port.address || "N/A"}
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-gray-500 min-w-24">
                        Coordinates:
                      </span>
                      <span className="text-gray-800">
                        {port.port.lat_lon?.lat && port.port.lat_lon?.lon
                          ? `${port.port.lat_lon.lat.toFixed(
                              4
                            )}, ${port.port.lat_lon.lon.toFixed(4)}`
                          : "Not available"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Other Names Section */}
                {showOtherNames[port.port._id] &&
                  port.port.other_names.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex flex-wrap gap-2">
                          {port.port.other_names.map((name, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                            >
                              {name}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-10 bg-gray-50 rounded-lg border border-gray-200">
            <svg
              className="w-16 h-16 text-gray-400 mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-lg font-medium text-gray-600">No ports found</p>
            <p className="text-sm text-gray-500 mt-1">
              Try searching with different keywords
        </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MappingForm;
