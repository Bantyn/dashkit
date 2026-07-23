export interface TailorJobCard {
  id: string;
  shopId: string;
  tailorId: string; // References Employee/Staff member ID
  tailorName: string;
  assignedWork: TailorWorkItem[];
  status: "assigned" | "in_progress" | "completed";
  performanceRating?: number; // Rating out of 5 stars
  notes?: string;
  assignedDate: Date;
  completedDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface TailorWorkItem {
  item: string; // e.g. "Shirt", "Pants", "Kurti"
  quantity: number;
}
