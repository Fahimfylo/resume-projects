// LoadingSpinner.js
import FadeLoader from "react-spinners/FadeLoader";

const LoadingSpinner = ({ isLoading }) => (
  <div className="fixed top-0 left-0 z-50 flex items-center justify-center w-screen h-screen bg-white bg-opacity-50 overlay">
    <FadeLoader
      size={100}
      color={"#123abc"}
      loading={isLoading}
      aria-label="Loading Spinner"
    />
  </div>
);

export default LoadingSpinner;
