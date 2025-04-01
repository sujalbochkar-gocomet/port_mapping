import React from "react";
import ShipmentBlock from "./Mapping-ShipmentBlock";
import { Shipment } from "../types/types";

interface ShipmentListProps {
  shipments: Shipment[];
}

const ShipmentList: React.FC<ShipmentListProps> = ({ shipments }) => {
  return (
    <div>
      <div className="flex flex-col gap-4">
        {shipments.map((shipment) => (
          <ShipmentBlock key={shipment.id} shipment={shipment} />
        ))}
      </div>
    </div>
  );
};

export default ShipmentList;
