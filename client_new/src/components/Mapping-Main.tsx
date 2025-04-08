import { useState } from "react";
import MappingForm from "./Mapping-Form";
import ShipmentList from "./Mapping-ShipmentList";

const MappingMain = () => {
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [filterType, setFilterType] = useState<
    "all" | "verified" | "unverified"
  >("all");

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <MappingForm />
      <div className="mt-8 border-t border-gray-200 pt-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
          <div className="text-2xl font-bold text-gray-600 mb-4 sm:mb-0">
            Shipments
          </div>

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
        </div>

        <ShipmentList filterType={filterType} sortOrder={sortOrder} />
      </div>
    </div>
  );
};

export default MappingMain;
