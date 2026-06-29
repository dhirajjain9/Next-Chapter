"use client";
import { useEffect } from "react";
import { MARKUP } from "./markup";

export default function Page() {
  useEffect(() => {
    let cancelled = false;
    import("./client").then((m) => {
      if (!cancelled) m.boot();
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return <div dangerouslySetInnerHTML={{ __html: MARKUP }} />;
}
