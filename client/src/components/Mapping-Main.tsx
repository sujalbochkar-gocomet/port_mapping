import { tempShipmentData } from "../types/types";
import MappingForm from "./Mapping-Form";
import ShipmentList from "./Mapping-ShipmentList";

const MapInput = () => {
  return (
    <>
      <div className="max-w-7xl mx-auto my-6">
        <MappingForm />
      </div>
      <div className="max-w-7xl mx-auto">
        <div className="text-2xl font-bold text-gray-600 mb-4">
          Shipments
        </div>
      </div>
      <div className="max-w-7xl mx-auto">
        <ShipmentList shipments={tempShipmentData} />
      </div>
    </>
  );
};

export default MapInput;
