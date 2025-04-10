import { useState, useMemo } from "react";
import { Table, Typography, Card, Tag } from "antd";
import { ArrowUpOutlined, ArrowDownOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";

const { Title, Text } = Typography;

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
        confidenceScore: 0.5,
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
      <ArrowUpOutlined style={{ fontSize: 12, marginLeft: 4 }} />
    ) : (
      <ArrowDownOutlined style={{ fontSize: 12, marginLeft: 4 }} />
    );
  };

  const columns: ColumnsType<MappedPort> = [
    {
      title: (
        <div
          onClick={() => handleSort("portName")}
          style={{ cursor: "pointer", display: "flex", alignItems: "center" }}
        >
          Port Name {getSortIcon("portName")}
        </div>
      ),
      dataIndex: "portName",
      key: "portName",
      width: "40%",
      sorter: false,
      sortDirections: [],
      render: (text: string) => (
        <Text style={{ fontWeight: 500, color: "#1f2937" }}>{text}</Text>
      ),
    },
    {
      title: (
        <div
          onClick={() => handleSort("confidenceScore")}
          style={{ cursor: "pointer", display: "flex", alignItems: "center" }}
        >
          Confidence Score {getSortIcon("confidenceScore")}
        </div>
      ),
      dataIndex: "confidenceScore",
      key: "confidenceScore",
      width: "30%",
      sorter: false,
      sortDirections: [],
      render: (score: number) => (
        <Tag
          color="error"
          style={{
            padding: "4px 16px",
            borderRadius: "16px",
            fontSize: "14px",
            fontWeight: 500,
          }}
        >
          {(score * 100).toFixed(1)}%
        </Tag>
      ),
      align: "center",
    },
    {
      title: (
        <div
          onClick={() => handleSort("region")}
          style={{ cursor: "pointer", display: "flex", alignItems: "center" }}
        >
          Region {getSortIcon("region")}
        </div>
      ),
      dataIndex: "region",
      key: "region",
      width: "30%",
      sorter: false,
      sortDirections: [],
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <Card
        style={{
          borderRadius: 12,
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          border: "1px solid #F3F4F6",
        }}
      >
        <Title level={5} style={{ color: "#4B5563", marginBottom: 24 }}>
          Mapped Ports for "{keyword}"
        </Title>

        <Table
          columns={columns}
          dataSource={sortedPorts}
          rowKey="id"
          pagination={false}
          className="custom-table"
          rowClassName={() => "ant-table-row-custom"}
        />
      </Card>

      <style>
        {`
        .custom-table .ant-table-thead > tr > th {
          background-color: #F9FAFB;
          color: #6B7280;
          font-weight: 500;
          border-bottom: 1px solid #E5E7EB;
          padding: 16px;
        }

        .ant-table-row-custom:hover > td {
          background-color: #F9FAFB !important;
        }

        .ant-table-row-custom > td {
          padding: 16px;
          border-bottom: 1px solid #F3F4F6;
        }
        `}
      </style>
    </div>
  );
};

export default IssueReportMappedPorts;
