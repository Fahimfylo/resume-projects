import { useMemo, useState, useRef } from "react";
import MainLayout from "../../components/layout/MainLayout";
import Papa from "papaparse";
import axios from "axios";
import Cookies from "js-cookie";
import { toast } from "react-toastify";
import API_CONFIG from "../../utils/apiConstant";
import { useFeatureAccess } from "../../hooks/useFeatureAccess";

export default function ImportPage() {
  const { hasFeature } = useFeatureAccess();
  const [file, setFile] = useState(null);
  const [previewRows, setPreviewRows] = useState([]);
  const [previewColumns, setPreviewColumns] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);

  // Ref to trigger hidden file input
  const fileInputRef = useRef(null);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);

    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const { data, meta } = results;
        setPreviewColumns(meta.fields || []);
        setPreviewRows(data.slice(0, 10));
        // Automatically trigger upload once file is selected/parsed
        uploadFile(selectedFile);
      },
      error: (error) => {
        toast.error(`Failed to parse file: ${error.message}`);
      },
    });
  };

  const uploadFile = async (selectedFile) => {
    const form = new FormData();
    form.append("file", selectedFile);

    setIsUploading(true);
    try {
      const token =
        localStorage.getItem("userAccessToken") || Cookies.get("userAccessToken");
      const res = await axios.post(
        `${API_CONFIG.API_ENDPOINT}/api/import/upload`,
        form,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      toast.success(`Import preview loaded (${res.data.count} rows)`);
      if (res.data.preview && Array.isArray(res.data.preview)) {
        setPreviewColumns(Object.keys(res.data.preview[0] || {}));
        setPreviewRows(res.data.preview);
      }
    } catch (err) {
      const message =
        err.response?.data?.error || err.message || "Import failed.";
      toast.error(message);
    } finally {
      setIsUploading(false);
    }
  };

  const previewTable = useMemo(() => {
    if (!previewRows.length) return null;
    return (
      <div className="mt-8 overflow-auto max-h-[400px] border border-gray-200 rounded-lg shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              {previewColumns.map((col) => (
                <th
                  key={col}
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {previewRows.map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-50 transition-colors">
                {previewColumns.map((col) => (
                  <td
                    key={col}
                    className="px-4 py-3 text-gray-600 whitespace-nowrap"
                  >
                    {String(row[col] ?? "").slice(0, 50)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }, [previewColumns, previewRows]);

  return (
    <MainLayout>
      <div className="min-h-screen bg-[#F9FAFB]">
        {/* Header Section */}
        <div className="bg-white border-b border-gray-200 px-8 py-4">
          <h1 className="text-xl font-semibold text-gray-800">Imports</h1>
        </div>

        <div className="max-w-6xl mx-auto p-8">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-10">
            <h2 className="text-2xl font-normal text-gray-900 mb-8">
              Import or sync your data
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Import Card */}
              <div className="flex border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex-shrink-0 mr-6 bg-gray-50 p-4 rounded flex items-center justify-center w-24 h-24">
                  {/* CSV/File Icon Representation */}
                  <svg
                    className="w-12 h-12 text-blue-500"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
                  </svg>
                </div>
                <div className="flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Import
                    </h3>
                    <p className="text-gray-500 text-sm leading-relaxed mb-4">
                      Import contact, company information into Getprospect.
                    </p>
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="w-fit px-6 py-2 bg-[#0084FF] hover:bg-blue-600 text-white font-medium rounded transition-colors disabled:opacity-50"
                  >
                    {isUploading ? "Processing..." : "Start an import"}
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept=".csv,.xls,.xlsx"
                    onChange={handleFileChange}
                  />
                </div>
              </div>

              {/* Two-way Sync Card */}
              {hasFeature("basicIntegrations") && (
              <div className="flex border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow opacity-80">
                <div className="flex-shrink-0 mr-6 bg-gray-50 p-4 rounded flex items-center justify-center w-24 h-24">
                  {/* Sync Icon Representation */}
                  <svg
                    className="w-12 h-12 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                    />
                  </svg>
                </div>
                <div className="flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Two-way Sync
                    </h3>
                    <p className="text-gray-500 text-sm leading-relaxed mb-4">
                      Sync contact and company data between your Getprospect
                      account and over 200 apps using Zapier.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsSyncModalOpen(true)}
                    className="w-fit px-6 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded hover:bg-gray-50 transition-colors"
                  >
                    Set up sync
                  </button>
                </div>
              </div>
              )}
            </div>

            {/* Preview Section */}
            {previewRows.length > 0 && (
              <div className="mt-12 animate-fadeIn">
                <h3 className="text-lg font-medium text-gray-800 mb-2">
                  Preview (first {previewRows.length} rows)
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Verify your data mapping before completing the final import.
                </p>
                {previewTable}
              </div>
            )}
          </div>
        </div>
      </div>

      {isSyncModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="w-full max-w-lg bg-white rounded-lg shadow-lg">
            <div className="flex justify-between items-center px-6 py-4 border-b">
              <h2 className="text-lg font-semibold">Two-way Sync</h2>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setIsSyncModalOpen(false)}
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600">
                This feature helps you keep contacts and companies in sync between
                Getprospect and third-party apps (e.g. Zapier).
              </p>
              <p className="text-sm text-gray-600">
                To get started, create a Zap with a Webhooks by Zapier trigger and
                use the URL below as the destination.
              </p>

              <div className="rounded border border-gray-200 bg-gray-50 p-4">
                <div className="text-xs text-gray-500 mb-2">Webhook URL</div>
                <div className="flex items-center">
                  <input
                    readOnly
                    value={`${API_CONFIG.API_ENDPOINT}/api/import/sync`}
                    className="flex-1 bg-white border border-gray-300 rounded-l px-3 py-2 text-xs text-gray-700"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `${API_CONFIG.API_ENDPOINT}/api/import/sync`,
                      );
                      toast.success("Copied webhook URL to clipboard");
                    }}
                    className="px-3 py-2 bg-blue-600 text-white text-xs rounded-r hover:bg-blue-700"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div className="text-xs text-gray-500">
                Note: The backend sync endpoint is a placeholder. Implement the
                actual sync logic on the server to persist company/contact data.
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setIsSyncModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
