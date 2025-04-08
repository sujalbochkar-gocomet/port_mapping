const IssueReportMappedPorts = ({ keyword }: { keyword: string }) => {
  return (
    <div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-medium text-gray-800">
          Mapped Ports for "{keyword}"
        </h2>
      </div>
    </div>
  );
};

export default IssueReportMappedPorts;
