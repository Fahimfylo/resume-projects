import { useState, useRef } from "react";
import { Upload, FileText, AlertCircle, CheckCircle, X } from "lucide-react";
import AdminComponent from "../AdminComponent";
import axios from "axios";
import API_CONFIG from "../../../utils/apiConstant";
import { toast } from "react-toastify";
import Cookies from "js-cookie";

export default function ImportData() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const requiredFields = [
    "First Name", "Last Name", "Email", "Company Name"
  ];

  const allFields = [
    // Person info
    "First Name", "Last Name", "Title", "Email", "Email Status", "Mobile Phone", 
    "City", "State", "Country", "Person Linkedin Url",
    // Company info
    "Company Name", "Website", "Company Linkedin Url", "Facebook Url", "Twitter Url", 
    "Company Address", "Company City", "Company State", "Company Country", 
    "Company Phone", "Employees", "Industry", "Keywords", "Annual Revenue"
  ];

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      validateAndSetFile(droppedFile);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      validateAndSetFile(selectedFile);
    }
  };

  const validateAndSetFile = (selectedFile) => {
    const validTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      'application/csv'
    ];

    if (!validTypes.includes(selectedFile.type)) {
      toast.error("Please upload a valid Excel or CSV file");
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) { // 10MB limit
      toast.error("File size must be less than 10MB");
      return;
    }

    setFile(selectedFile);
    setUploadResult(null);
  };

  const removeFile = () => {
    setFile(null);
    setUploadResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const downloadImportFormat = () => {
    // Create CSV content with all field headers
    const headers = [
      ...requiredFields,
      ...allFields.filter(field => !requiredFields.includes(field))
    ];
    
    const csvContent = headers.join(',') + '\n';
    
    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'Import format.csv');
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("Import format template downloaded");
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a file to upload");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    setUploadProgress(0);

    try {
      const token = Cookies.get("adminAccessToken");
      
      const response = await axios.post(
        `${API_CONFIG.API_ENDPOINT}/api/admins/import-contacts`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          onUploadProgress: (progressEvent) => {
            const progress = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(progress);
          }
        }
      );

      setUploadResult(response.data);
      toast.success("File uploaded and processed successfully!");
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      // console.error("Upload error:", error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          "Failed to upload file";
      toast.error(errorMessage);
      setUploadResult({
        success: false,
        error: errorMessage
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <AdminComponent>
      <div className="bg-transparent min-h-screen">
        {/* Header Section */}
        <header className="mb-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Import <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Data</span>
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">
                Upload Excel or CSV files to bulk import contacts into the system
              </p>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Section */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-slate-800 rounded-[2rem] p-8">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                  Upload File
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Supported formats: Excel (.xlsx, .xls) and CSV files
                </p>
              </div>

              {/* File Upload Area */}
              <div
                className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 ${
                  dragActive
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : file
                    ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                    : "border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={uploading}
                />

                {!file ? (
                  <div className="space-y-4">
                    <div className="mx-auto w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                      <Upload className="w-8 h-8 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-lg font-medium text-slate-700 dark:text-slate-300">
                        Drag and drop your file here
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        or click to browse
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                      <FileText className="w-8 h-8 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-lg font-medium text-slate-700 dark:text-slate-300">
                        {file.name}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      onClick={removeFile}
                      className="absolute top-4 right-4 p-2 text-slate-400 hover:text-red-500 transition-colors"
                      disabled={uploading}
                    >
                      <X size={20} />
                    </button>
                  </div>
                )}
              </div>

              {/* Upload Progress */}
              {uploading && (
                <div className="mt-6">
                  <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400 mb-2">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Upload Button */}
              <div className="mt-6">
                <button
                  onClick={handleUpload}
                  disabled={!file || uploading}
                  className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white font-semibold rounded-xl transition-all duration-200 disabled:cursor-not-allowed"
                >
                  {uploading ? "Processing..." : "Upload and Import"}
                </button>
              </div>
            </div>

            {/* Upload Result */}
            {uploadResult && (
              <div className="mt-8 bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-slate-800 rounded-[2rem] p-8">
                <div className="flex items-center mb-4">
                  {uploadResult.success ? (
                    <CheckCircle className="w-6 h-6 text-green-500 mr-3" />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-red-500 mr-3" />
                  )}
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                    {uploadResult.success ? "Import Completed" : "Import Failed"}
                  </h3>
                </div>

                {uploadResult.success && uploadResult.data && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                        <p className="text-sm text-slate-600 dark:text-slate-400">Total Records</p>
                        <p className="text-2xl font-bold text-slate-800 dark:text-white">
                          {uploadResult.data.totalRecords || 0}
                        </p>
                      </div>
                      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                        <p className="text-sm text-green-600 dark:text-green-400">Successfully Imported</p>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {uploadResult.data.importedRecords || 0}
                        </p>
                      </div>
                    </div>
                    {uploadResult.data.failedRecords > 0 && (
                      <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                        <p className="text-sm text-red-600 dark:text-red-400">Failed Records</p>
                        <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                          {uploadResult.data.failedRecords}
                        </p>
                        {uploadResult.data.errors && (
                          <div className="mt-2 text-sm text-red-500">
                            {uploadResult.data.errors.slice(0, 3).map((error, index) => (
                              <p key={index}>• {error}</p>
                            ))}
                            {uploadResult.data.errors.length > 3 && (
                              <p>... and {uploadResult.data.errors.length - 3} more</p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {!uploadResult.success && uploadResult.error && (
                  <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                    <p className="text-sm text-red-600 dark:text-red-400">{uploadResult.error}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Field Requirements Section */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">
                Field Requirements
              </h3>

              <div className="space-y-6">
                {/* Minimal Required Fields */}
                <div>
                  <h4 className="text-sm font-semibold text-red-600 dark:text-red-400 mb-3">
                    Minimal Required Fields
                  </h4>
                  <div className="space-y-2">
                    {requiredFields.map((field) => (
                      <div key={field} className="flex items-center">
                        <div className="w-2 h-2 bg-red-500 rounded-full mr-3" />
                        <span className="text-sm text-slate-700 dark:text-slate-300">{field}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* All Available Fields */}
                <div>
                  <h4 className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-3">
                    Complete Field Set (31 total)
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Person Info</p>
                      <div className="space-y-1">
                        {allFields.slice(0, 10).map((field) => (
                          <div key={field} className="flex items-center">
                            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-2" />
                            <span className="text-xs text-slate-600 dark:text-slate-400">{field}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Company Info</p>
                      <div className="space-y-1">
                        {allFields.slice(10).map((field) => (
                          <div key={field} className="flex items-center">
                            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-2" />
                            <span className="text-xs text-slate-600 dark:text-slate-400">{field}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Download Template Button */}
                <button
                  onClick={downloadImportFormat}
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 mb-4"
                >
                  <FileText size={16} />
                  See Import Format
                </button>

                {/* Tips */}
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <h4 className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-2">
                    Tips
                  </h4>
                  <ul className="space-y-1 text-xs text-blue-700 dark:text-blue-300">
                    <li>• Use exact column names as shown above</li>
                    <li>• Required fields must have valid data</li>
                    <li>• File size limit: 10MB</li>
                    <li>• Duplicate emails will be skipped</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminComponent>
  );
}
