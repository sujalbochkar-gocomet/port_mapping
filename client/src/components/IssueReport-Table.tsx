import { useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { FiSearch, FiArrowUp, FiArrowDown } from "react-icons/fi";

type SortField = "keyword" | "confidenceScore" | "numberOfQueries";
type SortOrder = "asc" | "desc";

const IssueReportTable = () => {
  const [searchKeyword, setSearchKeyword] = useState("");
  const [sortField, setSortField] = useState<SortField>("keyword");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [filteredData, setFilteredData] = useState<any[]>([]);

  // Sample data - replace with your actual data source
  const initialData = useMemo<any[]>(
    () => [
      {
        id: 1,
        issueId: "random-issue-id-1",
        keyword: "Port A",
        confidenceScore: 0.5,
        numberOfQueries: 2,
        mappedPorts: [
          {
            id: "bea5ef8c-111f-4b46-b5fd-0581dce08da0",
            name: "Port Temporary",
            type: "sea_port",
          },
          {
            id: "bea5ef8c-111f-4b46-b5fd-0581dce08da0",
            name: "Port Temporary",
            type: "sea_port",
          },
          {
            id: "bea5ef8c-111f-4b46-b5fd-0581dce08da0",
            name: "Port Temporary",
            type: "sea_port",
          },
        ],
      },
      {
        id: 2,
        issueId: "random-issue-id-2",
        keyword: "Port B",
        confidenceScore: 0.48,
        numberOfQueries: 5,
        mappedPorts: [
          {
            id: "bea5ef8c-111f-4b46-b5fd-0581dce08da0",
            name: "Port Temporary",
            type: "sea_port",
          },
          {
            id: "bea5ef8c-111f-4b46-b5fd-0581dce08da0",
            name: "Port Temporary",
            type: "sea_port",
          },
          {
            id: "bea5ef8c-111f-4b46-b5fd-0581dce08da0",
            name: "Port Temporary",
            type: "sea_port",
          },
        ],
      },
      {
        id: 3,
        issueId: "random-issue-id-3",
        keyword: "Port C",
        confidenceScore: 0.36,
        numberOfQueries: 1,
        mappedPorts: [
          {
            id: "bea5ef8c-111f-4b46-b5fd-0581dce08da0",
            name: "Port Temporary",
            type: "sea_port",
          },
          {
            id: "bea5ef8c-111f-4b46-b5fd-0581dce08da0",
            name: "Port Temporary",
            type: "sea_port",
          },
          {
            id: "bea5ef8c-111f-4b46-b5fd-0581dce08da0",
            name: "Port Temporary",
            type: "sea_port",
          },
        ],
      },
    ],
    []
  ); // Empty dependency array since this data is static

  // Search and filter logic
  useEffect(() => {
    let result = [...initialData];

    if (searchKeyword) {
      result = result.filter(
        (row) =>
          row.keyword.toLowerCase().includes(searchKeyword.toLowerCase()) ||
          row.confidenceScore.toString().includes(searchKeyword) ||
          row.numberOfQueries.toString().includes(searchKeyword)
      );
    }

    result.sort((a, b) => {
      if (sortField === "confidenceScore" || sortField === "numberOfQueries") {
        const aValue = a[sortField];
        const bValue = b[sortField];

        if (sortOrder === "asc") {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      } else {
        const aValue = a[sortField].toLowerCase();
        const bValue = b[sortField].toLowerCase();

        if (sortOrder === "asc") {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      }
    });

    setFilteredData(result);
  }, [searchKeyword, sortField, sortOrder, initialData]);

  const navigate = useNavigate();

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
    <div className="max-w-7xl mx-auto p-8 space-y-8">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">
          Port Mapping Issues
        </h1>
      </div>

      {/* Search Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
        <div className="flex justify-between items-center gap-6">
          <div className="flex-1 flex gap-4">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by keyword or confidence score..."
                className="block w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900 placeholder-gray-400"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
              />
            </div>
            <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium shadow-sm">
              <FiSearch className="w-4 h-4" />
              Search
            </button>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse table-fixed">
            <colgroup>
              <col className="w-[5%]" /> {/* S.No */}
              <col className="" /> {/* Keyword */}
              <col className="w-[17%]" /> {/* Confidence Score */}
              <col className="w-[15%]" /> {/* Number of Queries */}
              <col className="w-[20%]" /> {/* Action */}
            </colgroup>
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  S.No
                </th>
                {(
                  [
                    "keyword",
                    "confidenceScore",
                    "numberOfQueries",
                  ] as SortField[]
                ).map((field) => (
                  <th
                    key={field}
                    className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort(field)}
                  >
                    <div className="flex items-center gap-1">
                      {field === "confidenceScore"
                        ? "Confidence Score"
                        : field === "numberOfQueries"
                        ? "No of Queries"
                        : field.charAt(0).toUpperCase() + field.slice(1)}
                      {getSortIcon(field)}
                    </div>
                  </th>
                ))}
                <th className="px-6 py-4 text-xs text-left font-semibold text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredData.map((row, index) => (
                <tr
                  key={row.id}
                  className="hover:bg-gray-50 transition-colors group"
                >
                  <td className="px-6 py-4 text-sm text-gray-500 truncate">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium truncate">
                    {row.keyword}
                  </td>
                  <td className="px-12 py-4 text-sm text-gray-600 truncate ">
                    <span className="bg-red-100 text-red-700 rounded-4xl px-4 py-1">
                      {(row.confidenceScore * 100).toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-16 py-4 text-sm text-gray-600 truncate ">
                    {row.numberOfQueries}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <button
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 opacity-90 cursor-pointer group-hover:opacity-100"
                      onClick={() =>
                        navigate(`/admin/issue/resolve/${row.issueId}`)
                      }
                    >
                      Resolve Issue
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* No Results Message */}
      {filteredData.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="flex flex-col items-center gap-3">
            <FiSearch className="w-12 h-12 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900">
              No results found
            </h3>
            <p className="text-gray-500 max-w-md">
              No matching ports found for your search. Try adjusting your search
              terms or filters.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default IssueReportTable;
