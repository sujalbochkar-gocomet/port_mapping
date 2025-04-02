import { useState, useEffect } from "react";
import axios from "axios";
import ShipmentBlock from "./Mapping-ShipmentBlock";
import { Shipment } from "../types/types";
import { toast } from "react-toastify";

const ShipmentList = () => {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchShipments = async () => {
      try {
        setLoading(true);
        const response = await axios.get("http://localhost:3000/get-shipments");
        setShipments(response.data.shipments);
      } catch (err) {
        toast.error("Failed to fetch shipments");
        console.error("Error fetching shipments:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchShipments();
    if (shipments.length === 0) {
      toast.error("No shipments found");
    }
  }, []);

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
        {shipments.length > 0 ? (
          shipments.map((shipment) => (
            <ShipmentBlock key={shipment.id} {...shipment} />
          ))
        ) : (
          <div className="flex items-center justify-center p-8 text-red-500">
            No shipments found
          </div>
        )}
      </div>
    </div>
  );
};

export default ShipmentList;
