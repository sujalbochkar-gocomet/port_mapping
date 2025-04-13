import { useState } from "react";
import { toast } from "react-toastify";
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Checkbox,
  Typography,
  Tag,
  Flex,
  Row,
  Col,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface NewPortData {
  name: string;
  code: string;
  country: string;
  type: "sea_port" | "inland_port" | "air_port" | "address";
  display_name?: string;
  other_names?: string[];
  city?: string;
  state_name?: string;
  country_code?: string;
  region?: string;
  lat_lon?: {
    latitude: number;
    longitude: number;
  };
  address?: string;
  telephone_number?: string;
  fax_number?: string;
  website?: string;
  description?: string;
  is_head_port?: boolean;
  master_port?: boolean;
}

interface CreateNewPortProps {
  keyword: string;
  onPortCreated: (portData: NewPortData) => void;
}

const CreateNewPort = ({ keyword, onPortCreated }: CreateNewPortProps) => {
  const [newPortData, setNewPortData] = useState<NewPortData>({
    name: "",
    code: "",
    country: "",
    type: "sea_port",
    display_name: "",
    other_names: [],
    city: "",
    state_name: "",
    country_code: "",
    region: "",
    lat_lon: undefined,
    address: "",
    telephone_number: "",
    fax_number: "",
    website: "",
    description: "",
    is_head_port: false,
    master_port: false,
  });

  const [otherNameInput, setOtherNameInput] = useState("");

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;

    if (name === "latitude" || name === "longitude") {
      const newValue = parseFloat(value) || 0;
      setNewPortData({
        ...newPortData,
        lat_lon: {
          ...(newPortData.lat_lon || { latitude: 0, longitude: 0 }),
          [name]: newValue,
        },
      });
      return;
    }

    if (type === "checkbox") {
      setNewPortData({
        ...newPortData,
        [name]: (e.target as HTMLInputElement).checked,
      });
      return;
    }

    setNewPortData({
      ...newPortData,
      [name]: value,
    });
  };

  const handleAddOtherName = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && otherNameInput.trim()) {
      e.preventDefault();
      setNewPortData({
        ...newPortData,
        other_names: [
          ...(newPortData.other_names || []),
          otherNameInput.trim(),
        ],
      });
      setOtherNameInput("");
    }
  };

  const handleRemoveOtherName = (indexToRemove: number) => {
    setNewPortData({
      ...newPortData,
      other_names: newPortData.other_names?.filter(
        (_, index) => index !== indexToRemove
      ),
    });
  };

  const handleSelectChange = (value: string, name: string) => {
    setNewPortData({
      ...newPortData,
      [name]: value,
    });
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setNewPortData({
      ...newPortData,
      [name]: checked,
    });
  };

  const handleCreatePort = async () => {
    if (!newPortData.name.trim()) {
      toast.error("Port Name is required");
      return;
    }
    if (!newPortData.code.trim()) {
      toast.error("Port Code is required");
      return;
    }
    if (!newPortData.country.trim()) {
      toast.error("Country is required");
      return;
    }
    if (!newPortData.type) {
      toast.error("Port Type is required");
      return;
    }

    try {
      // TODO: Replace with actual API call
      console.log("Creating new port:", newPortData);
      onPortCreated(newPortData);
      toast.success("Port created successfully!");
    } catch (error) {
      console.error("Error creating port:", error);
      toast.error("Failed to create port");
    }
  };

  return (
    <Card
      style={{
        borderRadius: 12,
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        border: "1px solid #F3F4F6",
      }}
    >
      <Flex align="center" gap="small" style={{ marginBottom: 24 }}>
        <Title level={5} style={{ margin: 0, color: "#4B5563" }}>
          Create New Port for "{keyword}"
        </Title>
        <PlusOutlined style={{ color: "#1677ff", fontSize: 18 }} />
      </Flex>

      <Form layout="vertical" onFinish={handleCreatePort}>
        {/* Basic Information */}
        <div style={{ marginBottom: 24 }}>
          <Text
            strong
            style={{
              fontSize: 14,
              color: "#4B5563",
              display: "block",
              marginBottom: 16,
            }}
          >
            Basic Information
          </Text>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Port Name"
                required
                style={{ marginBottom: 16 }}
              >
                <Input
                  name="name"
                  value={newPortData.name}
                  onChange={handleInputChange}
                  placeholder="Enter port name"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Port Code"
                required
                style={{ marginBottom: 16 }}
              >
                <Input
                  name="code"
                  value={newPortData.code}
                  onChange={handleInputChange}
                  placeholder="Enter port code"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Display Name" style={{ marginBottom: 16 }}>
                <Input
                  name="display_name"
                  value={newPortData.display_name}
                  onChange={handleInputChange}
                  placeholder="Enter display name"
                />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="Other Names" style={{ marginBottom: 16 }}>
                <Input
                  value={otherNameInput}
                  onChange={(e) => setOtherNameInput(e.target.value)}
                  onKeyDown={handleAddOtherName}
                  placeholder="Type and press Enter to add other names"
                />
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 8,
                    marginTop: 8,
                  }}
                >
                  {newPortData.other_names?.map((name, index) => (
                    <Tag
                      key={index}
                      color="blue"
                      closable
                      onClose={() => handleRemoveOtherName(index)}
                      style={{ margin: 0, borderRadius: 4 }}
                    >
                      {name}
                    </Tag>
                  ))}
                </div>
              </Form.Item>
            </Col>
          </Row>
        </div>

        {/* Location Information */}
        <div style={{ marginBottom: 24 }}>
          <Text
            strong
            style={{
              fontSize: 14,
              color: "#4B5563",
              display: "block",
              marginBottom: 16,
            }}
          >
            Location Details
          </Text>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Country" required style={{ marginBottom: 16 }}>
                <Input
                  name="country"
                  value={newPortData.country}
                  onChange={handleInputChange}
                  placeholder="Enter country"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Country Code" style={{ marginBottom: 16 }}>
                <Input
                  name="country_code"
                  value={newPortData.country_code}
                  onChange={handleInputChange}
                  placeholder="Enter country code"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="City" style={{ marginBottom: 16 }}>
                <Input
                  name="city"
                  value={newPortData.city}
                  onChange={handleInputChange}
                  placeholder="Enter city"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="State/Province" style={{ marginBottom: 16 }}>
                <Input
                  name="state_name"
                  value={newPortData.state_name}
                  onChange={handleInputChange}
                  placeholder="Enter state/province"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Region" style={{ marginBottom: 16 }}>
                <Input
                  name="region"
                  value={newPortData.region}
                  onChange={handleInputChange}
                  placeholder="Enter region"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Address" style={{ marginBottom: 16 }}>
                <Input
                  name="address"
                  value={newPortData.address}
                  onChange={handleInputChange}
                  placeholder="Enter address"
                />
              </Form.Item>
            </Col>
          </Row>
        </div>

        {/* Port Details */}
        <div style={{ marginBottom: 24 }}>
          <Text
            strong
            style={{
              fontSize: 14,
              color: "#4B5563",
              display: "block",
              marginBottom: 16,
            }}
          >
            Port Details
          </Text>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Port Type"
                required
                style={{ marginBottom: 16 }}
              >
                <Select
                  value={newPortData.type}
                  onChange={(value) => handleSelectChange(value, "type")}
                  style={{ width: "100%" }}
                >
                  <Option value="sea_port">Sea Port</Option>
                  <Option value="inland_port">Inland Port</Option>
                  <Option value="air_port">Air Port</Option>
                  <Option value="address">Address</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="Latitude" style={{ marginBottom: 16 }}>
                <Input
                  type="number"
                  name="latitude"
                  step="0.000001"
                  value={newPortData.lat_lon?.latitude}
                  onChange={handleInputChange}
                  placeholder="Enter latitude"
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="Longitude" style={{ marginBottom: 16 }}>
                <Input
                  type="number"
                  name="longitude"
                  step="0.000001"
                  value={newPortData.lat_lon?.longitude}
                  onChange={handleInputChange}
                  placeholder="Enter longitude"
                />
              </Form.Item>
            </Col>
          </Row>
        </div>

        {/* Contact Information */}
        <div style={{ marginBottom: 24 }}>
          <Text
            strong
            style={{
              fontSize: 14,
              color: "#4B5563",
              display: "block",
              marginBottom: 16,
            }}
          >
            Contact Information
          </Text>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Telephone" style={{ marginBottom: 16 }}>
                <Input
                  name="telephone_number"
                  value={newPortData.telephone_number}
                  onChange={handleInputChange}
                  placeholder="Enter telephone number"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Fax" style={{ marginBottom: 16 }}>
                <Input
                  name="fax_number"
                  value={newPortData.fax_number}
                  onChange={handleInputChange}
                  placeholder="Enter fax number"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Website" style={{ marginBottom: 16 }}>
                <Input
                  name="website"
                  value={newPortData.website}
                  onChange={handleInputChange}
                  placeholder="Enter website URL"
                />
              </Form.Item>
            </Col>
          </Row>
        </div>

        {/* Additional Information */}
        <div style={{ marginBottom: 24 }}>
          <Text
            strong
            style={{
              fontSize: 14,
              color: "#4B5563",
              display: "block",
              marginBottom: 16,
            }}
          >
            Additional Information
          </Text>
          <Form.Item label="Description" style={{ marginBottom: 16 }}>
            <TextArea
              rows={3}
              name="description"
              value={newPortData.description}
              onChange={handleInputChange}
              placeholder="Enter port description"
            />
          </Form.Item>
          <Flex gap="large">
            <Checkbox
              checked={newPortData.is_head_port}
              onChange={(e) =>
                handleCheckboxChange("is_head_port", e.target.checked)
              }
            >
              <Text style={{ fontSize: 14 }}>Head Port</Text>
            </Checkbox>
            <Checkbox
              checked={newPortData.master_port}
              onChange={(e) =>
                handleCheckboxChange("master_port", e.target.checked)
              }
            >
              <Text style={{ fontSize: 14 }}>Master Port</Text>
            </Checkbox>
          </Flex>
        </div>

        <div
          style={{ display: "flex", justifyContent: "flex-end", marginTop: 24 }}
        >
          <Button
            type="primary"
            htmlType="submit"
            icon={<PlusOutlined />}
            size="large"
            style={{
              borderRadius: 8,
              boxShadow: "0 2px 0 rgba(0,0,0,0.02)",
            }}
          >
            Create Port
          </Button>
        </div>
      </Form>
    </Card>
  );
};

export default CreateNewPort;
