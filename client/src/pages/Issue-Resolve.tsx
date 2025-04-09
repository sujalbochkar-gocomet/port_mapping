import IssueReportResolveIssue from "../components/IssueReport-ResolveIssue";
import NavBar from "../components/NavBar";

const IssueResolve = () => {
  return (
    <div>
      <NavBar />
      <div className="max-w-7xl mx-auto p-8">
        <IssueReportResolveIssue />
      </div>
    </div>
  );
};

export default IssueResolve;
