import { useState } from "react";
import { register } from "../../https";
import { useMutation } from "@tanstack/react-query";
import { enqueueSnackbar } from "notistack";

const Register = ({ setIsRegister }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRoleSelection = (selectedRole) => {
    setFormData({ ...formData, role: selectedRole });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    registerMutation.mutate(formData);
  };

  const registerMutation = useMutation({
    mutationFn: (reqData) => register(reqData),
    onSuccess: (res) => {
      const { data } = res;
      enqueueSnackbar(data.message, { variant: "success" });
      setFormData({ name: "", email: "", phone: "", password: "", role: "" });
      setTimeout(() => {
        setIsRegister(false);
      }, 1500);
    },
    onError: (error) => {
      const { response } = error;
      enqueueSnackbar(response?.data?.message || "Registration failed", {
        variant: "error",
      });
    },
  });

  return (
    <form onSubmit={handleSubmit} data-aos="fade-up">
      <div className="space-y-3">
        {[
          { label: "Full Name", name: "name", type: "text", placeholder: "Enter your name" },
          { label: "Email", name: "email", type: "email", placeholder: "Enter your email" },
          { label: "Phone", name: "phone", type: "number", placeholder: "Enter your phone" },
          { label: "Password", name: "password", type: "password", placeholder: "Enter password" },
        ].map(({ label, name, type, placeholder }) => (
          <div key={name}>
            <label className="block text-muted-foreground mb-1 text-sm font-body font-medium">
              {label}
            </label>
            <input
              type={type}
              name={name}
              value={formData[name]}
              onChange={handleChange}
              placeholder={placeholder}
              className="w-full border border-border rounded-lg px-4 py-2.5 bg-white text-secondary font-body focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
              required
            />
          </div>
        ))}

        <div>
          <label className="block text-muted-foreground mb-2 text-sm font-body font-medium">
            Role
          </label>
          <div className="flex gap-3">
            {["Waiter", "Cashier", "Admin"].map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => handleRoleSelection(role)}
                className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-body font-medium border transition-all ${
                  formData.role === role
                    ? "bg-primary text-white border-primary shadow-sm"
                    : "bg-white text-muted-foreground border-border hover:border-primary hover:text-primary"
                }`}
              >
                {role}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={registerMutation.isPending}
        className="w-full rounded-full mt-8 py-3.5 text-base font-body font-semibold bg-primary text-white hover:bg-primary-dark transition-colors shadow-md disabled:opacity-60"
      >
        {registerMutation.isPending ? "Creating account..." : "Sign up"}
      </button>
    </form>
  );
};

export default Register;
