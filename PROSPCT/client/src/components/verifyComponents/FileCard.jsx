import {
  BsTrash,
  BsFileEarmarkText,
  BsDownload,
} from "react-icons/bs";
import ClipLoader from "react-spinners/ClipLoader";
import axios from "axios";
import Cookies from "js-cookie";
import { toast } from "react-toastify";
import API_CONFIG from "../../utils/apiConstant";

const BASE_URL = API_CONFIG.API_ENDPOINT;

function FileCard({ onRemove, file, onVerify, isDeleting }) {
  const handleDownload = async () => {
    try {
      const token =
        Cookies.get("userAccessToken") ||
        localStorage.getItem("userAccessToken");
      const response = await axios.get(
        `${BASE_URL}/api/email-verify/download/${file._id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "blob",
        },
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `results-${file.fileName}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error("Download failed. Please try again.");
    }
  };

  // Delete confirmation with inline toast
  const handleDeleteRequest = () => {
    const toastId = toast.info(
      <div className="p-1">
        <p className="text-md font-semibold text-white tracking-tight">
          Are you sure you want to permanently delete this file record? This action cannot be undone.
        </p>

        <div className="flex gap-2 justify-end mt-5">
          <button
            onClick={() => toast.dismiss(toastId)}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-600 bg-gray-200 hover:bg-slate-50 rounded-md transition-all"
          >
            Cancel
          </button>

          <button
            onClick={async () => {
              toast.dismiss(toastId);
              onRemove(file._id);
            }}
            className="px-4 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-700 rounded-md shadow-sm transition-all active:scale-95"
          >
            Confirm
          </button>
        </div>
      </div>,
      { autoClose: false, closeOnClick: false },
    );
  };

  const statusStyles = {
    unverified: "bg-gray-50 text-gray-600 border-gray-200",
    processing: "bg-blue-50 text-blue-700 border-blue-200",
    completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };

  return (
    <div className="p-4 bg-white border border-gray-200/70 rounded-xl transition-all duration-200 hover:border-blue-500 hover:shadow-lg hover:shadow-gray-100/60 flex flex-col md:flex-row gap-4 items-stretch w-full">
      {/* Left Column: Core File Metadata & Status Trigger Actions */}
      <div className="flex-1 flex flex-col justify-between min-w-0 pr-2">
        <div>
          <div className="flex items-start gap-2.5">
            <div className="p-2 bg-gray-50 border border-gray-100 rounded-lg text-gray-400 mt-0.5 shrink-0">
              <BsFileEarmarkText size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <p
                className="text-xs font-bold text-gray-900 break-all line-clamp-2 leading-snug"
                title={file.fileName}
              >
                {file.fileName}
              </p>
              <p className="text-[11px] text-gray-500 font-medium mt-1">
                Added {new Date(file.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <span
              className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded border ${statusStyles[file.status] || statusStyles.unverified}`}
            >
              {file.status}
            </span>
          </div>
        </div>

        {/* Primary Action Row Elements */}
        <div className="mt-4 flex items-center gap-2">
          {file.status === "unverified" && (
            <button
              className="px-4 h-9 text-xs font-semibold text-white bg-green-500 hover:bg-green-600 active:bg-green-700 rounded-xl transition-all duration-150 flex items-center justify-center gap-1.5 shadow-sm shadow-green-500/10"
              onClick={() => onVerify(file)}
            >
              Verify Dataset
            </button>
          )}

          {file.status === "processing" && (
            <button
              className="px-4 h-9 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center cursor-not-allowed gap-1.5"
              disabled
            >
              <ClipLoader size={10} color="#1d4ed8" />
              Running Audits...
            </button>
          )}

          {file.status === "completed" && (
            <button
              className="px-4 h-9 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl transition-all duration-150 flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-500/10"
              onClick={handleDownload}
            >
              <BsDownload size={11} />
              Download Results
            </button>
          )}

          {/* Persistent Accessible Delete Button */}
          <button
            className="h-8 w-8 text-gray-400 rounded-lg hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-all duration-150 disabled:opacity-50 flex items-center justify-center shrink-0"
            onClick={handleDeleteRequest}
            disabled={isDeleting}
            title="Delete file"
            type="button"
          >
            {isDeleting ? (
              <ClipLoader size={12} color="#e11d48" />
            ) : (
              <BsTrash size={13} />
            )}
          </button>
        </div>
      </div>

      {/* Right Column: High Density Analytics Performance Dashboard Breakdowns */}
      <div className="w-full md:w-[240px] bg-gray-50/50 border border-gray-100 rounded-lg p-3 flex flex-col justify-center gap-1.5 shrink-0">
        <div className="flex justify-between items-center text-xs font-medium pb-1.5 mb-0.5 border-b border-gray-200/50">
          <span className="text-gray-500 font-semibold text-xs">
            Total list volume
          </span>
          <span className="text-gray-900 font-bold bg-white px-2 py-0.5 rounded border border-gray-200/60 shadow-sm text-xs">
            {file.totalEmails > 0 ? file.totalEmails.toLocaleString() : "--"}
          </span>
        </div>
        <div className="flex justify-between text-xs font-medium">
          <span className="text-gray-500">Billable allocation</span>
          <span className="text-gray-800 font-semibold">
            {file.billableEmails > 0
              ? file.billableEmails.toLocaleString()
              : "--"}
          </span>
        </div>
        <div className="flex justify-between text-xs font-medium">
          <span className="text-gray-500">Duplicates found</span>
          <span className="text-amber-600 font-semibold">
            {file.duplicateEmails > 0
              ? file.duplicateEmails.toLocaleString()
              : "0"}
          </span>
        </div>
        <div className="flex justify-between text-xs font-medium">
          <span className="text-gray-500">Bad syntax flags</span>
          <span className="text-rose-600 font-semibold">
            {file.invalidEmails > 0 ? file.invalidEmails.toLocaleString() : "0"}
          </span>
        </div>
      </div>
    </div>
  );
}

export default FileCard;
