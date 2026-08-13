
import useFastSpringGateway from "./FastSpring";

const FastspringGateway = ({
  email,
  firstName,
  lastName,
  items = [],
  label = "Checkout",
  className = "",
}) => {
  const { pushToFastSpring } = useFastSpringGateway();

  const handleClick = () => {
    if (!items.length) {
      // console.warn("FastspringGateway: no items provided.");
      return;
    }
    pushToFastSpring(email, firstName, lastName, items);
  };

  return (
    <button
      className={`px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-700 disabled:opacity-50 ${className}`}
      onClick={handleClick}
      disabled={!items.length}
    >
      {label}
    </button>
  );
};

export default FastspringGateway;
