"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    atOptions?: {
      key: string;
      format: string;
      height: number;
      width: number;
      params: Record<string, unknown>;
    };
  }
}

const HIGH_PERFORMANCE_HOST = "https://www.highperformanceformat.com";
const EFFECTIVE_CPM_HOST = "https://pl30912727.effectivecpmnetwork.com";
const EFFECTIVE_CPM_SCRIPT_HOST = "https://pl30912728.effectivecpmnetwork.com";

function loadScript(src: string, parent: HTMLElement = document.head): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ad script: ${src}`));
    parent.appendChild(script);
  });
}

function createHighPerformanceUnit(
  key: string,
  width: number,
  height: number,
  container: HTMLElement,
): Promise<void> {
  window.atOptions = {
    key,
    format: "iframe",
    height,
    width,
    params: {},
  };
  return loadScript(`${HIGH_PERFORMANCE_HOST}/${key}/invoke.js`, container);
}

export function ThirdPartyAdNetwork() {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) {
      return;
    }
    initialized.current = true;

    let cancelled = false;

    const run = async () => {
      try {
        // Each HighPerformanceFormat unit is loaded only after its
        // corresponding atOptions configuration is installed.
        const verticalContainer = document.getElementById(
          "third-party-ad-160x300",
        );
        const bannerContainer = document.getElementById(
          "third-party-ad-468x60",
        );

        if (!verticalContainer || !bannerContainer) {
          return;
        }

        await createHighPerformanceUnit(
          "177ae8c415ec137c9a98af1f9c0d6057",
          160,
          300,
          verticalContainer,
        );

        if (cancelled) return;

        await createHighPerformanceUnit(
          "261c9b33d3d63eace2fbc45658c6d676",
          468,
          60,
          bannerContainer,
        );

        if (cancelled) return;

        const effectiveContainer = document.getElementById(
          "container-20ea67db8801bb02e04d3ae3511997fc",
        );

        if (effectiveContainer) {
          const script = document.createElement("script");
          script.src = `${EFFECTIVE_CPM_HOST}/20ea67db8801bb02e04d3ae3511997fc/invoke.js`;
          script.async = true;
          script.setAttribute("data-cfasync", "false");
          effectiveContainer.appendChild(script);
        }

        if (cancelled) return;

        await loadScript(
          `${EFFECTIVE_CPM_SCRIPT_HOST}/f2/23/a5/f223a5cf6936954014d2a3551f49d642.js`,
        );
      } catch (error) {
        // Third-party ad failures must never break the site or AdSense.
        console.warn("Third-party ad network failed to load.", error);
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section
      className="third-party-ad-section mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8"
      aria-label="Advertisement"
    >
      <div className="grid gap-6 md:grid-cols-[160px_minmax(0,1fr)] md:items-center">
        <div className="flex justify-center overflow-hidden">
          <div
            id="third-party-ad-160x300"
            className="h-[300px] w-[160px] shrink-0"
          />
        </div>

        <div className="min-w-0">
          <div className="overflow-x-auto">
            <div
              id="third-party-ad-468x60"
              className="h-[60px] w-[468px] max-w-none"
            />
          </div>

          <div
            id="container-20ea67db8801bb02e04d3ae3511997fc"
            className="mt-6 min-h-[100px] w-full"
          />
        </div>
      </div>
    </section>
  );
}
