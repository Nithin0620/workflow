import { ImageIcon } from "lucide-react";

interface BannerStripProps {
  imageUrls: string[];
  max?: number;
  className?: string;
}

/**
 * Small preview strip of a row's banner images, used in card grids
 * (dashboard workspace cards, project cards).
 */
export function BannerStrip({ imageUrls, max = 3, className = "" }: BannerStripProps) {
  const urls = imageUrls.slice(0, max);
  if (urls.length === 0) return null;

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {urls.map((url, i) => (
        <img
          key={i}
          src={url}
          alt=""
          loading="lazy"
          className="h-7 w-14 rounded-md object-cover border border-neutral-800 dark:border-neutral-200 grayscale contrast-125 brightness-95"
        />
      ))}
      {imageUrls.length > max && (
        <span className="flex items-center gap-1 rounded-md border border-neutral-800 dark:border-neutral-200 bg-neutral-900 dark:bg-neutral-100 px-1.5 py-1 text-[10px] font-bold text-neutral-400 dark:text-neutral-600">
          <ImageIcon className="h-3 w-3" />
          +{imageUrls.length - max}
        </span>
      )}
    </div>
  );
}