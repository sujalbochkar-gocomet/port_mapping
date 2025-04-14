import { useState, useEffect, useRef } from "react";
import { Port } from "../types/types";
import flagIcon from "../assets/flag.svg";
import {
  Input,
  Button,
  Card,
  Space,
  Typography,
  Tag,
  Flex,
  Radio,
  Spin,
} from "antd";
import {
  SearchOutlined,
  EnvironmentOutlined,
  DownOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

interface MapExistingPortProps {
  keyword: string;
  onPortSelected: (portId: string) => void;
}

const MapExistingPort = ({ keyword, onPortSelected }: MapExistingPortProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Port[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const [isAlternativeNamesOpen, setIsAlternativeNamesOpen] = useState(false);
  const [selectedPort, setSelectedPort] = useState<Port | null>(null);
  const [searchType, setSearchType] = useState("sea");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsSearchDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const searchPorts = async () => {
      if (!searchTerm.trim()) {
        setSearchResults([]);
        setIsSearchDropdownOpen(false);
        return;
      }

      setIsSearching(true);

      let searchTypeParam = searchType;
      if (searchType === "sea") searchTypeParam = "sea_port";
      else if (searchType === "air") searchTypeParam = "air_port";
      else if (searchType === "land") searchTypeParam = "inland_port";
      else if (searchType === "address") searchTypeParam = "address";

      try {
        const response = await fetch(
          `${process.env.BACKEND_URL}/issue-search?q=${searchTerm}&type=${searchTypeParam}`
        );
        const data = await response.json();
        setSearchResults(data);
        setIsSearchDropdownOpen(true);
      } catch (error) {
        console.error("Error searching ports:", error);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(searchPorts, 1000);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm, searchType]);

  const handlePortSelect = (port: Port) => {
    setSelectedPort(port);
    onPortSelected(port.id);
    setIsSearchDropdownOpen(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <Card
        style={{
          borderRadius: 12,
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          border: "1px solid #F3F4F6",
        }}
      >
        <Flex align="center" gap="small" style={{ marginBottom: 24 }}>
          <EnvironmentOutlined style={{ color: "#1677ff", fontSize: 18 }} />
          <Title level={5} style={{ margin: 0, color: "#4B5563" }}>
            Map "{keyword}" to Existing Port
          </Title>
          <div style={{ marginLeft: "auto" }}>
            <Radio.Group
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
              buttonStyle="solid"
              size="small"
              style={{ borderRadius: 8 }}
            >
              {["sea", "air", "land", "address"].map((type) => (
                <Radio.Button
                  key={type}
                  value={type}
                  style={{
                    borderRadius: 6,
                    margin: "0 2px",
                    textTransform: "capitalize",
                  }}
                >
                  {type}
                </Radio.Button>
              ))}
            </Radio.Group>
          </div>
        </Flex>

        <Space direction="vertical" style={{ width: "100%" }} size="large">
          <div ref={dropdownRef} style={{ position: "relative" }}>
            <Input
              placeholder="Search by port name, code, or location..."
              prefix={<SearchOutlined style={{ color: "#d9d9d9" }} />}
              size="large"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setIsSearchDropdownOpen(true)}
              style={{ width: "100%", background: "transparent" }}
              suffix={isSearching ? <Spin size="small" /> : null}
            />

            {isSearchDropdownOpen && searchResults.length > 0 && (
              <div
                style={{
                  position: "absolute",
                  width: "100%",
                  zIndex: 10,
                  marginTop: 4,
                  backgroundColor: "white",
                  borderRadius: 8,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  border: "1px solid #E5E7EB",
                  maxHeight: 384,
                  overflowY: "auto",
                }}
              >
                {searchResults.map((port) => (
                  <div
                    key={port.id}
                    style={{
                      padding: "12px 16px",
                      borderBottom: "1px solid #F3F4F6",
                      cursor: "pointer",
                      transition: "background-color 0.2s",
                      backgroundColor: "white",
                    }}
                    onClick={() => handlePortSelect(port)}
                  >
                    <Flex justify="space-between" align="center">
                      <Flex align="center" gap="middle">
                        {port.country_code ? (
                          <img
                            src={`https://flagsapi.com/${port.country_code.toUpperCase()}/flat/64.png`}
                            alt={`${port.country} flag`}
                            style={{
                              width: 24,
                              height: 16,
                              objectFit: "cover",
                              borderRadius: 4,
                              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                            }}
                          />
                        ) : (
                          <FlagIcon />
                        )}
                        <div>
                          <Text strong style={{ color: "#1f2937" }}>
                            {(() => {
                              const displaynamearr = port.display_name
                                .split(",")
                                .filter(Boolean);
                              const displayText = [
                                displaynamearr.join(", "),
                                port.code || "",
                              ]
                                .filter(Boolean)
                                .join(", ");
                              return displayText;
                            })()}
                          </Text>
                          <div>
                            <Text type="secondary" style={{ fontSize: 14 }}>
                              {[port.city, port.state_name, port.country]
                                .filter(Boolean)
                                .join(", ")}
                            </Text>
                          </div>
                        </div>
                      </Flex>
                      <Flex align="center" gap="middle">
                        <Text type="secondary" style={{ fontSize: 14 }}>
                          Port Type: {port.port_type}
                        </Text>
                        <Button type="primary" size="small">
                          Map
                        </Button>
                      </Flex>
                    </Flex>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedPort && (
            <Card
              style={{
                marginTop: 24,
                borderRadius: 8,
                border: "1px solid #E5E7EB",
              }}
            >
              <Space
                direction="vertical"
                size="large"
                style={{ width: "100%" }}
              >
                <Flex align="center" gap="small">
                  {selectedPort.country_code ? (
                    <img
                      src={`https://flagsapi.com/${selectedPort.country_code.toUpperCase()}/flat/64.png`}
                      alt={`${selectedPort.country} flag`}
                      style={{
                        width: 24,
                        height: 16,
                        objectFit: "cover",
                        borderRadius: 4,
                        boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                      }}
                    />
                  ) : (
                    <FlagIcon />
                  )}
                  <Title level={4} style={{ margin: 0 }}>
                    {(() => {
                      const displaynamearr = selectedPort.display_name
                        .split(",")
                        .filter(Boolean);
                      const displayText = [
                        displaynamearr.join(", "),
                        selectedPort.code || "",
                      ];
                      return displayText.join(", ");
                    })()}
                  </Title>
                </Flex>

                <Flex wrap="wrap" gap="large" style={{ marginTop: 16 }}>
                  <div style={{ minWidth: 200, flex: 1 }}>
                    <Text
                      type="secondary"
                      style={{
                        fontSize: 14,
                        display: "block",
                        marginBottom: 4,
                      }}
                    >
                      Location:
                    </Text>
                    <Text>
                      {[selectedPort.city, selectedPort.country]
                        .filter(Boolean)
                        .join(", ")}
                    </Text>
                  </div>

                  <div style={{ minWidth: 200, flex: 1 }}>
                    <Text
                      type="secondary"
                      style={{
                        fontSize: 14,
                        display: "block",
                        marginBottom: 4,
                      }}
                    >
                      Address:
                    </Text>
                    <Text>{selectedPort.address || "Not available"}</Text>
                  </div>

                  <div style={{ minWidth: 200, flex: 1 }}>
                    <Text
                      type="secondary"
                      style={{
                        fontSize: 14,
                        display: "block",
                        marginBottom: 4,
                      }}
                    >
                      Region:
                    </Text>
                    <Text>
                      {selectedPort.region?.toUpperCase() || "Not available"}
                    </Text>
                  </div>

                  <div style={{ minWidth: 200, flex: 1 }}>
                    <Text
                      type="secondary"
                      style={{
                        fontSize: 14,
                        display: "block",
                        marginBottom: 4,
                      }}
                    >
                      Coordinates:
                    </Text>
                    <Text>
                      {selectedPort.lat_lon
                        ? `${selectedPort.lat_lon.lat}, ${selectedPort.lat_lon.lon}`
                        : "Not available"}
                    </Text>
                  </div>
                </Flex>

                {selectedPort.other_names &&
                  selectedPort.other_names.length > 0 && (
                    <div style={{ marginTop: 16 }}>
                      <Flex
                        align="center"
                        gap="small"
                        onClick={() =>
                          setIsAlternativeNamesOpen(!isAlternativeNamesOpen)
                        }
                        style={{ cursor: "pointer" }}
                      >
                        <Text type="secondary" style={{ fontSize: 14 }}>
                          Alternative Names:
                        </Text>
                        <DownOutlined
                          style={{
                            fontSize: 12,
                            transition: "transform 0.3s",
                            transform: isAlternativeNamesOpen
                              ? "rotate(180deg)"
                              : "rotate(0)",
                          }}
                        />
                      </Flex>

                      {isAlternativeNamesOpen && (
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 8,
                            marginTop: 8,
                          }}
                        >
                          {selectedPort.other_names.map((name, index) => (
                            <Tag
                              key={index}
                              color="blue"
                              style={{ margin: 0, borderRadius: 16 }}
                            >
                              {name}
                            </Tag>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                <div
                  style={{
                    marginTop: 24,
                    display: "flex",
                    justifyContent: "flex-end",
                  }}
                >
                  <Button
                    type="primary"
                    icon={<EnvironmentOutlined />}
                    onClick={() => onPortSelected(selectedPort.id)}
                    style={{
                      borderRadius: 8,
                      boxShadow: "0 2px 0 rgba(0,0,0,0.02)",
                    }}
                  >
                    Map to This Port
                  </Button>
                </div>
              </Space>
            </Card>
          )}
        </Space>
      </Card>
    </div>
  );
};

export const FlagIcon = () => {
  return (
    <img
      src={flagIcon}
      alt="Default flag"
      style={{
        width: 24,
        height: 16,
        objectFit: "cover",
        borderRadius: 4,
        boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
      }}
    />
  );
};

export default MapExistingPort;
