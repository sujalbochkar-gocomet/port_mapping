import { useState, useMemo } from "react";
import { FiArrowUp, FiArrowDown } from "react-icons/fi";

type SortField = "portName" | "confidenceScore" | "region";
type SortOrder = "asc" | "desc";

interface MappedPort {
  id: string;
  portName: string;
  confidenceScore: number;
  region: string;
}

const IssueReportMappedPorts = ({ keyword }: { keyword: string }) => {
  const [sortField, setSortField] = useState<SortField>("portName");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  // Sample data - replace with your actual data source
  const mappedPorts = useMemo<MappedPort[]>(
    () => [
      {
        id: "1",
        portName: "Port of Singapore",
        confidenceScore: 0.45,
        region: "Asia",
      },
      {
        id: "2",
        portName: "Port of Rotterdam",
        confidenceScore: 0.38,
        region: "Europe",
      },
      {
        id: "3",
        portName: "Port of Los Angeles",
        confidenceScore: 0.42,
        region: "North America",
      },
      {
        id: "4",
        portName: "Port of Shanghai",
        confidenceScore: 0.50,
        region: "Asia",
      },
      {
        id: "5",
        portName: "Port of Hamburg",
        confidenceScore: 0.35,
        region: "Europe",
      },
    ],
    []
  );

  const sortedPorts = useMemo(() => {
    return [...mappedPorts].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (sortField === "confidenceScore") {
        return sortOrder === "asc"
          ? (aValue as number) - (bValue as number)
          : (bValue as number) - (aValue as number);
      }

      const comparison = String(aValue).localeCompare(String(bValue));
      return sortOrder === "asc" ? comparison : -comparison;
    });
  }, [mappedPorts, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortOrder === "asc" ? (
      <FiArrowUp className="w-4 h-4 ml-1" />
    ) : (
      <FiArrowDown className="w-4 h-4 ml-1" />
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-medium text-gray-800 mb-6">
          Mapped Ports for "{keyword}"
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse table-fixed">
            <colgroup>
              <col className="w-[40%]" />
              <col className="w-[30%]" />
              <col className="w-[30%]" />
            </colgroup>
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {(["portName", "confidenceScore", "region"] as SortField[]).map(
                  (field) => (
                    <th
                      key={field}
                      className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort(field)}
                    >
                      <div className="flex items-center gap-1">
                        {field === "portName"
                          ? "Port Name"
                          : field === "confidenceScore"
                          ? "Confidence Score"
                          : "Region"}
                        {getSortIcon(field)}
                      </div>
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sortedPorts.map((port) => (
                <tr
                  key={port.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium truncate">
                    {port.portName}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <span className="bg-red-100 text-red-700 rounded-full px-3 py-1">
                      {(port.confidenceScore * 100).toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {port.region}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default IssueReportMappedPorts;
