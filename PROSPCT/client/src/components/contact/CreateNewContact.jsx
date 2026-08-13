import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import useStore from "../../store/store";

const CreateNewContact = () => {
  const { isCreateNewContactVisible, setCreateNewContactVisible } = useStore();
  const location = useLocation();
  const isCompanyPage = location.pathname.startsWith("/companies");

  const [formState, setFormState] = useState({
    firstName: "",
    lastName: "",
    email: "",
    contactInfo: "",
    linkedin: "",
    location: "",
    notes: "",
    postalCode: "",
    summary: "",
  });

  const sectionRef = useRef(null);
  const contentRef = useRef(null);
  const [shouldRender, setShouldRender] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    let timeoutId;

    if (isCreateNewContactVisible) {
      setShouldRender(true);
      timeoutId = setTimeout(() => {
        setIsAnimating(true);
      }, 100); // Start animation after a slight delay
    } else {
      setIsAnimating(false);
      timeoutId = setTimeout(() => {
        setShouldRender(false);
      }, 300); // Match this duration with the CSS transition time
    }

    return () => clearTimeout(timeoutId);
  }, [isCreateNewContactVisible]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (contentRef.current && !contentRef.current.contains(event.target)) {
        setCreateNewContactVisible(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [setCreateNewContactVisible]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreate = () => {
    const { firstName, lastName } = formState;
    if (!firstName.trim() || !lastName.trim()) {
      toast.error("First name and last name are required.");
      return;
    }

    // TODO: Wire up backend creation when endpoint is available.
    toast.success(`${isCompanyPage ? "Company" : "Contact"} created successfully.`);
    setCreateNewContactVisible(false);
  };

  if (!shouldRender) return null;

  return (
    <section
      ref={sectionRef}
      className={`fixed top-0 right-0 h-screen w-full z-50 bg-black bg-opacity-45`}
    >
      <div
        ref={contentRef}
        className={`absolute right-0 top-0 h-full w-[420px] bg-white shadow-lg transition-transform duration-300 transform ${
          isAnimating ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="bg-blue-600 text-white text-lg font-semibold px-6 py-3 flex items-center justify-between">
            <div>{isCompanyPage ? "Create Company" : "Create Contact"}</div>
            <X
              onClick={() => setCreateNewContactVisible(false)}
              className="text-xl cursor-pointer"
            />
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {/* First Name */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-semibold mb-2">
                First name*
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="firstName"
                  value={formState.firstName}
                  onChange={handleChange}
                  placeholder=""
                  className="block w-full bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
                />
              </div>
            </div>

            {/* Last Name */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-semibold mb-2">
                Last name*
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="lastName"
                  value={formState.lastName}
                  onChange={handleChange}
                  placeholder=""
                  className="block w-full bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
                />
              </div>
            </div>

            {/* Email */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-semibold mb-2">
                Email
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="email"
                  value={formState.email}
                  onChange={handleChange}
                  placeholder=""
                  className="block w-full bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
                />
              </div>
            </div>

            {/* Contact Info */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-semibold mb-2">
                Contact info
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="contactInfo"
                  value={formState.contactInfo}
                  onChange={handleChange}
                  placeholder=""
                  className="block w-full bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
                />
              </div>
            </div>

            {/* LinkedIn */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-semibold mb-2">
                LinkedIn
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="linkedin"
                  value={formState.linkedin}
                  onChange={handleChange}
                  placeholder=""
                  className="block w-full bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
                />
              </div>
            </div>

            {/* Location */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-semibold mb-2">
                Location
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="location"
                  value={formState.location}
                  onChange={handleChange}
                  placeholder=""
                  className="block w-full bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
                />
              </div>
            </div>

            {/* Notes */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-semibold mb-2">
                Notes
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="notes"
                  value={formState.notes}
                  onChange={handleChange}
                  placeholder=""
                  className="block w-full bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
                />
              </div>
            </div>

            {/* Postal Code */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-semibold mb-2">
                Postal code
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="postalCode"
                  value={formState.postalCode}
                  onChange={handleChange}
                  placeholder=""
                  className="block w-full bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
                />
              </div>
            </div>

            {/* Summary */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-semibold mb-2">
                Summary
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="summary"
                  value={formState.summary}
                  onChange={handleChange}
                  placeholder=""
                  className="block w-full bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-gray-100 p-4 border-t border-gray-200 flex justify-between">
            <button
              className="bg-blue-600 text-white font-semibold py-2 px-4 rounded"
              onClick={handleCreate}
            >
              Create {isCompanyPage ? "Company" : "Contact"}
            </button>
            <button
              onClick={() => setCreateNewContactVisible(false)}
              className="bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CreateNewContact;
