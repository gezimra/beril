"use client";

import { ChevronUp } from "lucide-react";
import { useEffect, useState } from "react";

const getScrollY = () =>
  window.scrollY || document.documentElement.scrollTop || document.body.scrollTop;

export function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(getScrollY() > 500);
    document.addEventListener("scroll", onScroll, { passive: true });
    return () => document.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      aria-label="Scroll to top"
      onClick={() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
        document.documentElement.scrollTo({ top: 0, behavior: "smooth" });
        document.body.scrollTo({ top: 0, behavior: "smooth" });
      }}
      className="fixed bottom-6 right-6 z-30 inline-flex h-10 w-10 items-center justify-center rounded-full border border-graphite/18 bg-ivory/95 text-graphite shadow-md backdrop-blur-sm transition hover:bg-white"
    >
      <ChevronUp className="h-4 w-4" />
    </button>
  );
}
