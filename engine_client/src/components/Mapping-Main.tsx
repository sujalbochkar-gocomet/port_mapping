import MappingForm from "./Mapping-Form";
import ShipmentList from "./Mapping-ShipmentList";

const MappingMain = () => {
  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col gap-8">
            <MappingForm />
            <ShipmentList />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MappingMain;
