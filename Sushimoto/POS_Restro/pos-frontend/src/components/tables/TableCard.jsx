import { useNavigate } from "react-router-dom";
import { getAvatarName } from "../../utils";
import { useDispatch } from "react-redux";
import { updateTable } from "../../redux/slices/customerSlice";
import { FaLongArrowAltRight } from "react-icons/fa";
import { BiSolidDish } from "react-icons/bi";

const TableCard = ({ id, name, status, initials, seats }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const isBooked = status === "Booked";

  const handleClick = () => {
    if (isBooked) return;
    dispatch(updateTable({ table: { tableId: id, tableNo: name } }));
    navigate("/menu");
  };

  return (
    <div
      onClick={handleClick}
      className={`border rounded-xl p-5 cursor-pointer transition-all shadow-sm hover:shadow-md ${
        isBooked
          ? "bg-red-50 border-red-200 opacity-80"
          : "bg-white border-border hover:border-primary/30"
      } ${isBooked ? "cursor-default" : "hover:-translate-y-0.5"}`}
    >
      <div className="flex items-center justify-between">
        <h1 className="text-secondary text-lg font-heading font-semibold">
          Table <FaLongArrowAltRight className="text-muted-foreground inline mx-1" /> {name}
        </h1>
        <span
          className={`text-xs font-body font-medium px-3 py-1 rounded-full ${
            isBooked ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"
          }`}
        >
          {status}
        </span>
      </div>

      <div className="flex items-center justify-center mt-5 mb-6">
        <div
          className={`rounded-full w-16 h-16 flex items-center justify-center text-lg font-heading font-bold ${
            initials
              ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {isBooked ? (
            getAvatarName(initials)
          ) : (
            <BiSolidDish size={28} className="text-muted-foreground" />
          )}
        </div>
      </div>

      <p className="text-muted-foreground text-xs font-body text-center">
        Seats: <span className="text-secondary font-medium">{seats}</span>
      </p>
    </div>
  );
};

export default TableCard;
