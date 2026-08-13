import { IoArrowBackOutline } from "react-icons/io5";
import { useNavigate } from "react-router-dom";

const BackButton = () => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(-1)}
      className="bg-primary p-2.5 text-lg font-bold rounded-full text-white shadow-md hover:bg-primary-dark transition-colors"
    >
      <IoArrowBackOutline />
    </button>
  );
};

export default BackButton;
