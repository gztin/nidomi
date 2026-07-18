import Image from "next/image";
import type { PropertyImage } from "@/features/property/types";

export function PropertyGallery({ images }: { images: PropertyImage[] }) {
  const previewImages = images.slice(0, 3);

  return (
    <div className="gallery" aria-label="房源照片">
      {previewImages.map((image, index) => (
        <figure className={index === 0 ? "gallery-main" : "gallery-secondary"} key={image.src}>
          <Image src={image.src} alt={image.alt} fill sizes={index === 0 ? "(max-width: 760px) 100vw, 66vw" : "33vw"} priority={index === 0} />
        </figure>
      ))}
      <button className="gallery-button" type="button">查看全部 {images.length} 張照片</button>
    </div>
  );
}
