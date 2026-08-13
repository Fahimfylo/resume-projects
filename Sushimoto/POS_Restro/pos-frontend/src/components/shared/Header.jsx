import { FaSearch, FaUserCircle, FaBell } from "react-icons/fa";
import logo from "../../assets/images/logo.png";
import { useDispatch, useSelector } from "react-redux";
import { IoLogOut } from "react-icons/io5";
import { useMutation } from "@tanstack/react-query";
import { logout } from "../../https";
import { removeUser } from "../../redux/slices/userSlice";
import { useNavigate } from "react-router-dom";
import { MdDashboard } from "react-icons/md";

const Header = () => {
  const userData = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const logoutMutation = useMutation({
    mutationFn: () => logout(),
    onSuccess: () => {
      dispatch(removeUser());
      navigate("/auth");
    },
    onError: (error) => {
      console.log(error);
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <header className="flex justify-between items-center py-3 px-8 bg-white/90 backdrop-blur-md border-b border-border sticky top-0 z-50">
      {/* LOGO */}
      <div onClick={() => navigate("/")} className="flex items-center gap-2 cursor-pointer">
        <img src={logo} className="h-9 w-9" alt="restro logo" />
        <h1 className="text-xl font-heading font-bold text-secondary tracking-wide">
          <span className="text-primary">Sushi</span>moto
        </h1>
      </div>

      {/* SEARCH */}
      <div className="flex items-center gap-3 bg-white border border-border rounded-full px-5 py-2 w-[400px] shadow-sm">
        <FaSearch className="text-muted-foreground text-sm" />
        <input
          type="text"
          placeholder="Search"
          className="bg-transparent outline-none text-secondary font-body text-sm w-full"
        />
      </div>

      {/* USER DETAILS */}
      <div className="flex items-center gap-3">
        {["superadmin", "admin", "manager", "chef", "cashier", "waiter", "delivery"].includes(userData.role?.toLowerCase()) && (
          <div
            onClick={() => navigate("/dashboard")}
            className="bg-white border border-border rounded-full p-2.5 cursor-pointer shadow-sm hover:bg-muted transition-colors"
          >
            <MdDashboard className="text-secondary text-xl" />
          </div>
        )}
        <div className="bg-white border border-border rounded-full p-2.5 cursor-pointer shadow-sm hover:bg-muted transition-colors">
          <FaBell className="text-secondary text-xl" />
        </div>
        <div className="flex items-center gap-3 cursor-pointer bg-white border border-border rounded-full pl-2 pr-4 py-1.5 shadow-sm hover:bg-muted transition-colors">
          <FaUserCircle className="text-primary text-3xl" />
          <div className="flex flex-col items-start leading-tight">
            <h1 className="text-sm font-body font-semibold text-secondary">
              {userData.name || "User"}
            </h1>
            <p className="text-xs text-muted-foreground font-body capitalize">
              {userData.role || "Role"}
            </p>
          </div>
          <IoLogOut
            onClick={handleLogout}
            className="text-muted-foreground hover:text-primary transition-colors ml-1"
            size={22}
          />
        </div>
      </div>
    </header>
  );
};

export default Header;
