import NavBar from "./NavBar";
import IssueReportSearch from "./IssueReport-Search";
import IssueReportTable from "./IssueReport-Table";

const IssueReportMain = () => {
  return (
    <div>
      <NavBar />
      <IssueReportSearch />
      <IssueReportTable />
    </div>
  );
};

export default IssueReportMain;
