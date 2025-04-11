import { useState, useMemo } from "react";
import { Table, Typography, Card, Tag, Empty, Space } from "antd";
import { ArrowUpOutlined, ArrowDownOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";

const { Title, Text } = Typography;

type SortField = "portName" | "confidenceScore" | "region";
type SortOrder = "asc" | "desc";

interface TablePort {
  id: string;
  portName: string;
  confidenceScore: number;
  region: string;
}

interface Props {
  keyword: string;
  mappedPorts?: Array<{
    id: string;
    name: string;
    type: string;
  }>;
}

const IssueReportMappedPorts = ({ keyword, mappedPorts }: Props) => {
  const [sortField, setSortField] = useState<SortField>("portName");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  // Transform passed mappedPorts to the format expected by this component
  const tablePorts = useMemo<TablePort[]>(() => {
    if (mappedPorts && mappedPorts.length > 0) {
      return mappedPorts.map((port) => ({
        id: port.id,
        portName: port.name,
        confidenceScore: Math.random() * 0.5 + 0.3, // Random score between 0.3 and 0.8 as sample
        region:
          port.type === "sea_port"
            ? "Sea"
            : port.type === "air_port"
            ? "Air"
            : port.type === "inland_port"
            ? "Land"
            : "Other",
      }));
    }

    // Fallback to sample data if no mapped ports are provided
    return [
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
    ];
  }, [mappedPorts]);

  const sortedPorts = useMemo(() => {
    return [...tablePorts].sort((a, b) => {
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
  }, [tablePorts, sortField, sortOrder]);

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

  const columns: ColumnsType<TablePort> = [
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
        <div style={{ textAlign: "left" }}>
          <Tag
            color="error"
            style={{
              padding: "4px 16px",
              borderRadius: "16px",
              fontSize: "14px",
              fontWeight: 500,
              textAlign: "left",
              display: "inline-block",
            }}
          >
            {(score * 100).toFixed(1)}%
          </Tag>
        </div>
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
          locale={{
            emptyText: sortedPorts.length === 0 && (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <Space
                    direction="vertical"
                    size={8}
                    style={{ marginTop: 16 }}
                  >
                    <Text strong style={{ fontSize: 16, color: "#4B5563" }}>
                      No mapped ports
                    </Text>
                    <Text
                      type="secondary"
                      style={{ maxWidth: 400, margin: "0 auto" }}
                    >
                      No ports have been mapped to this keyword yet.
                    </Text>
                  </Space>
                }
                style={{ margin: "64px 0" }}
              />
            ),
          }}
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
