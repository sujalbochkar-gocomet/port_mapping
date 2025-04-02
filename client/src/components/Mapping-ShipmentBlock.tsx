import { PortVerification, Shipment } from "../types/types";
import { useState } from "react";
import axios from "axios";
import { FlagIcon } from "./Mapping-Form";
import { toast } from "react-hot-toast";

const ShipmentBlock = (shipment: Shipment) => {
  const [showPolTooltip, setShowPolTooltip] = useState(false);
  const [showPodTooltip, setShowPodTooltip] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!shipment.id) return;

    try {
      setIsDeleting(true);
      await axios.delete(
        `http://localhost:3000/delete-shipment/${shipment.id}`
      );
      toast.success("Shipment deleted successfully");
      window.location.reload();
    } catch (error) {
      console.error("Error deleting shipment:", error);
      toast.error("Failed to delete shipment");
    } finally {
      setIsDeleting(false);
      setShowDropdown(false);
    }
  };

  return (
    <div className="w-full bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-all duration-200 group">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          {/* Header Section */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 bg-gray-50 px-2 py-1 rounded-lg text-sm">
                <span className="text-gray-500">RF --</span>
                <span className="font-medium text-gray-900">TCNU4926696</span>
              </div>
              <span
                className={`px-2 py-0.5 text-xs font-medium rounded-full border ${
                  shipment.pol.verified && shipment.pod.verified
                    ? "text-green-700 bg-green-50 border-green-100"
                    : "text-red-700 bg-red-50 border-red-100"
                }`}
              >
                {shipment.pol.verified && shipment.pod.verified
                  ? "Verified"
                  : "Alert Unverified Port"}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-500 flex items-center gap-2">
                <span>Carrier:</span>
                <span className="font-medium text-gray-900">
                  {shipment.carrierType}
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
          <div className="space-y-2 rounded-lg p-4">
            {/* POL */}
            <PortDisplay
              portData={shipment.pol}
              showTooltip={showPolTooltip}
              onTooltipChange={setShowPolTooltip}
            />

            {/* POD */}
            <PortDisplay
              portData={shipment.pod}
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
  portData: PortVerification;
  showTooltip: boolean;
  onTooltipChange: (show: boolean) => void;
}

const PortDisplay = ({ portData, onTooltipChange }: PortDisplayProps) => {
  return (
    <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
      <div className="min-w-[24px]">
        <div
          className="relative flex items-center group/tooltip"
          onMouseEnter={() => onTooltipChange(true)}
          onMouseLeave={() => onTooltipChange(false)}
        >
          <div
            className={`w-3 h-3 rounded-full ${
              portData.verified ? "bg-green-500" : "bg-red-500"
            } ring-4 ring-opacity-30 ${
              portData.verified ? "ring-green-100" : "ring-red-100"
            }`}
          />
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 flex-1">
        <div className="flex items-center gap-2 min-w-0">
          {portData.port?.country_code ? (
            <img
              src={`https://flagsapi.com/${portData.port.country_code.toUpperCase()}/flat/64.png`}
              alt={`${portData.port.country} flag`}
              className="w-6 h-4 object-cover rounded-sm shadow-sm flex-shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <FlagIcon />
          )}
          <span className="text-sm text-gray-900 truncate">
            {[
              portData.port?.name,
              portData.port?.city,
              portData.port?.country,
              portData.port?.code,
            ]
              .filter(Boolean)
              .join(", ")}
          </span>
        </div>

        {/* Verification status and match score displayed directly */}
        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-0.5 text-xs font-medium rounded-full ${
              portData.verified
                ? "text-green-700 bg-green-50 border border-green-100"
                : "text-red-700 bg-red-50 border border-red-100"
            }`}
          >
            {portData.verified ? "Verified" : "Unverified"}
          </span>
          <span className="text-xs text-gray-500">
            Match Score:{" "}
            <span className="font-medium">{portData.match_score}</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default ShipmentBlock;
