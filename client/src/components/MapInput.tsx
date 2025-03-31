import { useState } from "react";

interface Port {
  id: string;
  name: string;
  city?: string;
  country?: string;
  country_code?: string;
  code?: string;
  port_type?: string;
  verified?: boolean;
}

interface Shipment {
  pol: {
    port: Port;
    verified: boolean;
    verified_message: string;
  };
  pod: {
    port: Port;
    verified: boolean;
    verified_message: string;
  };
  carrierType: string;
  id: string;
}

const MapInput = () => {
  const [shipments, setShipments] = useState<Shipment[]>([]);

  return (
    <>
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-center gap-4">
          <div className="w-full">
            <label className="block text-lg font-bold text-gray-600 mb-1">
              Port of Loading (POL)
            </label>
            <input
              type="text"
              placeholder="Enter POL..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="w-full">
            <label className="block text-lg font-bold text-gray-600 mb-1">
              Port of Discharge (POD)
            </label>
            <input
              type="text"
              placeholder="Enter POD..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="w-full">
            <label className="block text-lg font-bold text-gray-600 mb-1">
              Carrier Type
            </label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="">Select type...</option>
              <option value="sea">Sea</option>
              <option value="air">Air</option>
              <option value="land">Land</option>
            </select>
          </div>
          <div className="text-nowrap flex self-end">
            <button className="px-5 py-2.5 bg-blue-700 text-white font-bold rounded-md hover:bg-blue-600 transition-colors flex items-center gap-2">
              Add Shipment
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 font-bold"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M8.5 2a1 1 0 0 0-1 1v5h-5a1 1 0 0 0 0 2h5v5a1 1 0 0 0 2 0v-5h5a1 1 0 0 0 0-2h-5V3a1 1 0 0 0-1-1z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* list of shipments */}
        {shipments.map((shipment) => (
          <ShipmentBlock key={shipment.id} shipment={shipment} />
        ))}
      </div>
    </>
  );
};

const ShipmentBlock = ({ shipment }: { shipment: Shipment }) => {
  return (
    <div className="flex items-center justify-center gap-4">
      <div>{shipment.id}</div>
      <div>{shipment.pol.port.name}</div>
      <div>{shipment.pod.port.name}</div>
      <div>{shipment.carrierType}</div>
    </div>
  );
};

export default MapInput;
