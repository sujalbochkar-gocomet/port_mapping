import { useState, useEffect } from "react";
import axios from "axios";
import { Port, Shipment, tempShipmentData } from "../types/types";

const MappingForm = () => {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [carrierType, setCarrierType] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search states for POL
  const [polSearchInput, setPolSearchInput] = useState("");
  const [polResults, setPolResults] = useState<Port[]>([]);
  const [selectedPol, setSelectedPol] = useState<Port | null>(null);

  // Search states for POD
  const [podSearchInput, setPodSearchInput] = useState("");
  const [podResults, setPodResults] = useState<Port[]>([]);
  const [selectedPod, setSelectedPod] = useState<Port | null>(null);

  useEffect(() => {
    setShipments(tempShipmentData);
  }, []);

  const searchPorts = async (term: string, isPol: boolean) => {
    try {
      const portType = getPortTypeFromCarrier(carrierType);
      console.log(portType);

      const response = await axios.get(
        `http://localhost:3000/search-ports?q=${encodeURIComponent(
          term
        )}&type=${portType}`
      );
      if (isPol) {
        setPolResults(response.data);
      } else {
        setPodResults(response.data);
      }
    } catch (error) {
      console.error("Error fetching ports:", error);
      if (isPol) {
        setPolResults([]);
      } else {
        setPodResults([]);
      }
    }
  };

  const handlePolInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPolSearchInput(value);
    searchPorts(value, true);
  };

  const handlePodInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPodSearchInput(value);
    searchPorts(value, false);
  };

  const handlePolSelect = (port: Port) => {
    setPolSearchInput(""); // Clear the search input
    setSelectedPol(port);
    setPolResults([]);
  };

  const handlePodSelect = (port: Port) => {
    setPodSearchInput(""); // Clear the search input
    setSelectedPod(port);
    setPodResults([]);
  };

  const addShipment = async () => {
    if (!selectedPol || !selectedPod || !carrierType) {
      setError("Please fill in all fields and select valid ports");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post("http://localhost:3000/add-shipment", {
        pol: selectedPol,
        pod: selectedPod,
        carrierType,
      });
      setShipments([...shipments, response.data]);
      setCarrierType("");
      setSelectedPol(null);
      setSelectedPod(null);
      setPolSearchInput("");
      setPodSearchInput("");
    } catch (err) {
      setError("Failed to add shipment. Please try again.");
      console.error("Error adding shipment:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Carrier Type Block */}
      <div className="mb-6">
        <label className="block text-lg font-bold text-gray-600 mb-1">
          Carrier Type <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center gap-4">
          <div className="w-full">
            <select
              value={carrierType}
              className="w-full px-3 py-3 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              onChange={(e) => setCarrierType(e.target.value)}
            >
              <option value="">Select type...</option>
              <option value="all">All</option>
              <option value="sea_port">Sea</option>
              <option value="air_port">Air</option>
              <option value="address">Land</option>
            </select>
          </div>
          <div className="text-nowrap flex self-end">
            <button
              onClick={addShipment}
              disabled={loading}
              className={`px-5 py-3 font-bold rounded-md transition-colors flex items-center gap-2
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
                  Add Shipment
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 font-bold"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M8.5 2a1 1 0 0 0-1 1v5h-5a1 1 0 0 0 0 2h5v5a1 1 0 0 0 2 0v-5h5a1 1 0 0 0 0-2h-5V3a1 1 0 0 0-1-1z" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* POL and POD Block */}
      <div className="flex items-center justify-center gap-4">
        <div className="w-full relative">
          <label className="block text-lg font-bold text-gray-600 mb-1">
            Port of Loading (POL) <span className="text-red-500">*</span>
          </label>

          {selectedPol ? (
            <div className="w-full px-3 py-3 bg-white border border-gray-300 rounded-lg shadow-sm flex justify-between items-center">
              <div className="flex items-center gap-3 w-full">
                {selectedPol.country_code && (
                  <img
                    src={`https://flagsapi.com/${selectedPol.country_code.toUpperCase()}/flat/64.png`}
                    alt={`${selectedPol.country} flag`}
                    className="w-6 h-4 object-cover rounded-sm shadow-sm mr-3"
                  />
                )}
                <p className="text-sm text-gray-800 font-medium">
                  {selectedPol.name}
                  {selectedPol.city ? `, ${selectedPol.city}` : ""}
                  {selectedPol.country ? `, ${selectedPol.country}` : ""}
                  {selectedPol.code ? `, ${selectedPol.code}` : ""}
                </p>
                <div className="ml-auto text-xs text-gray-500">
                  Port type: {checkPortType(selectedPol.port_type)}
                </div>
              </div>
              <button
                onClick={() => setSelectedPol(null)}
                className="text-gray-700 hover:text-black ml-2 font-extrabold"
              >
                ✕
              </button>
            </div>
          ) : (
            <input
              type="text"
              value={polSearchInput}
              placeholder="Enter POL..."
              className="w-full px-3 py-3 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              onChange={handlePolInputChange}
            />
          )}

          {/* POL Search Results */}
          {polSearchInput && polResults.length > 0 && !selectedPol && (
            <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg max-h-96 overflow-y-auto border border-gray-200">
              {polResults.map((port, index) => (
                <div
                  key={index}
                  className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0"
                  onClick={() => handlePolSelect(port)}
                >
                  <PortDropdownItem port={port} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="w-full relative">
          <label className="block text-lg font-bold text-gray-600 mb-1">
            Port of Discharge (POD) <span className="text-red-500">*</span>
          </label>

          {selectedPod ? (
            <div className="w-full px-3 py-3 bg-white border border-gray-300 rounded-lg shadow-sm flex justify-between items-center">
              <div className="flex items-center gap-3 w-full">
                {selectedPod.country_code && (
                  <img
                    src={`https://flagsapi.com/${selectedPod.country_code.toUpperCase()}/flat/64.png`}
                    alt={`${selectedPod.country} flag`}
                    className="w-6 h-4 object-cover rounded-sm shadow-sm mr-3"
                  />
                )}
                <p className="text-sm text-gray-800 font-medium">
                  {selectedPod.name}
                  {selectedPod.city ? `, ${selectedPod.city}` : ""}
                  {selectedPod.country ? `, ${selectedPod.country}` : ""}
                  {selectedPod.code ? `, ${selectedPod.code}` : ""}
                </p>
                <div className="ml-auto text-xs text-gray-500">
                  Port type: {checkPortType(selectedPod.port_type)}
                </div>
              </div>
              <button
                onClick={() => setSelectedPod(null)}
                className="text-gray-500 hover:text-gray-700 ml-2"
              >
                ✕
              </button>
            </div>
          ) : (
            <input
              type="text"
              value={podSearchInput}
              placeholder="Enter POD..."
              className="w-full px-3 py-3 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              onChange={handlePodInputChange}
            />
          )}

          {/* POD Search Results */}
          {podSearchInput && podResults.length > 0 && !selectedPod && (
            <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg max-h-96 overflow-y-auto border border-gray-200">
              {podResults.map((port, index) => (
                <div
                  key={index}
                  className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0"
                  onClick={() => handlePodSelect(port)}
                >
                  <PortDropdownItem port={port} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {error && <div className="mt-1 p-1 text-red-700 rounded-md">{error}</div>}
    </div>
  );
};

// Helper function to map carrier types to port types
const getPortTypeFromCarrier = (carrierType: string): string => {
  switch (carrierType) {
    case "sea_port":
      return "sea_port";
    case "air_port":
      return "air_port";
    case "address":
      return "address";
    default:
      return "all";
  }
};

export default MappingForm;

const checkPortType = (portType: string) => {
  if (portType === "sea_port") return "Sea Port";
  if (portType === "air_port") return "Air Port";
  if (portType === "address") return "Address";
  return portType;
};

const PortDropdownItem = ({ port }: { port: Port }) => {
  return (
    <div className="flex justify-between items-center w-full">
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
  );
};
