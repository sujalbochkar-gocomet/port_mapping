import { useState, useEffect } from "react";
import axios from "axios";
import { Shipment } from "../types/types";
import ShipmentBlock from "./Mapping-ShipmentBlock";
import { toast } from "react-toastify";

const ShipmentList = () => {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchShipments = async () => {
      try {
        const response = await axios.get("http://localhost:3000/shipments");
        setShipments(response.data);
      } catch (error) {
        console.error("Error searching ports:", error);
        toast.error("Failed to search ports");
      } finally {
        setIsLoading(false);
      }
    };

    fetchShipments();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {shipments.length > 0 ? (
        shipments.map((shipment) => (
          <ShipmentBlock key={shipment.id} {...shipment} />
        ))
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
          <p className="text-lg font-medium text-gray-600">
            No ports found
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Try searching with different keywords
          </p>
        </div>
      )}
    </div>
  );
};

export default ShipmentList;
