import { useState } from "react";
import { FaHome } from "react-icons/fa";
import { MdOutlineReorder, MdTableBar } from "react-icons/md";
import { CiCircleMore } from "react-icons/ci";
import { BiSolidDish } from "react-icons/bi";
import { useNavigate, useLocation } from "react-router-dom";
import Modal from "./Modal";
import { useDispatch } from "react-redux";
import { setCustomer } from "../../redux/slices/customerSlice";

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [guestCount, setGuestCount] = useState(0);
  const [name, setName] = useState();
  const [phone, setPhone] = useState();

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const increment = () => {
    if (guestCount >= 6) return;
    setGuestCount((prev) => prev + 1);
  };
  const decrement = () => {
    if (guestCount <= 0) return;
    setGuestCount((prev) => prev - 1);
  };

  const isActive = (path) => location.pathname === path;

  const handleCreateOrder = () => {
    dispatch(setCustomer({ name, phone, guests: guestCount }));
    navigate("/tables");
  };

  return (
    <div
      data-aos="fade-up"
      className="fixed bottom-0 left-0 right-0 max-w-7xl mx-auto bg-white/90 backdrop-blur-md border-t border-border h-16 flex justify-around items-center px-4 z-40"
    >
      {[
        { path: "/", icon: <FaHome size={18} />, label: "Home" },
        { path: "/orders", icon: <MdOutlineReorder size={20} />, label: "Orders" },
        { path: "/tables", icon: <MdTableBar size={20} />, label: "Tables" },
        { path: "#", icon: <CiCircleMore size={20} />, label: "More" },
      ].map(({ path, icon, label }) => (
        <button
          key={label}
          onClick={() => path !== "#" && navigate(path)}
          className={`flex items-center justify-center gap-1.5 font-body text-sm font-medium px-5 py-2 rounded-full transition-all ${
            isActive(path)
              ? "text-white bg-primary shadow-md"
              : "text-muted-foreground hover:text-secondary"
          }`}
        >
          {icon} {label}
        </button>
      ))}

      <button
        disabled={isActive("/tables") || isActive("/menu")}
        onClick={openModal}
        className="absolute -top-6 bg-primary text-white rounded-full p-3.5 shadow-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
      >
        <BiSolidDish size={28} />
      </button>

      <Modal isOpen={isModalOpen} onClose={closeModal} title="New Order">
        <div className="space-y-4">
          <div>
            <label className="block text-muted-foreground mb-1.5 text-sm font-body">Customer Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              type="text"
              placeholder="Enter customer name"
              className="w-full border border-border rounded-lg px-4 py-2.5 bg-white text-secondary font-body focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-muted-foreground mb-1.5 text-sm font-body">Phone</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              type="number"
              placeholder="+1-999-999-9999"
              className="w-full border border-border rounded-lg px-4 py-2.5 bg-white text-secondary font-body focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-muted-foreground mb-1.5 text-sm font-body">Guests</label>
            <div className="flex items-center justify-between border border-border rounded-lg px-4 py-2.5 bg-white">
              <button onClick={decrement} className="text-primary text-2xl font-bold hover:text-primary-dark transition-colors">
                &minus;
              </button>
              <span className="text-secondary font-body font-medium">{guestCount} Person</span>
              <button onClick={increment} className="text-primary text-2xl font-bold hover:text-primary-dark transition-colors">
                &#43;
              </button>
            </div>
          </div>
          <button
            onClick={handleCreateOrder}
            className="w-full bg-primary text-white font-body font-semibold rounded-full py-3 mt-2 hover:bg-primary-dark transition-colors shadow-md"
          >
            Create Order
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default BottomNav;
