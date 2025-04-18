import { PortDisplayData, Shipment } from "../types/types";
import { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { FlagIcon } from "./Shipment-Form";

// Interface for the port data needed by PortDisplay

const ShipmentBlock = (shipment: Shipment) => {
  const [showPolTooltip, setShowPolTooltip] = useState(false);
  const [showPodTooltip, setShowPodTooltip] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Create POL data from the shipment properties
  const polData: PortDisplayData = {
    port: {
      _id: shipment.polId || "",
      id: shipment.polId || "",
      name: shipment.polName || "",
      type: shipment.polType || "",
      country: shipment.polCountry || "",
      countryCode: shipment.polCountryCode || "",
      code: shipment.polCode || "",
      isCustom: shipment.polIsCustom || false,
      verified: shipment.polVerified || false,
      matchScore: shipment.polMatchScore || 0,
      latLon: shipment.polLatLon || { lat: 0, lon: 0 },
      display_name: shipment.polDisplay_name,
      other_names: shipment.polOther_names,
      city: shipment.polCity,
      state_name: shipment.polState_name,
      region: shipment.polRegion,
      port_type: shipment.polPort_type || "",
      lat_lon: shipment.polLat_lon,
      nearby_ports: shipment.polNearby_ports,
      other_details: shipment.polOther_details,
    },
    carrierType: shipment.carrierType,
    createdAt: shipment.createdAt || new Date(),
  };
  // Create POD data from the shipment properties
  const podData: PortDisplayData = {
    port: {
      _id: shipment.podId || "",
      id: shipment.podId || "",
      name: shipment.podName || "",
      type: shipment.podType || "",
      country: shipment.podCountry || "",
      countryCode: shipment.podCountryCode || "",
      code: shipment.podCode || "",
      isCustom: shipment.podIsCustom || false,
      verified: shipment.podVerified || false,
      matchScore: shipment.podMatchScore || 0,
      latLon: shipment.podLatLon || { lat: 0, lon: 0 },
      display_name: shipment.podDisplay_name,
      other_names: shipment.podOther_names,
      city: shipment.podCity,
      state_name: shipment.podState_name,
      region: shipment.podRegion,
      port_type: shipment.podPort_type || "",
      lat_lon: shipment.podLat_lon,
      nearby_ports: shipment.podNearby_ports,
      other_details: shipment.podOther_details,
    },
    carrierType: shipment.carrierType,
    createdAt: shipment.createdAt || new Date(),
  };

  const handleDelete = async () => {
    if (!shipment.id) return;

    try {
      setIsDeleting(true);
      await axios.delete(
        `${import.meta.env.VITE_BACKEND_URL}/delete-shipment/${shipment.id}`,
        {
          headers: {
            'ngrok-skip-browser-warning': 'true'
          }
        }
      );
      toast.success("Shipment deleted successfully", {
        onClose: () => {
          window.location.reload();
        },
      });
    } catch (error) {
      console.error("Error deleting shipment:", error);
      toast.error("Failed to delete shipment");
    } finally {
      setIsDeleting(false);
      setShowDropdown(false);
    }
  };
  const portType =
    shipment.podPort_type || shipment.polPort_type || shipment.carrierType;
  return (
    <div className="w-full bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-all duration-200 group">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          {/* Header Section */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 bg-gray-50 px-2 py-1 rounded-lg text-sm">
                <span className="text-gray-500">RF--</span>
                <span className="font-medium text-gray-900">TCNU4926696</span>
              </div>
              <div className="text-gray-500 text-sm">|</div>
              <span className="text-gray-500 text-sm">Created:</span>
              <span className="font-medium text-gray-900 text-sm">
                {new Date(shipment.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                {new Date(shipment.createdAt).toLocaleDateString([], {
                  day: "2-digit",
                  month: "2-digit",
                  year: "2-digit",
                })}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-500 flex items-center gap-2">
                <div className="text-sm text-gray-500 flex items-center gap-2 mr-4">
                  <span
                    className={`px-2 py-0.5 text-xs font-medium rounded-full border flex items-center gap-1 ${
                      shipment.polVerified && shipment.podVerified
                        ? "text-green-700 bg-green-50 border-green-100"
                        : "text-red-700 bg-red-50 border-red-100"
                    }`}
                  >
                    {shipment.polVerified && shipment.podVerified ? (
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
                <span>Port Type:</span>
                <span className="font-medium text-gray-900">
                  {getPortType(portType || "")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {}}
                  className="px-3 py-1.5 bg-blue-700 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-1.5"
                >
                  Track
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
                <div className="relative">
                  <button
                    className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-md"
                    onClick={() => setShowDropdown(!showDropdown)}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                      />
                    </svg>
                  </button>
                  {showDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                      <div className="py-1">
                        <button
                          onClick={handleDelete}
                          disabled={isDeleting}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center gap-2"
                        >
                          {isDeleting ? (
                            <>
                              <span className="animate-spin">⌛</span>
                              Deleting...
                            </>
                          ) : (
                            <>
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                              Delete Shipment
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Ports Section */}
          <div className="flex gap-2 rounded-lg p-4">
            {/* POL */}
            <PortDisplay
              portData={polData}
              showTooltip={showPolTooltip}
              onTooltipChange={setShowPolTooltip}
            />

            {/* POD */}
            <PortDisplay
              portData={podData}
              showTooltip={showPodTooltip}
              onTooltipChange={setShowPodTooltip}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

interface PortDisplayProps {
  portData: PortDisplayData;
  showTooltip: boolean;
  onTooltipChange: (show: boolean) => void;
}

const getPortType = (portType: string) => {
  switch (portType) {
    case "sea_port":
      return "SEA";
    case "address":
      return "LAND";
    case "air_port":
      return "AIR";
    default:
      return "NA";
  }
};

const PortDisplay = ({ portData, onTooltipChange }: PortDisplayProps) => {
  // Function to get match score color
  const getMatchScoreColor = (score: number) => {
    if (score > 90) return "bg-green-50 text-green-800 border-green-200";
    if (score >= 70) return "bg-yellow-50 text-yellow-800 border-yellow-200";
    return "bg-red-50 text-red-800 border-red-200";
  };

  return (
    <div className="flex items-center w-1/2 bg-gray-50 rounded-lg p-3 mx-1">
      <div className="min-w-[24px]">
        <div
          className="relative flex items-center group/tooltip"
          onMouseEnter={() => onTooltipChange(true)}
          onMouseLeave={() => onTooltipChange(false)}
        >
          <div
            className={`w-3 h-3 rounded-full ${
              portData.port.verified ? "bg-green-500" : "bg-red-500"
            } ring-2 ring-opacity-30 ${
              portData.port.verified ? "ring-green-200" : "ring-red-200"
            }`}
          />
        </div>
      </div>
      <div className="flex items-center justify-between flex-1">
        <div className="flex items-center gap-2 min-w-0">
          {portData.port.countryCode ? (
            <img
              src={`https://flagsapi.com/${portData.port.countryCode.toUpperCase()}/flat/64.png`}
              alt={`${portData.port.country} flag`}
              className="w-6 h-4 object-cover rounded-sm shadow-sm flex-shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <FlagIcon />
          )}
          <div className="flex flex-col">
            <span className="text-sm text-gray-900 font-medium truncate">
              {(() => {
                const displayName =
                  portData.port.display_name || portData.port.name;
                const city = portData.port.city;
                const country = portData.port.country;
                const code = portData.port.code;
                let fullText = displayName;
                if (city) fullText += `, ${city}`;
                if (country) fullText += `, ${country.toUpperCase()}`;
                if (code) fullText += `, ${code.toUpperCase()}`;
                return fullText.length > 55
                  ? fullText.substring(0, 55) + "..."
                  : fullText;
              })()}
            </span>
          </div>
        </div>

        {/* Verification status */}
        <div className="flex flex-col gap-1 items-center">
          <span
            className={`px-2 py-0.5 text-xs font-medium border rounded-full ${
              portData.port.verified
                ? "text-green-700 bg-green-50 border-green-100"
                : "text-red-700 bg-red-50 border-red-100"
            }`}
          >
            {portData.port.verified ? "Verified" : "Unverified"}
          </span>
          {/* Match score indicator */}
          {portData.port.matchScore > 0 && (
            <span
              className={`px-1.5 py-0.5 text-xs font-medium rounded-full inline-flex items-center border ${getMatchScoreColor(
                portData.port.matchScore
              )} mt-1 w-fit`}
            >
              Match: {Math.round(portData.port.matchScore)}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShipmentBlock;
