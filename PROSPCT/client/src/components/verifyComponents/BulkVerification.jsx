import { useEffect, useRef, useState } from "react";
import { IoDocumentTextOutline, IoClose } from "react-icons/io5";
import axios from "axios";
import Cookies from "js-cookie";
import { toast } from "react-toastify";
import API_CONFIG from "../../utils/apiConstant";
import FileCard from "./FileCard";
import io from "socket.io-client";
import ClipLoader from "react-spinners/ClipLoader";
import useCreditDeduction from "../../hooks/useCreditDeduction";

const BASE_URL = API_CONFIG.API_ENDPOINT;

function BulkVerification() {
  const { deductCredit } = useCreditDeduction();

  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const fileInputRef = useRef(null);
  const socketRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(null);
  const [cardPage, setCardPage] = useState(1);
  const CARDS_PER_PAGE = 2;

  useEffect(() => {
    socketRef.current = io(BASE_URL, {
      query: {
        token: Cookies.get("userAccessToken"),
      },
    });

    socketRef.current.on("connect", () => {});

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    setCardPage(1);
  }, [uploadedFiles.length]);

  useEffect(() => {
    const fetchFiles = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(`${BASE_URL}/api/email-verify/files`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${Cookies.get("userAccessToken")}`,
          },
        });
        setUploadedFiles(response.data);
      } catch (error) {
        // Error handling fallback
      } finally {
        setIsLoading(false);
      }
    };
    fetchFiles();
  }, []);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setSelectedFile(selectedFile);
    }
  };

  const handleBoxClick = () => {
    fileInputRef.current.click();
  };

  const handleRemoveFile = () => {
    fileInputRef.current.value = null;
    setSelectedFile(null);
  };

  const handleRemoveUploadedFile = async (id) => {
    setIsDeleting(id);
    try {
      const token =
        Cookies.get("userAccessToken") ||
        localStorage.getItem("userAccessToken");
      await axios.delete(`${BASE_URL}/api/email-verify/files/${id}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      setUploadedFiles((prevFiles) =>
        prevFiles.filter((file) => file._id !== id),
      );
      toast.success("File deleted successfully");
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to delete file. Please try again.",
      );
    } finally {
      setIsDeleting(null);
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();

    if (!selectedFile) {
      toast.error("Please select a file to upload");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const token =
        Cookies.get("userAccessToken") ||
        localStorage.getItem("userAccessToken");

      const uploadResponse = await axios.post(
        `${BASE_URL}/api/email-verify/upload`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (uploadResponse.status === 200) {
        setUploadedFiles((prevFiles) => [
          ...prevFiles,
          uploadResponse.data.file,
        ]);

        toast.success(`File "${selectedFile.name}" uploaded successfully!`);
        setSelectedFile(null);
        fileInputRef.current.value = null;
      } else {
        toast.error("File upload failed");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "An error occurred during the upload.",
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleBulkVerify = async (file) => {
    try {
      setUploadedFiles((prevFiles) =>
        prevFiles.map((f) =>
          f._id === file._id ? { ...f, status: "processing" } : f,
        ),
      );

      toast.info(`Starting verification for "${file.fileName}"...`);

      const token =
        Cookies.get("userAccessToken") ||
        localStorage.getItem("userAccessToken");

      const response = await axios.post(
        `${BASE_URL}/api/email-verify/bulk`,
        {
          filePath: `${BASE_URL}/${file.filePath}`,
          fileId: file._id,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const emailCount =
        file.totalEmails || file.emailCount || response.data?.emailCount || 0;
      if (emailCount > 0) {
        try {
          await deductCredit({ type: "verification", quantity: emailCount });
        } catch (error) {
          throw error;
        }
      }

      socketRef.current.emit("joinRoom", file._id);

      socketRef.current.on("verificationUpdate", (data) => {
        setUploadedFiles((prevFiles) =>
          prevFiles.map((f) =>
            f._id === file._id
              ? {
                  ...f,
                  status: data.status,
                  filePath: data.filePath || f.filePath,
                }
              : f,
          ),
        );

        if (data.status === "completed") {
          toast.success(`Verification completed for "${file.fileName}"!`);
        } else if (data.status === "failed") {
          toast.error(`Verification failed for "${file.fileName}"`);
        }
      });
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to start verification. Please try again.",
      );

      setUploadedFiles((prevFiles) =>
        prevFiles.map((f) =>
          f._id === file._id ? { ...f, status: "unverified" } : f,
        ),
      );
    }
  };

  const reversedFiles = uploadedFiles.slice().reverse();
  const totalCardPages = Math.ceil(reversedFiles.length / CARDS_PER_PAGE);
  const cardStartIndex = (cardPage - 1) * CARDS_PER_PAGE;
  const paginatedFiles = reversedFiles.slice(cardStartIndex, cardStartIndex + CARDS_PER_PAGE);

  return (
    <div className="relative w-full bg-white border border-gray-100 rounded-2xl shadow-xl shadow-gray-100/40 overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/70 backdrop-blur-sm transition-all duration-200">
          <div className="flex flex-col items-center gap-3 p-5 rounded-2xl bg-white shadow-xl border border-gray-100">
            <ClipLoader size={40} color="#2563eb" speedMultiplier={0.8} />
            <span className="text-xs font-semibold text-gray-500 tracking-wide">
              Loading datasets...
            </span>
          </div>
        </div>
      )}

      {/* UX Fix: Changed grid structure to col-1 layout to present horizontal rows neatly */}
      <div className="flex flex-col gap-4 p-4 w-full">
        {/* Modern Horizontal Layout Form Card */}
        <div className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-gray-50/50 border border-gray-200/60 rounded-xl transition-all duration-200 hover:shadow-md hover:shadow-gray-100/50 w-full gap-4 min-h-max">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-sm text-gray-900 tracking-tight">
                Import dataset
              </h3>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                Bulk
              </span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed max-w-xl">
              Upload files containing contact matrices to run concurrent
              background verifications.
            </p>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept=".csv"
          />

          {/* Right Section containing upload block area & CTA actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            {!selectedFile ? (
              <div
                onClick={handleBoxClick}
                className="group flex items-center gap-3 w-full sm:w-[260px] h-12 px-3 border border-gray-200 border-dashed rounded-xl cursor-pointer bg-white transition-all duration-200 hover:border-blue-500 hover:bg-blue-50/10"
              >
                <div className="p-1.5 bg-gray-100 rounded-lg text-gray-500 group-hover:text-blue-600 group-hover:bg-blue-50 transition-colors duration-200 shrink-0">
                  <IoDocumentTextOutline size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-700">
                    Drop file or{" "}
                    <span className="text-blue-600 font-semibold group-hover:underline">
                      browse
                    </span>
                  </p>
                  <p className="text-[10px] text-gray-500 font-medium">
                    Supported format: .csv
                  </p>
                </div>
              </div>
            ) : (
              <div className="relative flex items-center gap-3 w-full sm:w-[260px] h-12 pl-3 pr-8 border border-blue-100 bg-blue-50/20 rounded-xl animate-fadeIn">
                <div className="p-1.5 bg-blue-500 rounded-lg text-white shadow-sm shrink-0">
                  <IoDocumentTextOutline size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className="text-xs font-semibold text-gray-800 truncate"
                    title={selectedFile.name}
                  >
                    {selectedFile.name}
                  </p>
                  <p className="text-[9px] font-mono text-blue-600 font-semibold mt-0.5">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>

                <button
                  onClick={handleRemoveFile}
                  className="absolute top-1/2 -translate-y-1/2 right-2 p-1 rounded-md text-gray-400 bg-white hover:text-rose-600 hover:bg-rose-50 border border-gray-100 transition-all duration-150 shadow-sm"
                  disabled={isUploading}
                  type="button"
                >
                  <IoClose size={12} />
                </button>
              </div>
            )}

            <button
              className={`h-12 px-4 font-semibold text-xs rounded-xl transition-all duration-150 flex items-center justify-center shadow-sm shrink-0 ${
                !selectedFile || isUploading
                  ? "               bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                  : "bg-green-500 text-white hover:bg-green-600 active:bg-green-500 shadow-blue-500/10"
              }`}
              onClick={handleFileUpload}
              disabled={!selectedFile || isUploading}
            >
              {isUploading ? (
                <>
                  <ClipLoader size={12} color="#ffffff" className="mr-2" />
                  <span>Processing...</span>
                </>
              ) : (
                "Upload & Process"
              )}
            </button>
          </div>
        </div>

        {/* Existing File Container Maps */}
        {uploadedFiles.length > 0 && (
          <>
            {paginatedFiles.map((file, index) => (
              <FileCard
                key={file._id}
                file={file}
                onVerify={handleBulkVerify}
                onRemove={handleRemoveUploadedFile}
                isDeleting={isDeleting === file._id}
              />
            ))}
            {totalCardPages > 1 && (
              <div className="flex items-center justify-between px-1 py-2">
                <span className="text-[10px] text-gray-500">
                  {cardStartIndex + 1}–{Math.min(cardStartIndex + CARDS_PER_PAGE, reversedFiles.length)} of {reversedFiles.length}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    className="px-2 py-1 text-[10px] font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 active:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    disabled={cardPage === 1}
                    onClick={() => setCardPage((p) => p - 1)}
                  >
                    Prev
                  </button>
                  <button
                    className="px-2 py-1 text-[10px] font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 active:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    disabled={cardPage === totalCardPages}
                    onClick={() => setCardPage((p) => p + 1)}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default BulkVerification;
