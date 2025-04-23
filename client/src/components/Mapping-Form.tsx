import { useState, useRef, useEffect, useCallback } from "react";
import axios from "axios";
import { statusPort } from "../types/types";
import ModeSelector from "./Mapping-ModeSelector";
import {
  Input,
  Button,
  Card,
  Typography,
  Spin,
  Tag,
  Empty,
  Space,
  Flex,
} from "antd";
import { SearchOutlined, DownOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

interface PortResult {
  port: {
    id: string;
    name: string;
    display_name: string;
    city: string;
    country: string;
    country_code: string;
    code: string;
    port_type: string;
    region: string;
    lat_lon?: {
      lat: number;
      lon: number;
    };
    other_names: string[];
    verified: boolean;
  };
  confidence: number;
  matchingLayer: string;
}

const MappingForm = () => {
  const [carrierType, setCarrierType] = useState<string>("sea_port");
  const [searchInput, setSearchInput] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<statusPort[]>([]);
  const [showOtherNames, setShowOtherNames] = useState<{
    [key: string]: boolean;
  }>({});
  const resultsRef = useRef<HTMLDivElement>(null);

  // Add debounce timer and abort controller refs
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortController = useRef<AbortController | null>(null);

  // Debounced search function
  const debouncedSearch = useCallback(
    (term: string) => {
      // Clear existing timer
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      // Abort previous request if it exists
      if (abortController.current) {
        abortController.current.abort();
      }

      if (!term.trim()) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      // Set loading state
      setIsSearching(true);

      // Create new abort controller
      abortController.current = new AbortController();

      // Set new timer
      debounceTimer.current = setTimeout(async () => {
        try {
          const response = await axios.post(
            `${import.meta.env.VITE_BACKEND_URL}/ports/search`,
            {
              keyword: term,
              type: carrierType,
            },
            {
              signal: abortController.current?.signal,
              headers: {
                accept: "application/json",
                "X-API-Key": import.meta.env.VITE_API_KEY,
                "Content-Type": "application/json",
              },
            }
          );
          const results = response.data.data.results.map(
            (result: PortResult) => ({
              port: result.port,
              confidence: result.confidence,
              matchingLayer: result.matchingLayer,
            })
          );
          console.log(results);
          setSearchResults(results);
        } catch (error) {
          // Ignore errors from aborted requests
          if (axios.isCancel(error)) {
            return;
          }
          console.error("Error searching:", error);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      }, 300); // 300ms delay
    },
    [carrierType]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, []);

  const handleSearch = async () => {
    if (!searchInput.trim()) {
      return;
    }
    debouncedSearch(searchInput);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value);
    debouncedSearch(value);
  };

  // Clear search results when changing carrier type
  useEffect(() => {
    setSearchResults([]);
    setSearchInput("");
  }, [carrierType]);

  const toggleOtherNames = (portId: string) => {
    console.log("Toggling for port ID:", portId); // Debugging line
    setShowOtherNames((prev) => ({
      ...prev,
      [portId]: !prev[portId],
    }));
  };

  return (
    <div>
      {/* Mode Selector Block */}
      <div style={{ marginBottom: 24 }}>
        <Title
          level={5}
          style={{ fontWeight: "bold", marginBottom: 8, color: "#4B5563" }}
        >
          Port Type <Text type="danger">*</Text>
        </Title>
        <Flex align="center" gap="middle">
          <ModeSelector
            selectedMode={carrierType}
            onModeSelect={setCarrierType}
          />
        </Flex>
      </div>

      {/* Search Block */}
      <Flex align="center" gap="middle">
        <div style={{ width: "100%", position: "relative" }}>
          <Title
            level={5}
            style={{ fontWeight: "bold", marginBottom: 4, color: "#4B5563" }}
          >
            Enter Keyword Here <Text type="danger">*</Text>
          </Title>
          <Flex align="center" gap="middle">
            <div style={{ flex: 1 }}>
              <Input
                value={searchInput}
                onChange={handleInputChange}
                onPressEnter={handleSearch}
                placeholder={
                  carrierType === "address"
                    ? "Enter address..."
                    : "Enter port name, city, or code..."
                }
                size="large"
                style={{ width: "100%" }}
              />
            </div>
            <Button
              type="primary"
              onClick={handleSearch}
              disabled={isSearching}
              icon={<SearchOutlined />}
              loading={isSearching}
              size="large"
            >
              Search
            </Button>
          </Flex>
        </div>
      </Flex>

      {/* Results Section */}
      <div ref={resultsRef} style={{ marginTop: 16 }}>
        {isSearching ? (
          <Card
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 40,
              textAlign: "center",
              backgroundColor: "#F9FAFB",
            }}
          >
            <Spin size="large" />
            <Text
              style={{
                display: "block",
                marginTop: 16,
                fontSize: 16,
                fontWeight: 500,
                color: "#4B5563",
              }}
            >
              Searching...
            </Text>
          </Card>
        ) : searchInput.trim() === "" ? (
          <Card
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 40,
              textAlign: "center",
              backgroundColor: "#F9FAFB",
            }}
          >
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <Text
                  style={{
                    display: "block",
                    marginTop: 16,
                    fontSize: 16,
                    fontWeight: 500,
                    color: "#4B5563",
                  }}
                >
                  Enter a search term to find ports
                </Text>
              }
              style={{ fontSize: 64, color: "#9CA3AF" }}
            />
          </Card>
        ) : Array.isArray(searchResults) && searchResults.length > 0 ? (
          <Space direction="vertical" size="middle" style={{ width: "100%" }}>
            {searchResults.map((result) => (
              <Card
                key={result.port.id}
                style={{
                  width: "100%",
                  borderRadius: 12,
                  border: "1px solid #F3F4F6",
                }}
                styles={{ body: { padding: 24 } }}
                hoverable
              >
                {/* Header Section */}
                <Flex
                  justify="space-between"
                  align="flex-start"
                  style={{ marginBottom: 16 }}
                >
                  <Flex align="center" gap="small">
                    <Flex align="center" gap="small">
                      {result.port.country_code && (
                        <img
                          src={`https://flagsapi.com/${result.port.country_code.toUpperCase()}/flat/64.png`}
                          alt={`${result.port.country} flag`}
                          style={{
                            width: 32,
                            height: 24,
                            objectFit: "cover",
                            borderRadius: 4,
                            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                          }}
                        />
                      )}
                      <Title level={4} style={{ margin: 0 }}>
                        {result.port.name}
                      </Title>
                      <Tag
                        style={{
                          margin: 0,
                          backgroundColor: "#F3F4F6",
                          color: "#4B5563",
                          border: "1px solid #E5E7EB",
                        }}
                      >
                        {result.port.code}
                      </Tag>
                    </Flex>
                  </Flex>
                  <Flex align="center" gap="small">
                    <Tag color={result.port.verified ? "success" : "warning"}>
                      {result.port.verified ? "Verified" : "Unverified"}
                    </Tag>
                    <Tag color="blue">
                      Match: {result.confidence.toFixed(1)}%
                    </Tag>
                  </Flex>
                </Flex>

                {/* Details Grid */}
                <Flex gap="large" style={{ flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 250 }}>
                    <Space
                      direction="vertical"
                      size="small"
                      style={{ width: "100%" }}
                    >
                      <Flex gap="small">
                        <Text type="secondary" style={{ minWidth: 96 }}>
                          Location:
                        </Text>
                        <Text>
                          {result.port.city ? `${result.port.city},` : ""}{" "}
                          {result.port.country}
                        </Text>
                      </Flex>
                      <Flex gap="small">
                        <Text type="secondary" style={{ minWidth: 96 }}>
                          Region:
                        </Text>
                        <Text>{result.port.region.toUpperCase()}</Text>
                      </Flex>
                      {result.port.other_names.length > 0 && (
                        <div
                          style={{
                            marginTop: 8,
                            paddingTop: 8,
                            borderTop: "1px solid #F3F4F6",
                          }}
                        >
                          <Button
                            type="link"
                            onClick={() => toggleOtherNames(result.port.id)}
                            style={{ padding: "6px 12px", height: "auto" }}
                            icon={
                              <DownOutlined
                                rotate={
                                  showOtherNames[result.port.id] ? 180 : 0
                                }
                              />
                            }
                          >
                            {showOtherNames[result.port.id]
                              ? `Hide Other Names`
                              : "Show Other Names"}
                          </Button>
                        </div>
                      )}
                    </Space>
                  </div>
                  <div style={{ flex: 1, minWidth: 250 }}>
                    <Space
                      direction="vertical"
                      size="small"
                      style={{ width: "100%" }}
                    >
                      <Flex gap="small">
                        <Text type="secondary" style={{ minWidth: 96 }}>
                          Address:
                        </Text>
                        <Text style={{ flex: 1 }}>
                          {result.port.address || "N/A"}
                        </Text>
                      </Flex>
                      <Flex gap="small">
                        <Text type="secondary" style={{ minWidth: 96 }}>
                          Coordinates:
                        </Text>
                        <Text>
                          {result.port.lat_lon?.lat && result.port.lat_lon?.lon
                            ? `${result.port.lat_lon.lat.toFixed(
                                4
                              )}, ${result.port.lat_lon.lon.toFixed(4)}`
                            : "Not available"}
                        </Text>
                      </Flex>
                    </Space>
                  </div>
                </Flex>

                {/* Other Names Section */}
                {showOtherNames[result.port.id] &&
                  result.port.other_names.length > 0 && (
                    <div
                      style={{
                        marginTop: 16,
                        paddingTop: 16,
                        borderTop: "1px solid #F3F4F6",
                      }}
                    >
                      <div
                        style={{
                          backgroundColor: "#F9FAFB",
                          borderRadius: 8,
                          padding: 16,
                        }}
                      >
                        <Flex gap="small" wrap="wrap">
                          {result.port.other_names.map((name, index) => (
                            <Tag key={index} color="blue">
                              {name}
                            </Tag>
                          ))}
                        </Flex>
                      </div>
                    </div>
                  )}
              </Card>
            ))}
          </Space>
        ) : (
          <Card
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 40,
              textAlign: "center",
              backgroundColor: "#F9FAFB",
            }}
          >
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <Space direction="vertical" size={4}>
                  <Text
                    style={{ fontSize: 16, fontWeight: 500, color: "#4B5563" }}
                  >
                    No matching ports found for your search
                  </Text>
                  <Text type="secondary">
                    Try searching with different keywords
                  </Text>
                </Space>
              }
            />
          </Card>
        )}
      </div>
    </div>
  );
};

export default MappingForm;
