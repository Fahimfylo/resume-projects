import mongoose from "mongoose";

const ScanRecordSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: ["file", "url"], required: true },
    target: { type: String, required: true },
    riskScore: { type: Number, required: true },
    riskLevel: { type: String, enum: ["Safe", "Low", "Medium", "High", "Critical"], required: true },
    fileDetails: {
      fileName: String,
      fileSize: Number,
      declaredExtension: String,
      doubleExtensionDetected: Boolean,
      dangerousExtension: Boolean,
      hash: String,
      findings: [String],
    },
    urlDetails: {
      overallAssessment: String,
      phishingThreats: [String],
      domainReputation: String,
      defensiveActions: [String],
    },
    aiSummary: {
      summary: String,
      detectedThreats: [String],
      implications: String,
      recommendations: [String],
    },
  },
  { timestamps: true }
);

ScanRecordSchema.index({ userId: 1, createdAt: -1 });

export interface IScanRecord {
  _id: string;
  userId: string;
  type: "file" | "url";
  target: string;
  riskScore: number;
  riskLevel: "Safe" | "Low" | "Medium" | "High" | "Critical";
  fileDetails?: {
    fileName?: string;
    fileSize?: number;
    declaredExtension?: string;
    doubleExtensionDetected?: boolean;
    dangerousExtension?: boolean;
    hash?: string;
    findings?: string[];
  };
  urlDetails?: {
    overallAssessment?: string;
    phishingThreats?: string[];
    domainReputation?: string;
    defensiveActions?: string[];
  };
  aiSummary?: {
    summary?: string;
    detectedThreats?: string[];
    implications?: string;
    recommendations?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

export const ScanRecord =
  mongoose.models.ScanRecord || mongoose.model("ScanRecord", ScanRecordSchema);
