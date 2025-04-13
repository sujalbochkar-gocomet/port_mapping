import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import CreateNewPort from "./IssueReport-CreateNewPort";
import MapExistingPort from "./IssueReport-MapExistingPort";
import IssueReportMappedPorts from "./IssueReport-MappedPorts";
import { Typography, Button, Card, Space, Flex, Tabs, Tag } from "antd";
import {
  PlusOutlined,
  EnvironmentOutlined,
  UnorderedListOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

interface NewPortData {
  name: string;
  code: string;
  country: string;
  type: "sea_port" | "inland_port" | "air_port" | "address";
}

interface DataItem {
  id: number;
  issueId: string;
  keyword: string;
  confidenceScore: number;
  numberOfQueries: number;
  mappedPorts: Array<{
    id: string;
    name: string;
    type: string;
  }>;
}

const IssueReportResolveIssue = () => {
  const { id: issueId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<"create" | "map" | "mapped">(
    "mapped"
  );

  // Get the issue details from location state or use fallback values
  const recordData = location.state?.record as DataItem;

  const issueDetails = recordData || {
    keyword: "Port A",
    numberOfQueries: 10,
  };

  // Add debugging
  console.log("Location state:", location.state);
  console.log("Record data:", recordData);
  console.log("Mapped ports:", recordData?.mappedPorts);

  const handlePortCreated = (portData: NewPortData) => {
    // TODO: Implement port creation logic
    console.log("Port created:", portData);
  };

  const handlePortSelected = (portId: string) => {
    // TODO: Implement port mapping logic
    console.log("Port selected:", portId);
  };

  const items = [
    {
      key: "mapped",
      label: (
        <Flex align="center" gap="small">
          <UnorderedListOutlined />
          <span>Mapped Ports</span>
        </Flex>
      ),
      children: (
        <IssueReportMappedPorts
          keyword={issueDetails.keyword}
          mappedPorts={recordData?.mappedPorts}
        />
      ),
    },
    {
      key: "create",
      label: (
        <Flex align="center" gap="small">
          <PlusOutlined />
          <span>Create New Port</span>
        </Flex>
      ),
      children: (
        <CreateNewPort
          keyword={issueDetails.keyword}
          onPortCreated={handlePortCreated}
        />
      ),
    },
    {
      key: "map",
      label: (
        <Flex align="center" gap="small">
          <EnvironmentOutlined />
          <span>Map to Existing Port</span>
        </Flex>
      ),
      children: (
        <MapExistingPort
          keyword={issueDetails.keyword}
          onPortSelected={handlePortSelected}
        />
      ),
    },
  ];

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto", padding: 32 }}>
      {/* Main Content */}
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        {/* Header */}
        <Flex justify="space-between" align="center">
          <Title
            level={3}
            style={{ margin: 0, color: "#4B5563", fontWeight: 600 }}
          >
            Issue ID: {issueId}
          </Title>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate("/admin/issue/dashboard")}
          >
            Back to Issues
          </Button>
        </Flex>

        {/* Issue Details Card */}
        <Card
          style={{
            borderRadius: 12,
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            border: "1px solid #F3F4F6",
          }}
        >
          <Flex justify="center" align="center" gap="large">
            <Flex align="center" gap="small">
              <Text strong>Keyword:</Text>
              <Tag
                style={{
                  backgroundColor: "#F3F4F6",
                  color: "#4B5563",
                  border: "1px solid #E5E7EB",
                  fontSize: 14,
                  padding: "2px 8px",
                }}
              >
                {issueDetails.keyword}
              </Tag>
            </Flex>
            <Flex align="center" gap="small">
              <Text strong>Number of Queries:</Text>
              <Tag
                style={{
                  backgroundColor: "#F3F4F6",
                  color: "#4B5563",
                  border: "1px solid #E5E7EB",
                  fontSize: 14,
                  padding: "2px 8px",
                }}
              >
                {issueDetails.numberOfQueries}
              </Tag>
            </Flex>
            {recordData?.confidenceScore && (
              <Flex align="center" gap="small">
                <Text strong>Confidence Score:</Text>
                <Tag
                  color="error"
                  style={{
                    padding: "2px 8px",
                    borderRadius: "16px",
                    fontSize: "14px",
                    fontWeight: 500,
                  }}
                >
                  {(recordData.confidenceScore * 100).toFixed(1)}%
                </Tag>
              </Flex>
            )}
          </Flex>
        </Card>

        {/* Tabs */}
        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key as "create" | "map" | "mapped")}
          items={items}
          size="large"
          centered
          tabBarStyle={{
            fontWeight: 500,
            borderBottom: "1px solid #E5E7EB",
            marginBottom: 24,
          }}
          style={{ width: "100%" }}
        />
      </Space>
    </div>
  );
};

export default IssueReportResolveIssue;
