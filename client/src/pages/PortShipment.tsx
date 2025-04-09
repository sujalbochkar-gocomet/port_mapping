import NavBar from "../components/NavBar";
import ShipmentsMain from "../components/Shipments-Main";
const Shipment = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <NavBar />
      <ShipmentsMain />
    </div>
  );
};

export default Shipment;
