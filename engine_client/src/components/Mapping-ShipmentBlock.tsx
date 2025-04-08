import { PortDisplayData, Shipment } from "../types/types";
import { useState } from "react";
import { FlagIcon } from "./PortIcons";

const ShipmentBlock = (shipment: Shipment) => {
  const [showPolTooltip, setShowPolTooltip] = useState(false);

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


  return (
    <div className="w-full bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-all duration-200 group">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          {/* Header Section */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 bg-gray-50 px-2 py-1 rounded-lg text-sm">
                <span className="text-gray-500">Country Code:</span>
                <span className="font-medium text-gray-900">{polData.port.countryCode}</span>
              </div>
              <div className="text-gray-500 text-sm">|</div>
              <div className="flex items-center gap-2 bg-gray-50 px-2 py-1 rounded-lg text-sm">
                <span className="text-gray-500">Code:</span>
                <span className="font-medium text-gray-900">{polData.port.id}</span>
              </div>
              <div className="text-gray-500 text-sm">|</div>
              <div className="flex items-center gap-2 bg-gray-50 px-2 py-1 rounded-lg text-sm">
                <span className="text-gray-500">Lat & Lon:</span>
                <span className="font-medium text-gray-900">
                  {polData.port.latLon.lat.toFixed(4)}, {polData.port.latLon.lon.toFixed(4)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-500 flex items-center gap-2">
                <div className="text-sm text-gray-500 flex items-center gap-2 mr-4">
                  <span
                    className={`px-2 py-0.5 text-xs font-medium rounded-full border flex items-center gap-1 ${
                      shipment.polVerified
                        ? "text-green-700 bg-green-50 border-green-100"
                        : "text-red-700 bg-red-50 border-red-100"
                    }`}
                  >
                    {shipment.polVerified ? (
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
                  <div
                    className="relative"
                    onMouseEnter={() => setShowPolTooltip(true)}
                    onMouseLeave={() => setShowPolTooltip(false)}
                  >
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
                    {showPolTooltip && (
                      <div className="absolute left-0 bottom-full mb-2 w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg z-10">
                        Port where the cargo is loaded or discharged  
                      </div>
                    )}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {polData.port.countryCode ? (
                        <img
                          src={`https://flagsapi.com/${polData.port.countryCode.toUpperCase()}/flat/64.png`}
                          alt={`${polData.port.country} flag`}
                          className="w-6 h-4 object-cover rounded-sm shadow-sm"
                        />
                      ) : (
                        <FlagIcon />
                      )}
                      <div>
                        <p className="font-medium text-gray-900">
                          {polData.port.display_name || polData.port.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {polData.port.city}, {polData.port.country}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-500">Confidence Score:</span>
                      <span className="text-sm text-gray-500">{polData.port.matchScore}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShipmentBlock;
