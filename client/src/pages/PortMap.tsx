import MappingForm from "../components/Mapping-Form";
import NavBar from "../components/NavBar";
const PortMap = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <NavBar />
      <div className="max-w-7xl mx-auto p-8">
        <MappingForm />
      </div>
    </div>
  );
};

export default PortMap;
