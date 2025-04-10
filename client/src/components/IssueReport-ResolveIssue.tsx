import { useParams, useNavigate } from "react-router-dom";
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

const IssueReportResolveIssue = () => {
  const { id: issueId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"create" | "map" | "mapped">(
    "mapped"
  );

  // This would be replaced with actual data from your API
  const issueDetails = {
    keyword: "Port A",
    numberOfQueries: 10,
  };

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
      children: <IssueReportMappedPorts keyword={issueDetails.keyword} />,
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
    <div style={{ maxWidth: 1280, margin: "0 auto", padding: 32 }}>
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
          </Flex>
        </Card>

        {/* Tabs */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div style={{ width: "75%" }}>
            <Tabs
              activeKey={activeTab}
              onChange={(key) =>
                setActiveTab(key as "create" | "map" | "mapped")
              }
              items={items}
              size="large"
              centered
              tabBarStyle={{
                fontWeight: 500,
                borderBottom: "1px solid #E5E7EB",
                marginBottom: 24,
              }}
            />
          </div>
        </div>
      </Space>
    </div>
  );
};

export default IssueReportResolveIssue;
