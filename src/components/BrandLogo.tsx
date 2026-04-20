import { cn } from "@/lib/utils";

interface BrandLogoProps {
  className?: string;
  size?: number;
}

const BrandLogo = ({ className, size = 24 }: BrandLogoProps) => {
  return (
    <img
      src="/favicon.jpg?v=3"
      alt="CarlyFresh"
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      className={cn("object-cover rounded-md", className)}
      style={{ width: size, height: size }}
    />
  );
};

export default BrandLogo;
