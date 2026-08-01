import { useEffect, useState } from "react";
import { useReveal } from "../hooks/useReveal";
import { SectionHead } from "./ui/SectionHead";
import { Icon } from "./ui/Icon";
import { galleryImages, pexelsUrl, type GalleryImage } from "../data/business";

export function Gallery() {
  const headRef = useReveal<HTMLDivElement>();
  const [active, setActive] = useState<GalleryImage | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setActive(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    document.body.style.overflow = active ? "hidden" : "";
  }, [active]);

  return (
    <section id="gallery" className="py-24">
      <div className="wrap">
        <div ref={headRef}>
          <SectionHead
            center
            kicker="Gallery"
            title={
              <>
                Real Work, <span className="brass-text">Real Shop</span>
              </>
            }
            lead="Photos here are real, licensed stock photography (see credits in the footer) standing in until real shop photos are dropped in."
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 auto-rows-[190px] gap-4">
          {galleryImages.map((img) => (
            <GalleryTile key={img.photoId} img={img} onOpen={() => setActive(img)} />
          ))}
        </div>
      </div>

      <div
        className={`fixed inset-0 z-[200] flex items-center justify-center bg-[rgba(4,4,3,0.94)] p-6 transition-opacity duration-300 ${
          active ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
        }`}
        onClick={() => setActive(null)}
      >
        <button
          className="absolute right-6 top-6 flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)]"
          aria-label="Close"
          onClick={() => setActive(null)}
        >
          <Icon name="close" className="h-[18px] w-[18px]" />
        </button>
        {active ? (
          <img
            src={pexelsUrl(active.photoId, 1400)}
            alt={active.alt}
            className="max-h-[80vh] max-w-[900px] rounded-[16px] border border-[var(--border)]"
            onClick={(e) => e.stopPropagation()}
          />
        ) : null}
      </div>
    </section>
  );
}

function GalleryTile({ img, onOpen }: { img: GalleryImage; onOpen: () => void }) {
  const ref = useReveal<HTMLButtonElement>();
  return (
    <button
      ref={ref}
      onClick={onOpen}
      className={`group relative overflow-hidden rounded-[12px] border border-[var(--border)] text-left ${
        img.tall ? "row-span-2" : ""
      }`}
    >
      <img
        src={pexelsUrl(img.photoId, 800)}
        alt={img.alt}
        loading="lazy"
        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        style={{ filter: "grayscale(30%) contrast(1.08)" }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_50%,rgba(0,0,0,0.75))] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <span className="absolute bottom-3 left-3 text-[0.7rem] uppercase tracking-[0.08em] text-[var(--text)] opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        {img.tag}
      </span>
    </button>
  );
}
