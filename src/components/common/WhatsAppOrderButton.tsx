import React from "react";
import { Button } from "@/components/ui/button";
import { openWhatsAppOrderDetails, type WhatsAppOrderData } from "@/lib/whatsapp";
import { MessageCircle } from "lucide-react";

// WhatsApp Brand Icon (SVG)
export const WhatsAppIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M17.472 14.382c-.301-.15-1.78-.878-2.056-.978-.276-.1-.477-.15-.678.15-.201.3-.777.978-.953 1.179-.176.2-.351.226-.652.075-.301-.15-1.272-.469-2.423-1.496-.895-.799-1.5-1.786-1.676-2.087-.176-.3-.019-.462.132-.612.136-.135.301-.351.452-.527.15-.176.201-.3.301-.501.1-.2.05-.376-.025-.526-.075-.15-.678-1.634-.928-2.238-.244-.588-.492-.508-.678-.517-.176-.009-.376-.009-.577-.009-.201 0-.527.075-.803.376s-1.054 1.03-1.054 2.511 1.079 2.912 1.23 3.113c.15.201 2.122 3.24 5.141 4.544.718.31 1.279.496 1.716.635.722.23 1.379.197 1.9-.12.58-.354 1.78-1.455 2.03-2.862.251-1.407.251-2.613.176-2.863-.076-.25-.276-.376-.577-.526zM12.042 22C6.54 22 2.072 17.532 2.072 12.03 2.072 6.528 6.54 2.06 12.042 2.06c5.502 0 9.97 4.468 9.97 9.97 0 5.502-4.468 9.97-9.97 9.97zm0-21.94C5.452.06.072 5.44.072 12.03c0 2.21.603 4.28 1.657 6.07L.072 24l6.096-1.6c1.737.95 3.734 1.49 5.874 1.49 6.59 0 11.97-5.38 11.97-11.97S18.632.06 12.042.06z" />
  </svg>
);

interface Props {
  order: WhatsAppOrderData;
  recipientPhone?: string | null;
  label?: string;
  className?: string;
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  showIcon?: boolean;
  context?: "general" | "to_vendor" | "to_buyer" | "to_driver";
}

export default function WhatsAppOrderButton({
  order,
  recipientPhone,
  label = "Send to WhatsApp",
  className = "",
  size = "sm",
  variant = "outline",
  showIcon = true,
  context = "general",
}: Props) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    openWhatsAppOrderDetails(order, recipientPhone, context);
  };

  return (
    <Button
      type="button"
      size={size}
      variant={variant}
      onClick={handleClick}
      className={`font-body gap-1.5 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-800 ${className}`}
      title="Send order details to WhatsApp"
    >
      {showIcon && <WhatsAppIcon className="h-4 w-4 shrink-0 fill-current" />}
      {size !== "icon" && <span>{label}</span>}
    </Button>
  );
}
