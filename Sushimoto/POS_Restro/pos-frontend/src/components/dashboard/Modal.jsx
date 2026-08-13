import { useState } from "react";
import { motion } from "framer-motion";
import { IoMdClose } from "react-icons/io";
import { useMutation } from "@tanstack/react-query";
import { addTable } from "../../https";
import { enqueueSnackbar } from "notistack";

const Modal = ({ setIsTableModalOpen }) => {
  const [tableData, setTableData] = useState({ tableNo: "", seats: "" });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTableData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    tableMutation.mutate(tableData);
  };

  const tableMutation = useMutation({
    mutationFn: (reqData) => addTable(reqData),
    onSuccess: (res) => {
      setIsTableModalOpen(false);
      enqueueSnackbar(res.data.message, { variant: "success" });
    },
    onError: (error) => {
      enqueueSnackbar(error.response?.data?.message || "Failed to add table", {
        variant: "error",
      });
    },
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="bg-white p-6 rounded-xl shadow-lg w-96 border border-border"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-secondary text-xl font-heading font-semibold">Add Table</h2>
          <button
            onClick={() => setIsTableModalOpen(false)}
            className="text-muted-foreground hover:text-secondary transition-colors"
          >
            <IoMdClose size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          <div>
            <label className="block text-muted-foreground mb-1.5 text-sm font-body">Table Number</label>
            <input
              type="number"
              name="tableNo"
              value={tableData.tableNo}
              onChange={handleInputChange}
              className="w-full border border-border rounded-lg px-4 py-2.5 bg-white text-secondary font-body focus:outline-none focus:ring-2 focus:ring-ring"
              required
            />
          </div>
          <div>
            <label className="block text-muted-foreground mb-1.5 text-sm font-body">Number of Seats</label>
            <input
              type="number"
              name="seats"
              value={tableData.seats}
              onChange={handleInputChange}
              className="w-full border border-border rounded-lg px-4 py-2.5 bg-white text-secondary font-body focus:outline-none focus:ring-2 focus:ring-ring"
              required
            />
          </div>

          <button
            type="submit"
            disabled={tableMutation.isPending}
            className="w-full rounded-full mt-4 py-3 text-base font-body font-semibold bg-primary text-white hover:bg-primary-dark transition-colors shadow-sm disabled:opacity-60"
          >
            {tableMutation.isPending ? "Adding..." : "Add Table"}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default Modal;
