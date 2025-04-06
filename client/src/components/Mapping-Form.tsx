import { useState, useRef, useEffect, useCallback } from "react";
import axios from "axios";
import { Shipment, statusPort } from "../types/types";
import flagIcon from "../assets/flag.svg";
import landIcon from "../assets/land.svg";
import airIcon from "../assets/air.svg";
import seaIcon from "../assets/sea.svg";
import { toast } from "react-toastify";

const MappingForm = () => {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [carrierType, setCarrierType] = useState<string>("sea_port");
  const [loading, setLoading] = useState(false);
  const [isPolSearching, setIsPolSearching] = useState(false);
  const [isPodSearching, setIsPodSearching] = useState(false);

  // Reset states when carrier type changes
  useEffect(() => {
    // Reset POL states
    setPolSearchInput("");
    setPolResults([]);
    setLastPolResults([]);
    setSelectedPol(null);
    setIsPolDropdownOpen(false);

    // Reset POD states
    setPodSearchInput("");
    setPodResults([]);
    setLastPodResults([]);
    setSelectedPod(null);
    setIsPodDropdownOpen(false);
  }, [carrierType]);

  // Search states for POL
  const [polSearchInput, setPolSearchInput] = useState("");
  const [polResults, setPolResults] = useState<statusPort[]>([]);
  const [lastPolResults, setLastPolResults] = useState<statusPort[]>([]);
  const [selectedPol, setSelectedPol] = useState<statusPort | null>(null);
  const [isPolDropdownOpen, setIsPolDropdownOpen] = useState(false);
  const polDropdownRef = useRef<HTMLDivElement>(null);

  // Search states for POD
  const [podSearchInput, setPodSearchInput] = useState("");
  const [podResults, setPodResults] = useState<statusPort[]>([]);
  const [lastPodResults, setLastPodResults] = useState<statusPort[]>([]);
  const [selectedPod, setSelectedPod] = useState<statusPort | null>(null);
  const [isPodDropdownOpen, setIsPodDropdownOpen] = useState(false);
  const podDropdownRef = useRef<HTMLDivElement>(null);

  // Add debounce timer refs
  const polDebounceTimer = useRef<NodeJS.Timeout | null>(null);
  const podDebounceTimer = useRef<NodeJS.Timeout | null>(null);

  const polAbortController = useRef<AbortController | null>(null);
  const podAbortController = useRef<AbortController | null>(null);

  const handlePolSelect = (port: statusPort) => {
    setPolSearchInput("");
    setSelectedPol(port);
    setPolResults([]);
    setIsPolDropdownOpen(false);
  };

  const handlePodSelect = (port: statusPort) => {
    setPodSearchInput("");
    setSelectedPod(port);
    setPodResults([]);
    setIsPodDropdownOpen(false);
  };

  // Auto-select first result function
  const autoSelectFirstResult = useCallback((isPol: boolean) => {
    const results = isPol ? lastPolResults : lastPodResults;
    const isSearching = isPol ? isPolSearching : isPodSearching;
    const isDropdownOpen = isPol ? isPolDropdownOpen : isPodDropdownOpen;
    const selected = isPol ? selectedPol : selectedPod;
    const handleSelect = isPol ? handlePolSelect : handlePodSelect;

    if (!isSearching && results.length > 0 && !selected && !isDropdownOpen) {
      handleSelect(results[0]);
    }
  }, [lastPolResults, lastPodResults, isPolSearching, isPodSearching, isPolDropdownOpen, isPodDropdownOpen, selectedPol, selectedPod, handlePolSelect, handlePodSelect]);

  // Debounced search function
  const debouncedSearch = useCallback((term: string, isPol: boolean) => {
    // Clear existing timer
    const timerRef = isPol ? polDebounceTimer : podDebounceTimer;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // Abort previous request if it exists
    const abortControllerRef = isPol ? polAbortController : podAbortController;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if(!term.trim()){
      if(isPol){
        setPolResults([]);
        setLastPolResults([]);
        setIsPolSearching(false);
      }else{
        setPodResults([]);
        setLastPodResults([]);
        setIsPodSearching(false);
      }
      return;
    }

    // Set loading state
    if (isPol) {
      setIsPolSearching(true);
    } else {
      setIsPodSearching(true);
    }

    abortControllerRef.current = new AbortController();

    // Set new timer
    timerRef.current = setTimeout(async () => {
      try {
        const portType = getPortTypeFromCarrier(carrierType);
        const response = await axios.get(
          `http://localhost:3000/search-ports?q=${encodeURIComponent(
            term
          )}&type=${portType}`,
          {
            signal: abortControllerRef.current?.signal
          }
        );
        const results = response.data;

        if (isPol) {
          setPolResults(results);
          setLastPolResults(results);
          setIsPolSearching(false);
          autoSelectFirstResult(true);
        } else {
          setPodResults(results);
          setLastPodResults(results);
          setIsPodSearching(false);
          autoSelectFirstResult(false);
        }
      } catch (error) {
        // Ignore errors from aborted requests
        if (axios.isCancel(error)) {
          return;
        }
        console.error("Error fetching ports:", error);
        if (isPol) {
          setPolResults([]);
          setLastPolResults([]);
          setIsPolSearching(false);
        } else {
          setPodResults([]);
          setLastPodResults([]);
          setIsPodSearching(false);
        }
      }
    }, 300); // 300ms delay
  }, [carrierType, isPolDropdownOpen, isPodDropdownOpen, selectedPol, selectedPod]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (polAbortController.current) {
        polAbortController.current.abort();
      }
      if (podAbortController.current) {
        podAbortController.current.abort();
      }
      if (polDebounceTimer.current) {
        clearTimeout(polDebounceTimer.current);
      }
      if (podDebounceTimer.current) {
        clearTimeout(podDebounceTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        polDropdownRef.current &&
        !polDropdownRef.current.contains(event.target as Node)
      ) {
        setIsPolDropdownOpen(false);
        // Auto-select first result when clicking outside
        autoSelectFirstResult(true);
      }
      if (
        podDropdownRef.current &&
        !podDropdownRef.current.contains(event.target as Node)
      ) {
        setIsPodDropdownOpen(false);
        // Auto-select first result when clicking outside
        autoSelectFirstResult(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [autoSelectFirstResult]);

  const addShipment = async () => {
    if (loading) return;
    
    // Auto-select first result when adding shipment
    autoSelectFirstResult(true);
    autoSelectFirstResult(false);

    if (!selectedPol || !selectedPod) {
      toast.error("Please fill in all fields and select valid ports");
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post("http://localhost:3000/add-shipment", {
        pol: selectedPol,
        pod: selectedPod,
        carrierType,
      });

      // Add success toast
      toast.success("Shipment added successfully!");
      window.location.reload();
      // Update shipments array with the new shipment
      setShipments([...shipments, response.data]);

      // Reset form
      setCarrierType("");
      setSelectedPol(null);
      setSelectedPod(null);
      setPolSearchInput("");
      setPodSearchInput("");
    } catch (err) {
      toast.error("Failed to add shipment. Please try again.");
      console.error("Error adding shipment:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePolInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPolSearchInput(value);
    setIsPolDropdownOpen(true);
    
    // Clear any pending debounce timer
    if (polDebounceTimer.current) {
      clearTimeout(polDebounceTimer.current);
    }
    
    debouncedSearch(value, true);
  };

  const handlePodInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPodSearchInput(value);
    setIsPodDropdownOpen(true);
    
    // Clear any pending debounce timer
    if (podDebounceTimer.current) {
      clearTimeout(podDebounceTimer.current);
    }
    
    debouncedSearch(value, false);
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
            selectedMode={carrierType || "all"}
            onModeSelect={setCarrierType}
          />
        </div>
      </div>

      {/* POL and POD Block */}
      <div className="flex items-center gap-4">
        <div className="w-full relative">
          <label className="block text-lg font-bold text-gray-600 mb-1">
            Port of Loading (POL) <span className="text-red-500">*</span>
          </label>

          {selectedPol ? (
            <div className="w-full px-3 py-3 bg-white border border-gray-300 rounded-lg shadow-sm flex justify-between items-center">
              {/* First div: logo and port name */}
              <div className="flex items-center gap-2 max-w-[80%] min-w-[80%]">
                {selectedPol !== null && selectedPol.port?.country_code ? (
                  <img
                    src={`https://flagsapi.com/${selectedPol.port.country_code.toUpperCase()}/flat/64.png`}
                    alt={`${selectedPol.port.country} flag`}
                    className="w-6 h-4 mr-2 object-cover rounded-sm shadow-sm"
                  />
                ) : (
                  <FlagIcon />
                )}
                <p className="text-sm text-gray-800 font-medium">
                  {(() => {
                    const displayName =
                      selectedPol.port.display_name || selectedPol.port.name;
                    

                    return displayName.length > 50
                      ? displayName.substring(0, 50) + "..."
                      : displayName;
                  })()}
                </p>
              </div>

              {/* Second div: type and match score */}
              <div className="text-xs text-gray-500">
                Type: {checkPortType(selectedPol.port.port_type)}
              </div>

              {/* Third div: close button */}
              <div>
                <button
                  onClick={() => {
                    setPolResults([]);
                    setLastPolResults([]);
                    setSelectedPol(null);
                  }}
                  className="text-gray-500 hover:text-gray-700 ml-2 hover:cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>
          ) : (
            <div ref={polDropdownRef} className="relative w-full">
              <div className="relative">
                <input
                  type="text"
                  value={polSearchInput}
                  placeholder="Enter POL..."
                  className="w-full px-3 py-3 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
                  onChange={handlePolInputChange}
                  onClick={() => setIsPolDropdownOpen(true)}
                />
                {isPolSearching && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                  </div>
                )}
              </div>

              {/* POL Search Results */}
              {isPolDropdownOpen &&
                polSearchInput &&
                polResults.length > 0 &&
                !selectedPol && (
                  <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg max-h-96 overflow-y-auto border border-gray-200">
                    {polResults.map((port, index) => (
                      <div
                        key={index}
                        className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0"
                        onClick={() => handlePolSelect(port)}
                      >
                        {port.port?.id?.startsWith("temp-") ? (
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 flex items-center justify-center bg-gray-200 rounded-full">
                                <span className="text-xs">+</span>
                              </span>
                              <span className="text-sm font-medium">
                                Create: "{port.port.name}"
                              </span>
                            </div>
                            <div className="text-xs text-gray-500">
                              Custom Port
                            </div>
                          </div>
                        ) : (
                          <PortDropdownItem port={port} />
                        )}
                      </div>
                    ))}
                  </div>
                )}
            </div>
          )}
        </div>

        <div className="w-full relative">
          <label className="block text-lg font-bold text-gray-600 mb-1">
            Port of Discharge (POD) <span className="text-red-500">*</span>
          </label>

          {selectedPod ? (
            <div className="w-full px-3 py-3 bg-white border border-gray-300 rounded-lg shadow-sm flex justify-between items-center">
              {/* First div: logo and port name */}
              <div className="flex items-center gap-2 max-w-[80%] min-w-[80%]">
                {selectedPod !== null && selectedPod.port?.country_code ? (
                  <img
                    src={`https://flagsapi.com/${selectedPod.port.country_code.toUpperCase()}/flat/64.png`}
                    alt={`${selectedPod.port.country} flag`}
                    className="w-6 h-4 object-cover rounded-sm shadow-sm"
                  />
                ) : (
                  <FlagIcon />
                )}
                <p className="text-sm text-gray-800 font-medium">
                  {(() => {
                    const displayName =
                      selectedPod.port.display_name || selectedPod.port.name;
              
                    return displayName.length > 45
                      ? displayName.substring(0, 45) + "..."
                      : displayName;
                  })()}
                </p>
              </div>

              {/* Second div: type and match score */}
              <div className="text-xs text-gray-500">
                Type: {checkPortType(selectedPod.port.port_type)}
              </div>

              {/* Third div: close button */}
              <div>
                <button
                  onClick={() => {
                    setPodResults([]);
                    setLastPodResults([]);
                    setSelectedPod(null);
                  }}
                  className="text-gray-500 hover:text-gray-700 ml-2 hover:cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>
          ) : (
            <div ref={podDropdownRef} className="relative w-full">
              <div className="relative">
                <input
                  type="text"
                  value={podSearchInput}
                  placeholder="Enter POD..."
                  className="w-full px-3 py-3 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
                  onChange={handlePodInputChange}
                  onClick={() => setIsPodDropdownOpen(true)}
                />
                {isPodSearching && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                  </div>
                )}
              </div>

              {/* POD Search Results */}
              {isPodDropdownOpen &&
                podSearchInput &&
                podResults.length > 0 &&
                !selectedPod && (
                  <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg max-h-96 overflow-y-auto border border-gray-200">
                    {podResults.map((port, index) => (
                      <div
                        key={index}
                        className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0"
                        onClick={() => handlePodSelect(port)}
                      >
                        {port.port?.id?.startsWith("temp-") ? (
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 flex items-center justify-center bg-gray-200 rounded-full">
                                <span className="text-xs">+</span>
                              </span>
                              <span className="text-sm font-medium">
                                Create: "{port.port.display_name}"
                              </span>
                            </div>
                            <div className="text-xs text-gray-500">
                              Custom Port
                            </div>
                          </div>
                        ) : (
                          <PortDropdownItem port={port} />
                        )}
                      </div>
                    ))}
                  </div>
                )}
            </div>
          )}
        </div>

        <div className="text-nowrap self-end">
          <button
            onClick={addShipment}
            disabled={loading}
            className={`px-5 py-3  font-bold rounded-md transition-colors flex items-center gap-2
                ${
                  loading
                    ? "bg-blue-300 cursor-not-allowed"
                    : "bg-blue-700 hover:bg-blue-600 text-white"
                }`}
          >
            {loading ? (
              <>
                <span className="animate-spin">⌛</span>
                Adding...
              </>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 font-bold"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M8.5 2a1 1 0 0 0-1 1v5h-5a1 1 0 0 0 0 2h5v5a1 1 0 0 0 2 0v-5h5a1 1 0 0 0 0-2h-5V3a1 1 0 0 0-1-1z" />
                </svg>
                Add Shipment
              </>
            )}
          </button>
        </div>
      </div>

      {/* Add Shipment Button */}
    </div>
  );
};
const PortDropdownItem = ({ port }: { port: statusPort }) => {
  return (
    <div className="flex relative justify-between items-center w-full">
      <div className="flex items-center gap-3 max-w-[75%]">
        {port.port?.country_code && port.port?.country_code !== "" ? (
          <img
            src={`https://flagsapi.com/${port.port.country_code.toUpperCase()}/flat/64.png`}
            alt={`${port.port.country} flag`}
            className="w-6 h-4 object-cover rounded-sm shadow-sm mr-3"
          />
        ) : (
          <FlagIcon />
        )}
        <p className="text-sm text-gray-800 font-medium">
          {port.port.display_name ? port.port.display_name : port.port.name}
          {/* {port.port.city ? `, ${port.port.city}` : ""}
          {port.port.country ? `, ${port.port.country}` : ""}
          {port.port.code ? `, ${port.port.code}` : ""} */}
        </p>
      </div>
      <div>
        <div className="text-xs text-gray-500">
          Type: {checkPortType(port.port.port_type)}
        </div>
      </div>
    </div>
  );
};

export default MappingForm;

const ModeSelector = ({
  selectedMode,
  onModeSelect,
}: {
  selectedMode: string;
  onModeSelect: (mode: string) => void;
}) => {
  const modes = [
    { id: "sea_port", icon: seaIcon, label: "SEA" },
    { id: "air_port", icon: airIcon, label: "AIR" },
    { id: "inland_port", icon: landIcon, label: "LAND" },
    { id: "address", icon: flagIcon, label: "ADDRESS" },
  ];

  return (
    <div className="flex gap-2 w-full bg-gray-50 p-2 rounded-lg">
      {modes.map((mode) => (
        <button
          key={mode.id}
          onClick={() => onModeSelect(mode.id)}
          className={`flex-1 flex flex-col items-center justify-center p-4 rounded-lg transition-all duration-200 ${
            selectedMode === mode.id
              ? "bg-blue-100 border-2 border-blue-500 shadow-md"
              : "bg-white border-2 border-transparent hover:bg-gray-50"
          }`}
        >
          <img
            src={mode.icon}
            alt={mode.label}
            className={`w-8 h-8 mb-2 ${
              selectedMode === mode.id
                ? "[filter:invert(48%)_sepia(79%)_saturate(2476%)_hue-rotate(200deg)_brightness(118%)_contrast(119%)]"
                : "brightness-0 opacity-50"
            }`}
          />
          <span
            className={`text-sm font-semibold ${
              selectedMode === mode.id ? "text-blue-500" : "text-gray-600"
            }`}
          >
            {mode.label}
          </span>
        </button>
      ))}
    </div>
  );
};

const getPortTypeFromCarrier = (carrierType: string): string => {
  switch (carrierType) {
    case "sea_port":
      return "sea_port";
    case "air_port":
      return "air_port";
    case "inland_port":
      return "inland_port";
    case "address":
      return "address";
    default:
      return "sea_port"; // Default to sea_port instead of all
  }
};
export const FlagIcon = () => {
  return (
    <img
      src={flagIcon}
      alt="Default flag"
      className="w-6 h-6 object-cover rounded-sm shadow-sm mr-3"
    />
  );
};
const checkPortType = (portType: string) => {
  if (portType === "sea_port") return "Sea Port";
  if (portType === "air_port") return "Air Port";
  if (portType === "inland_port") return "Inland Port";
  return portType;
};
