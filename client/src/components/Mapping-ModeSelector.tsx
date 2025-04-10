import { Radio, Flex, theme } from "antd";
import landIcon from "../assets/land.svg";
import airIcon from "../assets/air.svg";
import seaIcon from "../assets/sea.svg";
import addressIcon from "../assets/address.svg";

interface ModeSelectorProps {
  selectedMode: string;
  onModeSelect: (mode: string) => void;
}

const ModeSelector = ({ selectedMode, onModeSelect }: ModeSelectorProps) => {
  const { token } = theme.useToken();

  const modes = [
    { id: "sea_port", icon: seaIcon, label: "SEA" },
    { id: "air_port", icon: airIcon, label: "AIR" },
    { id: "inland_port", icon: landIcon, label: "LAND" },
    { id: "address", icon: addressIcon, label: "ADDRESS" },
  ];

  return (
    <Radio.Group
      value={selectedMode}
      onChange={(e) => onModeSelect(e.target.value)}
      style={{
        display: "flex",
        width: "100%",
        padding: 8,
        borderRadius: 8,
        backgroundColor: "#f9fafb",
      }}
    >
      {modes.map((mode) => (
        <Radio.Button
          key={mode.id}
          value={mode.id}
          style={{
            flex: 1,
            height: "auto",
            padding: 16,
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 8,
            margin: "0 4px",
            borderColor:
              selectedMode === mode.id ? token.colorPrimary : "transparent",
            backgroundColor: selectedMode === mode.id ? "#e6f4ff" : "white",
            boxShadow:
              selectedMode === mode.id ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
            borderWidth: selectedMode === mode.id ? 2 : 2,
          }}
        >
          <Flex vertical align="center" justify="center">
            <img
              src={mode.icon}
              alt={mode.label}
              style={{
                width: 32,
                height: 32,
                marginBottom: 8,
                filter:
                  selectedMode === mode.id
                    ? "invert(48%) sepia(79%) saturate(2476%) hue-rotate(200deg) brightness(118%) contrast(119%)"
                    : "brightness(0) opacity(0.5)",
              }}
            />
            <span
              style={{
                fontSize: 14,
                fontWeight: 600,
                color:
                  selectedMode === mode.id ? token.colorPrimary : "#4B5563",
              }}
            >
              {mode.label}
            </span>
          </Flex>
        </Radio.Button>
      ))}
    </Radio.Group>
  );
};

export default ModeSelector;
