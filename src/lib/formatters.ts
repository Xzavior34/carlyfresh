/**
 * Shared formatting utilities for the CarlyFresh marketplace.
 */

export const formatNaira = (amount: number): string => {
  return `₦${amount.toLocaleString("en-NG")}`;
};

export const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800",
    processing: "bg-blue-100 text-blue-800",
    packaged: "bg-purple-100 text-purple-800",
    "in-transit": "bg-cyan-100 text-cyan-800",
    delivered: "bg-emerald-100 text-emerald-800",
    cancelled: "bg-red-100 text-red-800",
  };
  return colors[status] || "bg-muted text-muted-foreground";
};
