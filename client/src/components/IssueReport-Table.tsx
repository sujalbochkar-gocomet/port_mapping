import { useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import {
  Input,
  Button,
  Table,
  Typography,
  Card,
  Empty,
  Space,
  Tag,
  Flex,
} from "antd";
import {
  SearchOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from "@ant-design/icons";
import type { ColumnType } from "antd/es/table";

const { Title, Text } = Typography;

type SortField = "keyword" | "confidenceScore" | "numberOfQueries";
type SortOrder = "asc" | "desc";

interface MappedPort {
  id: string;
  name: string;
  type: string;
}

interface DataItem {
  id: number;
  issueId: string;
  keyword: string;
  confidenceScore: number;
  numberOfQueries: number;
  mappedPorts: MappedPort[];
}

const IssueReportTable = () => {
  const [searchKeyword, setSearchKeyword] = useState("");
  const [sortField, setSortField] = useState<SortField>("keyword");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [filteredData, setFilteredData] = useState<DataItem[]>([]);

  // Sample data - replace with your actual data source
  const initialData = useMemo<DataItem[]>(
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
      <ArrowUpOutlined style={{ fontSize: 12, marginLeft: 4 }} />
    ) : (
      <ArrowDownOutlined style={{ fontSize: 12, marginLeft: 4 }} />
    );
  };

  // Define table columns
  const columns: ColumnType<DataItem>[] = [
    {
      title: "S.No",
      dataIndex: "index",
      key: "index",
      width: "5%",
      render: (_: unknown, __: DataItem, index: number) => index + 1,
    },
    {
      title: (
        <div
          onClick={() => handleSort("keyword")}
          style={{ cursor: "pointer", display: "flex", alignItems: "center" }}
        >
          Keyword {getSortIcon("keyword")}
        </div>
      ),
      dataIndex: "keyword",
      key: "keyword",
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
      width: "17%",
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
          onClick={() => handleSort("numberOfQueries")}
          style={{ cursor: "pointer", display: "flex", alignItems: "center" }}
        >
          No of Queries {getSortIcon("numberOfQueries")}
        </div>
      ),
      dataIndex: "numberOfQueries",
      key: "numberOfQueries",
      width: "15%",
      sorter: false,
      sortDirections: [],
      align: "center",
    },
    {
      title: "Action",
      key: "action",
      width: "20%",
      render: (record: DataItem) => (
        <Button
          type="primary"
          onClick={() => navigate(`/admin/issue/resolve/${record.issueId}`)}
          style={{
            borderRadius: "8px",
            boxShadow: "0 2px 0 rgba(0,0,0,0.02)",
            height: "auto",
            padding: "8px 16px",
          }}
        >
          Resolve Issue
        </Button>
      ),
      align: "center",
    },
  ];

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto", padding: 32 }}>
      {/* Header Section */}
      <div
        style={{
          marginBottom: 24,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Title
          level={3}
          style={{ margin: 0, color: "#4B5563", fontWeight: 600 }}
        >
          Port Mapping Issues
        </Title>
      </div>

      {/* Search Section */}

      <Flex align="center" gap="middle" style={{ marginBottom: 24 }}>
        <div style={{ flex: 1 }}>
          <Input
            placeholder="Search by keyword or confidence score..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            style={{ width: "100%", background: "transparent" }}
            prefix={<SearchOutlined style={{ color: "#d9d9d9" }} />}
            size="large"
          />
        </div>
        <Button
          type="primary"
          icon={<SearchOutlined />}
          size="large"
          style={{
            borderRadius: "8px",
            boxShadow: "0 2px 0 rgba(0,0,0,0.02)",
            height: "auto",
            padding: "8px 16px",
          }}
        >
          Search
        </Button>
      </Flex>

      {/* Table Section */}
      <Card
        style={{
          borderRadius: 12,
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          border: "1px solid #F3F4F6",
          overflow: "hidden",
        }}
        bodyStyle={{ padding: 0 }}
      >
        <Table
          dataSource={filteredData}
          columns={columns}
          rowKey="id"
          pagination={false}
          style={{ width: "100%" }}
          rowClassName={() => "ant-table-row-custom"}
          className="custom-table"
          locale={{
            emptyText: filteredData.length === 0 && (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <Space
                    direction="vertical"
                    size={8}
                    style={{ marginTop: 16 }}
                  >
                    <Text strong style={{ fontSize: 16, color: "#4B5563" }}>
                      No results found
                    </Text>
                    <Text
                      type="secondary"
                      style={{ maxWidth: 400, margin: "0 auto" }}
                    >
                      No matching ports found for your search. Try adjusting
                      your search terms or filters.
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

export default IssueReportTable;
