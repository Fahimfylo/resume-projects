import { useState, useEffect } from "react";
import { useSelector } from "react-redux";

const Greetings = () => {
  const userData = useSelector((state) => state.user);
  const [dateTime, setDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const h = dateTime.getHours();
    if (h < 12) return "Good Morning";
    if (h < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "2-digit",
      year: "numeric",
    });
  };

  const formatTime = (date) =>
    date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

  return (
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-secondary text-2xl font-heading font-bold">
          {getGreeting()}, {userData.name || "User"}
        </h1>
        <p className="text-muted-foreground text-sm font-body mt-1">
          Give your best service to customers
        </p>
      </div>
      <div className="text-right">
        <h1 className="text-secondary text-3xl font-heading font-bold tracking-wide">
          {formatTime(dateTime)}
        </h1>
        <p className="text-muted-foreground text-sm font-body">{formatDate(dateTime)}</p>
      </div>
    </div>
  );
};

export default Greetings;
