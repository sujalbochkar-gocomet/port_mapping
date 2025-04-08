import landIcon from "../assets/land.svg";
import airIcon from "../assets/air.svg";
import seaIcon from "../assets/sea.svg";

interface ModeSelectorProps {
  selectedMode: string;
  onModeSelect: (mode: string) => void;
}

const ModeSelector = ({ selectedMode, onModeSelect }: ModeSelectorProps) => {
  const modes = [
    { id: "sea_port", icon: seaIcon, label: "SEA" },
    { id: "air_port", icon: airIcon, label: "AIR" },
    { id: "inland_port", icon: landIcon, label: "LAND" },
  ];

  return (
    <div className="flex gap-2 w-full bg-gray-50 p-2 rounded-lg">
      {modes.map((mode) => (
        <button
          key={mode.id}
          onClick={() => onModeSelect(mode.id)}
          className={`flex-1 flex flex-col items-center justify-center p-4 rounded-lg transition-all duration-200 ${
            selectedMode === mode.id
              ? "bg-blue-100 border-2 border-blue-500 shadow-md"
              : "bg-white border-2 border-transparent hover:bg-gray-50"
          }`}
        >
          <img
            src={mode.icon}
            alt={mode.label}
            className={`w-8 h-8 mb-2 ${
              selectedMode === mode.id
                ? "[filter:invert(48%)_sepia(79%)_saturate(2476%)_hue-rotate(200deg)_brightness(118%)_contrast(119%)]"
                : "brightness-0 opacity-50"
            }`}
          />
          <span
            className={`text-sm font-semibold ${
              selectedMode === mode.id ? "text-blue-500" : "text-gray-600"
            }`}
          >
            {mode.label}
          </span>
        </button>
      ))}
    </div>
  );
};

export default ModeSelector; 