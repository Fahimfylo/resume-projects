import { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import ClipLoader from "react-spinners/ClipLoader";
import { toast } from "react-toastify";
import useCreditDeduction from "../../hooks/useCreditDeduction";
import API_CONFIG from "../../utils/apiConstant";

const BASE_URL = API_CONFIG.API_ENDPOINT;

function SingleVerification() {
  const { deductCredit } = useCreditDeduction();

  const [emailInput, setEmailInput] = useState("");
  const [verifiedEmails, setVerifiedEmails] = useState([]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const PER_PAGE = 5;
  const pageCount = Math.ceil(verifiedEmails.length / PER_PAGE);
  const startIndex = (currentPage - 1) * PER_PAGE;
  const paginatedEmails = verifiedEmails.slice(startIndex, startIndex + PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [verifiedEmails.length]);

  // Limit the email list to 20
  const emailList = emailInput
    .split(/[\s,;]+/)
    .filter((email) => email.length > 0)
    .slice(0, 20); // Limit to the first 20 emails

  // Handle input change
  const handleInputChange = (e) => {
    const inputEmails = e.target.value.split(/[\s,;]+/);
    if (inputEmails.length <= 20) {
      setEmailInput(e.target.value);
    } else {
      // Optional: Provide feedback to the user if they exceed the 20 email limit
      alert("You can only verify a maximum of 20 emails at a time.");
    }
  };

  const getStatusAndClass = (status) => {
    switch (status) {
      case "1":
        return {
          label: "Syntax",
          className: "bg-blue-50 text-blue-700 border-blue-200",
        };
      case "2":
        return {
          label: "Spam",
          className: "bg-amber-50 text-amber-700 border-amber-200",
        };
      case "3":
        return {
          label: "Disposable",
          className: "bg-purple-50 text-purple-700 border-purple-200",
        };
      case "4":
        return {
          label: "Accept-All",
          className: "bg-indigo-50 text-indigo-700 border-indigo-200",
        };
      case "5":
        return {
          label: "Valid",
          className: "bg-emerald-50 text-emerald-700 border-emerald-200",
        };
      case "6":
        return {
          label: "Invalid",
          className: "bg-rose-50 text-rose-700 border-rose-200",
        };
      case "7":
        return {
          label: "Unknown",
          className: "bg-gray-50 text-gray-600 border-gray-200",
        };
      case "8":
        return {
          label: "Role",
          className: "bg-pink-50 text-pink-700 border-pink-200",
        };
      default:
        return {
          label: "Unknown",
          className: "bg-gray-50 text-gray-600 border-gray-200",
        };
    }
  };

  // Handle the verification process
  const handleVerifyEmails = async (e) => {
    e.preventDefault();

    if (emailList.length === 0) {
      toast.error("Please enter at least one email to verify");
      return;
    }

    setIsVerifying(true);
    const verificationDate = new Date().toLocaleString();

    toast.info(`Verifying ${emailList.length} email(s)...`);

    // Immediately show emails with "Loading..." status
    const newVerificationEntries = emailList.map((email) => ({
      email,
      status: "loading", // Set status to loading
      date: verificationDate, // Unique timestamp for each batch
    }));

    setVerifiedEmails((prev) =>
      [...prev, ...newVerificationEntries].sort(
        (a, b) => new Date(b.date) - new Date(a.date),
      ),
    );

    try {
      const token =
        Cookies.get("userAccessToken") ||
        localStorage.getItem("userAccessToken");

      const response = await axios.post(
        `${BASE_URL}/api/email-verify/single`,
        { emailList: emailList },
        {
          headers: {
            accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.status === 200) {
        const verificationResults = response.data.results;

        // Deduct credits (error toast handled by hook if insufficient)
        try {
          await deductCredit({
            type: "verification",
            quantity: verificationResults.length,
          });
        } catch (error) {
          // Error is already handled by useCreditDeduction
          throw error;
        }

        // Update only the emails from the current batch using timestamp
        setVerifiedEmails((prev) =>
          prev.map((item) => {
            const result = verificationResults.find(
              (res) =>
                res.email === item.email &&
                item.status === "loading" && // Check if it's still loading
                item.date === verificationDate, // Ensure only current batch is updated
            );

            if (result) {
              return { ...item, status: result.status };
            }
            return item;
          }),
        );

        // Count results by status
        const validCount = verificationResults.filter(
          (r) => r.status === "5",
        ).length;
        const invalidCount = verificationResults.filter(
          (r) => r.status === "6",
        ).length;

        if (validCount > 0) {
          toast.success(`${validCount} email(s) are valid!`);
        }
        if (invalidCount > 0) {
          toast.error(`${invalidCount} email(s) are invalid`);
        }

        // Clear input after successful verification
        setEmailInput("");
      } else {
        toast.error("Failed to verify emails. Please try again.");
      }
    } catch (error) {
      // console.error("Error verifying emails:", error);
      toast.error(
        error.response?.data?.message ||
          "An error occurred during verification.",
      );

      // Remove loading entries on error
      setVerifiedEmails((prev) =>
        prev.filter((item) => item.date !== verificationDate),
      );
    } finally {
      setIsVerifying(false);
    }
  };

  // Function to generate CSV
  const handleExportCSV = () => {
    const csvHeader = "Email,Status,Date\n";
    const csvRows = verifiedEmails
      .map((email) => {
        const { label } = getStatusAndClass(email.status);
        return `${email.email},${label},${email.date}`;
      })
      .join("\n");

    const csvContent = csvHeader + csvRows;

    // Create a Blob with the CSV content
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

    // Create a download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `verified_emails_${Date.now()}.csv`);

    // Append the link to the document and trigger the download
    document.body.appendChild(link);
    link.click();

    // Clean up and remove the link
    document.body.removeChild(link);
  };

  return (
    <div className="w-full mx-auto bg-white border border-gray-100 rounded-2xl shadow-xl shadow-gray-100/50 overflow-hidden lg:flex divide-y lg:divide-y-0 lg:divide-x divide-gray-100">
      {/* Left Form Column */}
      <div className="flex flex-col flex-1 p-3 sm:p-6 bg-white">
        <form
          onSubmit={handleVerifyEmails}
          className="flex flex-col h-full justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="sm:text-lg lg:text-[20px] font-semibold tracking-tight text-gray-900">
                Quick Email Verifier
              </h2>
              {emailList.length > 0 && (
                <span className="hidden lg:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                  {emailList.length} / 20 Selected
                </span>
              )}
            </div>
            <p className="mb-4 text-xs font-medium text-gray-600">
              Enter emails to check authenticity. Each verified email consumes{" "}
              <span className="font-medium text-gray-800">1 credit</span>. Paste
              up to 20 emails separated by spaces, commas, semicolons, or line
              breaks.
            </p>
            <div className="mb-4 relative">
              <textarea
                className="w-full h-40 p-3 border border-gray-200 rounded-xl resize-none text-xs text-gray-800 placeholder-gray-500 leading-5 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-inner"
                placeholder="paste.your.emails@example.com&#10;another.email@domain.com"
                value={emailInput}
                onChange={handleInputChange}
              />
              {emailList.length > 0 && (
                <div className="absolute bottom-2 right-2 lg:hidden text-[10px] font-medium text-gray-400 bg-white px-1.5 py-0.5 rounded border border-gray-100">
                  {emailList.length}/20
                </div>
              )}
            </div>
          </div>
          <div className="pt-2">
            <button
              className="w-full h-9 font-semibold text-xs text-white bg-green-500 hover:bg-green-600 active:bg-green-700 rounded-xl transition-all duration-150 flex items-center justify-center disabled:opacity-80 disabled:cursor-not-allowed shadow-md shadow-green-500/10 hover:shadow-lg hover:shadow-green-500/20"
              disabled={isVerifying || emailList.length === 0}
            >
              {isVerifying ? (
                <>
                  <ClipLoader size={14} color="#ffffff" className="mr-2" />
                  <span>Verifying...</span>
                </>
              ) : (
                "Verify Emails"
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Right History/Empty Column */}
      {verifiedEmails.length > 0 ? (
        <div className="flex-1 p-4 bg-gray-50/30 flex flex-col min-w-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-gray-900">
                Verification History
              </h2>
              <p className="text-[12px] text-gray-500 mt-0.5">
                Real-time status tracking
              </p>
            </div>
            <button
              className="inline-flex items-center justify-center px-3 py-1.5 text-[10px] font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-all duration-150 shadow-sm"
              onClick={handleExportCSV}
            >
              <svg
                className="w-3.5 h-3.5 mr-1 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Export CSV
            </button>
          </div>

          {/* {here in this section table} */}
            <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm bg-white flex-1 flex flex-col">
            <div className="overflow-y-auto w-full custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 sticky top-0 z-10">
                    <th className="px-3 py-2 text-[10px] font-semibold tracking-wider text-gray-500 uppercase">
                      Email Address
                    </th>
                    <th className="px-3 py-2 text-[10px] font-semibold tracking-wider text-gray-500 uppercase text-center">
                      Status
                    </th>
                    <th className="px-3 py-2 text-[10px] font-semibold tracking-wider text-gray-500 uppercase text-right">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-xs text-gray-700">
                  {paginatedEmails.map((result, index) => {
                    const { label, className } = getStatusAndClass(
                      result.status,
                    );
                    return (
                      <tr
                        key={startIndex + index}
                        className="hover:bg-gray-50/60 transition-colors duration-150"
                      >
                        <td className="px-3 py-2.5 font-medium text-gray-900 break-all max-w-[180px] sm:max-w-xs">
                          {result.email}
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap text-center">
                          {result.status === "loading" ? (
                            <div className="inline-flex items-center justify-center">
                              <ClipLoader
                                size={12}
                                color="#2563eb"
                                loading={true}
                              />
                            </div>
                          ) : (
                            <span
                              className={`inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded-full border ${className}`}
                            >
                              {label}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap text-right text-xs text-gray-400 font-mono">
                          {result.date.split(",")[0]}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {pageCount > 1 && (
              <div className="flex items-center justify-between px-3 py-2 border-t border-gray-100 bg-gray-50/50">
                <span className="text-[10px] text-gray-500">
                  {startIndex + 1}–{Math.min(startIndex + PER_PAGE, verifiedEmails.length)} of {verifiedEmails.length}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    className="px-2 py-1 text-[10px] font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 active:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                  >
                    Prev
                  </button>
                  <button
                    className="px-2 py-1 text-[10px] font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 active:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    disabled={currentPage === pageCount}
                    onClick={() => setCurrentPage((p) => p + 1)}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="hidden lg:flex flex-col items-center justify-center flex-1 p-6 bg-gray-50/40 text-center">
          <div className="mb-4 p-3 bg-white rounded-2xl shadow-md border border-gray-100/50">
            <img
              src="/pros/verify-magnify.svg"
              alt="Magnify"
              className="w-32 h-32 object-contain opacity-90"
            />
          </div>
          <h3 className="mb-1 font-semibold text-gray-900">
            No verified emails yet
          </h3>
        </div>
      )}
    </div>
  );
}

export default SingleVerification;
