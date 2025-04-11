import { Layout, Button, Avatar, Flex } from "antd";
import { SettingOutlined } from "@ant-design/icons";
import logo from "../assets/logo.png";

const { Header } = Layout;

const NavBar = () => {
  return (
    <Header
      style={{
        background: "#fff",
        padding: "0 24px",
        height: 60,
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
      }}
    >
      <Flex align="center" justify="space-between" style={{ height: "100%" }}>
        <div>
          <img src={logo} alt="GoComet Logo" style={{ height: 32 }} />
        </div>
        <Flex gap="middle" align="center">
          <Button type="text" icon={<SettingOutlined />} shape="circle" />
          <Avatar
            style={{
              backgroundColor: "#1677ff",
              fontSize: "14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            Go
          </Avatar>
        </Flex>
      </Flex>
    </Header>
  );
};

export default NavBar;
