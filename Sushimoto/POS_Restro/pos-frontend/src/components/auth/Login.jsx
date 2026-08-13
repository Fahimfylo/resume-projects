import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { login } from "../../https/index";
import { enqueueSnackbar } from "notistack";
import { useDispatch } from "react-redux";
import { setUser } from "../../redux/slices/userSlice";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    loginMutation.mutate(formData);
  };

  const loginMutation = useMutation({
    mutationFn: (reqData) => login(reqData),
    onSuccess: (res) => {
      const { data } = res;
      const { _id, name, email, phone, role } = data.data;
      dispatch(setUser({ _id, name, email, phone, role }));
      enqueueSnackbar("Welcome back!", { variant: "success" });
      navigate("/");
    },
    onError: (error) => {
      const { response } = error;
      enqueueSnackbar(response?.data?.message || "Login failed", { variant: "error" });
    },
  });

  return (
    <form onSubmit={handleSubmit} data-aos="fade-up">
      <div className="space-y-4">
        <div>
          <label className="block text-muted-foreground mb-1.5 text-sm font-body font-medium">
            Email
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter your email"
            className="w-full border border-border rounded-lg px-4 py-3 bg-white text-secondary font-body focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
            required
          />
        </div>
        <div>
          <label className="block text-muted-foreground mb-1.5 text-sm font-body font-medium">
            Password
          </label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter your password"
            className="w-full border border-border rounded-lg px-4 py-3 bg-white text-secondary font-body focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
            required
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loginMutation.isPending}
        className="w-full rounded-full mt-8 py-3.5 text-base font-body font-semibold bg-primary text-white hover:bg-primary-dark transition-colors shadow-md disabled:opacity-60"
      >
        {loginMutation.isPending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
};

export default Login;
