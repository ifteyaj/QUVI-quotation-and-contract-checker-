// Mock data for UI development only.
// These values are not connected to the QUVI backend, database, or any real supplier data.

export type VerificationStatus =
  | "Approved"
  | "Rejected"
  | "Needs Human Review";

export interface OverviewStat {
  label: string;
  value: number;
  icon: "total" | "approved" | "rejected" | "review";
}

export const mockOverviewStats: OverviewStat[] = [
  { label: "Total Verifications", value: 48, icon: "total" },
  { label: "Approved", value: 31, icon: "approved" },
  { label: "Rejected", value: 9, icon: "rejected" },
  { label: "Needs Human Review", value: 8, icon: "review" },
];

export interface RecentVerification {
  id: string;
  supplier: string;
  purchaseRequest: string;
  date: string;
  status: VerificationStatus;
}

export const mockRecentVerifications: RecentVerification[] = [
  {
    id: "ver-001",
    supplier: "Atlas Textiles Ltd.",
    purchaseRequest: "PR-2041",
    date: "2026-10-28",
    status: "Approved",
  },
  {
    id: "ver-002",
    supplier: "BlueWave Fabrics",
    purchaseRequest: "PR-2039",
    date: "2026-10-27",
    status: "Needs Human Review",
  },
  {
    id: "ver-003",
    supplier: "Cedar Apparel Co.",
    purchaseRequest: "PR-2036",
    date: "2026-10-25",
    status: "Rejected",
  },
  {
    id: "ver-004",
    supplier: "Delta Stitching",
    purchaseRequest: "PR-2035",
    date: "2026-10-24",
    status: "Approved",
  },
  {
    id: "ver-005",
    supplier: "Evergreen Garments",
    purchaseRequest: "PR-2031",
    date: "2026-10-22",
    status: "Approved",
  },
];
