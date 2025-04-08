import { useState, useEffect } from "react";
import axios from "axios";
import ShipmentBlock from "./Mapping-ShipmentBlock";
import { Shipment } from "../types/types";
import { toast } from "react-toastify";

interface ShipmentListProps {
  filterType: "all" | "verified" | "unverified";
  sortOrder: "asc" | "desc";
}

const ShipmentList = ({ filterType, sortOrder }: ShipmentListProps) => {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchShipments = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `http://localhost:3000/get-shipments?type=${filterType}&order=${sortOrder}`
        );
        setShipments(response.data || []);
      } catch (err) {
        toast.error("Failed to fetch shipments");
        console.error("Error fetching shipments:", err);
        setShipments([]);
      } finally {
        setLoading(false);
      }
    };
    fetchShipments();
  }, [filterType, sortOrder]); // Re-fetch when filters change

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex flex-col gap-4">
        {shipments && shipments.length > 0 ? (
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
              No shipments found
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Try changing your filters or adding a new shipment
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShipmentList;
