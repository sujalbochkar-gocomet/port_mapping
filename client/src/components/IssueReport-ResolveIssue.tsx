import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import NavBar from "./NavBar";
import CreateNewPort from "./IssueReport-CreateNewPort";
import MapExistingPort from "./IssueReport-MapExistingPort";
import { FiPlus, FiMapPin } from "react-icons/fi";

interface NewPortData {
  name: string;
  code: string;
  country: string;
  type: "sea_port" | "inland_port" | "air_port" | "address";
}

const IssueReportResolveIssue = () => {
  const { id: issueId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"create" | "map">("create");

  // This would be replaced with actual data from your API
  const issueDetails = {
    keyword: "Port A",
    mappedPortId: "bea5ef8c-111f-4b46-b5fd-0581dce08da0",
    mappedPortName: "Port Temporary",
  };

  const handlePortCreated = (portData: NewPortData) => {
    // TODO: Implement port creation logic
    console.log("Port created:", portData);
  };

  const handlePortSelected = (portId: string) => {
    // TODO: Implement port mapping logic
    console.log("Port selected:", portId);
  };

  return (
    <div>
      <NavBar />
      <div className="max-w-7xl mx-auto p-8">
        {/* Main Content */}
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-gray-800">
              Issue ID: {issueId}
            </h1>
            <button
              onClick={() => navigate("/admin/issue/dashboard")}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 flex items-center gap-2 cursor-pointer"
            >
              <span>←</span> Back to Issues
            </button>
          </div>

          {/* Issue Details Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-center gap-8">
              <div className="flex items-center gap-2">
                <span className="text-base font-medium text-black">
                  Keyword:
                </span>
                <span className="text-gray-600 bg-gray-100 px-2 py-1 rounded-lg">
                  {issueDetails.keyword}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-base font-medium text-black">
                  Mapped Port ID:
                </span>
                <span className="text-gray-600 bg-gray-100 px-2 py-1 rounded-lg">
                  {issueDetails.mappedPortId || "Not mapped yet"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-base font-medium text-black">
                  Mapped Port Name:
                </span>
                <span className="text-gray-600 bg-gray-100 px-2 py-1 rounded-lg">
                  {issueDetails.mappedPortName || "Not mapped yet"}
                </span>
              </div>
            </div>
          </div>

          {/* Action Tabs */}
          <div className="flex justify-center">
            <div className="w-1/2 flex justify-between border-b border-gray-200">
              <button
                className={`relative w-1/2 py-4 px-6 font-medium flex items-center justify-center gap-2 transition-colors ${
                  activeTab === "create"
                    ? "text-blue-600"
                    : "text-gray-600 hover:text-gray-800"
                }`}
                onClick={() => setActiveTab("create")}
              >
                <FiPlus className="w-5 h-5" />
                Create New Port
                {activeTab === "create" && (
                  <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600"></div>
                )}
              </button>
              <button
                className={`relative w-1/2 py-4 px-6 font-medium flex items-center justify-center gap-2 transition-colors ${
                  activeTab === "map"
                    ? "text-blue-600"
                    : "text-gray-600 hover:text-gray-800"
                }`}
                onClick={() => setActiveTab("map")}
              >
                <FiMapPin className="w-5 h-5" />
                Map to Existing Port
                {activeTab === "map" && (
                  <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600"></div>
                )}
              </button>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === "create" ? (
            <CreateNewPort
              keyword={issueDetails.keyword}
              onPortCreated={handlePortCreated}
            />
          ) : (
            <MapExistingPort
              keyword={issueDetails.keyword}
              onPortSelected={handlePortSelected}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default IssueReportResolveIssue;
