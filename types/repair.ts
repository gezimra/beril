import type { RepairStatus } from "@/types/domain";

export interface RepairTrackResult {
  repairCode: string;
  itemType: string;
  brand: string;
  model: string;
  dateReceived: string;
  estimatedCompletion: string | null;
  amountDue: number | null;
  customerNote: string | null;
  currentStatus: RepairStatus;
  timeline: Array<{
    status: RepairStatus;
    note: string | null;
    createdAt: string;
  }>;
}
