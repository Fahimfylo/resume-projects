import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import BottomNav from "../components/shared/BottomNav";
import BackButton from "../components/shared/BackButton";
import TableCard from "../components/tables/TableCard";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getTables } from "../https";
import { enqueueSnackbar } from "notistack";

const Tables = () => {
  const [status, setStatus] = useState("all");
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/dashboard");

  useEffect(() => {
    document.title = "Sushimoto | Tables";
  }, []);

  const { data: resData, isError } = useQuery({
    queryKey: ["tables"],
    queryFn: async () => getTables(),
    placeholderData: keepPreviousData,
  });

  if (isError) {
    enqueueSnackbar("Something went wrong!", { variant: "error" });
  }

  const filteredTables =
    status === "all"
      ? resData?.data?.data || []
      : (resData?.data?.data || []).filter(
          (t) => t.status.toLowerCase() === status
        );

  return (
    <section className="h-[calc(100vh-5rem)] overflow-hidden pb-20">
      <div className="flex items-center justify-between px-8 py-4" data-aos="fade-down">
        <div className="flex items-center gap-4">
          <BackButton />
          <h1 className="text-secondary text-2xl font-heading font-bold">Tables</h1>
        </div>
        <div className="flex items-center gap-2">
          {[
            { key: "all", label: "All" },
            { key: "booked", label: "Booked" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setStatus(key)}
              className={`font-body text-sm font-medium px-5 py-2 rounded-full transition-all ${
                status === key
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted-foreground hover:text-secondary bg-white border border-border"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 px-8 py-2 max-h-[calc(100vh-200px)] overflow-y-scroll custom-scrollbar">
        {filteredTables.length > 0 ? (
          filteredTables.map((table) => (
            <div key={table._id} data-aos="fade-up">
              <TableCard
                id={table._id}
                name={table.tableNo}
                status={table.status}
                initials={table?.currentOrder?.customerDetails?.name}
                seats={table.seats}
              />
            </div>
          ))
        ) : (
          <p className="col-span-4 text-muted-foreground font-body text-center py-16">
            No tables available
          </p>
        )}
      </div>

      {!isAdmin && <BottomNav />}
    </section>
  );
};

export default Tables;
