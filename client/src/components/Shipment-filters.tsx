import React from "react";

type FilterType = "all" | "verified" | "unverified";
type SortOrder = "asc" | "desc";

interface ShipmentFiltersProps {
  filterType: FilterType;
  setFilterType: React.Dispatch<React.SetStateAction<FilterType>>;
  sortOrder: SortOrder;
  setSortOrder: React.Dispatch<React.SetStateAction<SortOrder>>;
}

const ShipmentFilters: React.FC<ShipmentFiltersProps> = ({
  filterType,
  setFilterType,
  sortOrder,
  setSortOrder,
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
      {/* Filter controls */}
      <div className="flex items-center bg-white rounded-lg p-1 shadow-sm border border-gray-200">
        <span className="px-3 text-sm text-gray-500">Filter:</span>
        <div className="flex rounded-md overflow-hidden">
          <button
            onClick={() => setFilterType("all")}
            className={`px-3 py-2 text-sm transition-colors ${
              filterType === "all"
                ? "bg-blue-100 text-blue-700 font-medium"
                : "bg-gray-50 text-gray-600 hover:bg-gray-100"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterType("verified")}
            className={`px-3 py-2 text-sm transition-colors ${
              filterType === "verified"
                ? "bg-green-100 text-green-700 font-medium"
                : "bg-gray-50 text-gray-600 hover:bg-gray-100"
            }`}
          >
            Verified
          </button>
          <button
            onClick={() => setFilterType("unverified")}
            className={`px-3 py-2 text-sm transition-colors ${
              filterType === "unverified"
                ? "bg-red-100 text-red-700 font-medium"
                : "bg-gray-50 text-gray-600 hover:bg-gray-100"
            }`}
          >
            Unverified
          </button>
        </div>
      </div>

      {/* Sort controls */}
      <div className="flex items-center bg-white rounded-lg p-1 shadow-sm border border-gray-200">
        <span className="px-3 text-sm text-gray-500">Sort:</span>
        <div className="flex rounded-md overflow-hidden">
          <button
            onClick={() => setSortOrder("desc")}
            className={`px-3 py-2 text-sm transition-colors flex items-center gap-1 ${
              sortOrder === "desc"
                ? "bg-blue-100 text-blue-700 font-medium"
                : "bg-gray-50 text-gray-600 hover:bg-gray-100"
            }`}
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
                d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
              />
            </svg>
            Newest
          </button>
          <button
            onClick={() => setSortOrder("asc")}
            className={`px-3 py-2 text-sm transition-colors flex items-center gap-1 ${
              sortOrder === "asc"
                ? "bg-blue-100 text-blue-700 font-medium"
                : "bg-gray-50 text-gray-600 hover:bg-gray-100"
            }`}
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
                d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4"
              />
            </svg>
            Oldest
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShipmentFilters;
