import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { toast } from "react-toastify";
import useStore from "../../store/store";

const CreateNewProperty = () => {
  const contentRef = useRef(null);
  const [shouldRender, setShouldRender] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const { isCreateNewPropertyVisible, setCreateNewPropertyVisible } =
    useStore();

  const [propertyName, setPropertyName] = useState("");

  const handleCreateProperty = () => {
    if (!propertyName.trim()) {
      toast.error("Please enter a property name.");
      return;
    }

    // TODO: Hook up backend API to create a real property.
    toast.success(`Property "${propertyName}" created.`);
    setPropertyName("");
    setCreateNewPropertyVisible(false);
  };

  useEffect(() => {
    let timeoutId;

    if (isCreateNewPropertyVisible) {
      setShouldRender(true);
      timeoutId = setTimeout(() => {
        setIsAnimating(true);
      }, 100); // Delay before animation starts
    } else {
      setIsAnimating(false);
      timeoutId = setTimeout(() => {
        setShouldRender(false);
      }, 300); // Match this duration with the CSS transition time
    }

    return () => clearTimeout(timeoutId);
  }, [isCreateNewPropertyVisible]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (contentRef.current && !contentRef.current.contains(event.target)) {
        setCreateNewPropertyVisible(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [setCreateNewPropertyVisible]);

  if (!shouldRender) return null;

  return (
    <section className="fixed top-0 right-0 h-screen w-full z-50 bg-black bg-opacity-45">
      <div
        ref={contentRef}
        className={`absolute right-0 top-0 h-full w-[420px] bg-white shadow-lg transition-transform duration-300 transform ${
          isAnimating ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full transition-transform duration-300 transform">
          <div className="bg-blue-600 text-white text-lg font-semibold px-6 py-3 flex items-center justify-between">
            <div>Create new property</div>
            <X
              onClick={() => setCreateNewPropertyVisible(false)}
              className="text-xl cursor-pointer"
            />
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="mb-4">
              <div className="bg-gray-100 p-4 rounded-md">
                <div className="flex justify-between text-sm text-gray-800 mb-1">
                  <div className="font-semibold">Step 1</div>
                  <div className="text-gray-500">Basic information</div>
                </div>
              </div>
            </div>

            {/* Repeat for other fields */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-semibold mb-2">
                Object Type*
              </label>
              <div className="relative">
                <select className="block appearance-none w-full bg-white border border-gray-300 text-gray-700 py-2 px-4 pr-8 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500">
                  <option>contact</option>
                  {/* Other options */}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg className="fill-current h-4 w-4" viewBox="0 0 20 20">
                    <path d="M7 10l5 5 5-5H7z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-semibold mb-2">
                Property name*
              </label>
              <input
                className="block w-full bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
                value={propertyName}
                onChange={(e) => setPropertyName(e.target.value)}
                placeholder="e.g. Company Size"
              />
            </div>

            {/* Other form fields */}
          </div>

          <div className="bg-gray-100 p-4 border-t border-gray-200 flex justify-between">
            <button
              onClick={() => setCreateNewPropertyVisible(false)}
              className="bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded"
            >
              Cancel
            </button>
            <button
              className="bg-blue-600 text-white font-semibold py-2 px-4 rounded"
              onClick={handleCreateProperty}
            >
              Create
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CreateNewProperty;
