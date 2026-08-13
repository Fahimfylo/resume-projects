"use client";

import { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";

export function AosInitializer() {
  useEffect(() => {
    AOS.init({
      duration: 1000,
      offset: 100,
    });
  }, []);

  return null;
}
