import React, { useEffect } from "react";

const HeleketCard = ({ isOpen, onClose, checkoutUrl }) => {
  useEffect(() => {
    if (isOpen) {
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    onClose();
    // Optional: reload page after closing Heleket modal
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-[99999] bg-transparent overflow-hidden">
      {/* Close Button */}
      <div
        className="absolute top-5 right-8 h-12 w-12 bg-black/35 cursor-pointer flex items-center justify-center z-10"
        onClick={handleClose}
      >
        <img
          src="data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgNTEyIDUxMiIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiBlbmFibGUtYmFja2dyb3VuZD0ibmV3IDAgMCA1MTIgNTEyIj48cGF0aCBkPSJNNDQzLjYgMzg3LjEgMzEyLjQgMjU1LjRsMTMxLjUtMTMwYzUuNC01LjQgNS40LTE0LjIgMC0xOS42bC0zNy40LTM3LjZjLTIuNi0yLjYtNi4xLTQtOS44LTQtMy43IDAtNy4yIDEuNS05LjggNEwyNTYgMTk3LjggMTI0LjkgNjguM2MtMi42LTIuNi02LjEtNC05LjgtNC0zLjcgMC03LjIgMS41LTkuOCA0TDY4IDEwNS45Yy01LjQgNS40LTUuNCAxNC4yIDAgMTkuNmwxMzEuNSAxMzBMNjguNCAzODcuMWMtMi42IDIuNi00LjEgNi4xLTQuMSA5LjggMCAzLjcgMS40IDcuMiA0LjEgOS44bDM3LjQgMzcuNmMyLjcgMi43IDYuMiA0LjEgOS44IDQuMSAzLjUgMCA3LjEtMS4zIDkuOC00LjFMMjU2IDMxMy4xbDEzMC43IDEzMS4xYzIuNyAyLjcgNi4yIDQuMSA5LjggNC4xIDMuNSAwIDcuMS0xLjMgOS44LTQuMWwzNy40LTM3LjZjMi42LTIuNiA0LjEtNi4xIDQuMS05LjgtLjEtMy42LTEuNi03LjEtNC4yLTkuN3oiIGZpbGw9IiNmZmZmZmYiIGNsYXNzPSJmaWxsLTAwMDAwMCI+PC9wYXRoPjwvc3ZnPg=="
          alt="Close"
          className="w-6 h-6"
        />
      </div>

      {/* Loader */}
      <div className="absolute z-10 -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2">
        <div className="w-12 h-12 border-4 border-black rounded-full border-b-transparent animate-spin" />
      </div>

      {/* Heleket Checkout iframe */}
      <div className="w-full h-full">
        <iframe
          src={checkoutUrl}
          className="w-full h-full border-0"
          frameBorder="0"
          onLoad={(e) => {
            // Hide loader when iframe loads
            e.target.parentElement.parentElement.querySelector(
              "div:nth-child(2)",
            ).style.display = "none";
          }}
          style={{
            height: "100vh",
            width: "100vw",
            overflow: "hidden",
          }}
        />
      </div>
    </div>
  );
};

export default HeleketCard;
