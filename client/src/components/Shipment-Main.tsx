import { useState } from "react";
import ShipmentForm from "./Shipment-Form";
import ShipmentList from "./Shipment-List";
import ShipmentFilters from "./Shipment-filters";

type FilterType = "all" | "verified" | "unverified";
type SortOrder = "asc" | "desc";

const ShipmentsMain = () => {
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <ShipmentForm />
      <div className="mt-8 border-t border-gray-200 pt-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
          <div className="text-2xl font-bold text-gray-600 mb-4 sm:mb-0">
            Shipments
          </div>
          <ShipmentFilters
            filterType={filterType}
            setFilterType={setFilterType}
            sortOrder={sortOrder}
            setSortOrder={setSortOrder}
          />
        </div>
        <ShipmentList filterType={filterType} sortOrder={sortOrder} />
      </div>
    </div>
  );
};

export default ShipmentsMain;
