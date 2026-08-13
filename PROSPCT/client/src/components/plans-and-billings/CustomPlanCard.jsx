import { FaCircleChevronRight } from "react-icons/fa6";
import { useState } from "react";
import CustomPlanModal from "./CustomPlanModal";

function CustomPlanCard() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="w-[calc(100%-60px)] mx-auto py-5">
        <div className="w-full flex flex-wrap justify-between items-center p-5 bg-white border border-gray-200 rounded-lg shadow-md">
          <div>
            {/* Header */}
            <div className="flex flex-col items-start space-y-2">
              <h3 className="text-2xl font-semibold text-blue-600">
                Custom Plans
              </h3>
              <p className="text-sm text-gray-500">
                Tailored for your specific needs
              </p>
            </div>

            {/* Plan Details */}
            <div className="mt-4 space-y-2">
              <div className="flex items-center">
                <FaCircleChevronRight className="text-blue-600" />
                <p className="ml-2 text-sm text-gray-700">
                  Custom Emails Credits
                </p>
              </div>
              <div className="flex items-center">
                <FaCircleChevronRight className="text-blue-600" />
                <p className="ml-2 text-sm text-gray-700">Custom Phone Credits</p>
              </div>
              <div className="flex items-center">
                <FaCircleChevronRight className="text-blue-600" />
                <p className="ml-2 text-sm text-gray-700">
                  Custom email verification credits
                </p>
              </div>
            </div>
          </div>

          {/* Contact Button */}
          <div className="mt-6 flex flex-wrap justify-end items-end flex-col w-full md:w-1/2 space-y-5">
            <h3 className="text-gray-700 text-xl font-semibold text-end text-balance">
              If you are not satisfied with our plan or not meeting your needs
              then contact us
            </h3>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="package-subscribe-btn bg-blue-600 text-white rounded-sm px-10 py-2.5 text-sm font-semibold hover:bg-blue-700 transition flex justify-center"
            >
              Contact Us
            </button>
          </div>
        </div>
      </div>
      <CustomPlanModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}

export default CustomPlanCard;
