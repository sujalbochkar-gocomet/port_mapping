import { useState, useEffect } from "react";
import axios from "axios";
import { Shipment } from "../types/types";
import ShipmentBlock from "./Mapping-ShipmentBlock";

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
      {shipments.length > 0  && (
        shipments.map((shipment) => (
          <ShipmentBlock key={shipment.id} {...shipment} />
        ))
      )}
    </div>
  );
};

export default ShipmentList;
