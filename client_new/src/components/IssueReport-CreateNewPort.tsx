import { useState } from "react";
import { FiPlus, FiX } from "react-icons/fi";
import { toast } from "react-toastify";

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

  const handleCreatePort = async (e: React.FormEvent) => {
    e.preventDefault();

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
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center gap-2 mb-6">
        <h2 className="text-lg font-medium text-gray-800">
          Create New Port for "{keyword}"
        </h2>
        <FiPlus className="w-5 h-5 text-blue-600" />
      </div>

      <form onSubmit={handleCreatePort} className="space-y-6">
        {/* Basic Information */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-4">
            Basic Information
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Port Name *
              </label>
              <input
                type="text"
                name="name"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                value={newPortData.name}
                onChange={handleInputChange}
                placeholder="Enter port name"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Port Code *
              </label>
              <input
                type="text"
                name="code"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                value={newPortData.code}
                onChange={handleInputChange}
                placeholder="Enter port code"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Display Name
              </label>
              <input
                type="text"
                name="display_name"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                value={newPortData.display_name}
                onChange={handleInputChange}
                placeholder="Enter display name"
              />
            </div>
            <div className="space-y-2 col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Other Names
              </label>
              <div className="space-y-2">
                <input
                  type="text"
                  value={otherNameInput}
                  onChange={(e) => setOtherNameInput(e.target.value)}
                  onKeyDown={handleAddOtherName}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="Type and press Enter to add other names"
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {newPortData.other_names?.map((name, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded-lg"
                    >
                      <span className="text-sm">{name}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveOtherName(index)}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        <FiX className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Location Information */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-4">
            Location Details
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Country *
              </label>
              <input
                type="text"
                name="country"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                value={newPortData.country}
                onChange={handleInputChange}
                placeholder="Enter country"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Country Code
              </label>
              <input
                type="text"
                name="country_code"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                value={newPortData.country_code}
                onChange={handleInputChange}
                placeholder="Enter country code"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                City
              </label>
              <input
                type="text"
                name="city"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                value={newPortData.city}
                onChange={handleInputChange}
                placeholder="Enter city"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                State/Province
              </label>
              <input
                type="text"
                name="state_name"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                value={newPortData.state_name}
                onChange={handleInputChange}
                placeholder="Enter state/province"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Region
              </label>
              <input
                type="text"
                name="region"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                value={newPortData.region}
                onChange={handleInputChange}
                placeholder="Enter region"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Address
              </label>
              <input
                type="text"
                name="address"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                value={newPortData.address}
                onChange={handleInputChange}
                placeholder="Enter address"
              />
            </div>
          </div>
        </div>

        {/* Port Details */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-4">
            Port Details
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Port Type *
              </label>
              <select
                name="type"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                value={newPortData.type}
                onChange={handleInputChange}
              >
                <option value="sea_port">Sea Port</option>
                <option value="inland_port">Inland Port</option>
                <option value="air_port">Air Port</option>
                <option value="address">Address</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Latitude
                </label>
                <input
                  type="number"
                  name="latitude"
                  step="0.000001"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  value={newPortData.lat_lon?.latitude}
                  onChange={handleInputChange}
                  placeholder="Enter latitude"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Longitude
                </label>
                <input
                  type="number"
                  name="longitude"
                  step="0.000001"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  value={newPortData.lat_lon?.longitude}
                  onChange={handleInputChange}
                  placeholder="Enter longitude"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-4">
            Contact Information
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Telephone
              </label>
              <input
                type="tel"
                name="telephone_number"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                value={newPortData.telephone_number}
                onChange={handleInputChange}
                placeholder="Enter telephone number"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Fax
              </label>
              <input
                type="tel"
                name="fax_number"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                value={newPortData.fax_number}
                onChange={handleInputChange}
                placeholder="Enter fax number"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Website
              </label>
              <input
                type="url"
                name="website"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                value={newPortData.website}
                onChange={handleInputChange}
                placeholder="Enter website URL"
              />
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-4">
            Additional Information
          </h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                name="description"
                rows={3}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                value={newPortData.description}
                onChange={handleInputChange}
                placeholder="Enter port description"
              />
            </div>
            <div className="flex gap-6">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="is_head_port"
                  checked={newPortData.is_head_port}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Head Port</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="master_port"
                  checked={newPortData.master_port}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Master Port</span>
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium"
          >
            <FiPlus className="w-4 h-4" />
            Create Port
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateNewPort;
