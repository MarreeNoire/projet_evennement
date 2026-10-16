"use client";

import { useEffect } from "react";

/** Extrait une couleur d'accent de l'affiche, sans modifier le thème général. */
export function HomeHeroPalette({ src }: { src: string | null }) {
  useEffect(() => {
    const hero = document.querySelector<HTMLElement>(".home-hero");
    if (!hero || !src) return;

    const image = new window.Image();
    image.crossOrigin = "anonymous";
    image.src = src;

    image.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 24;
        canvas.height = 24;

        const context = canvas.getContext("2d", { willReadFrequently: true });
        if (!context) return;

        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
        let hueX = 0;
        let hueY = 0;
        let saturationTotal = 0;
        let lightnessTotal = 0;
        let samples = 0;

        for (let index = 0; index < pixels.length; index += 4) {
          const redChannel = pixels[index] ?? 0;
          const greenChannel = pixels[index + 1] ?? 0;
          const blueChannel = pixels[index + 2] ?? 0;
          const alpha = (pixels[index + 3] ?? 0) / 255;
          if (alpha < 0.8) continue;

          const red = redChannel / 255;
          const green = greenChannel / 255;
          const blue = blueChannel / 255;
          const max = Math.max(red, green, blue);
          const min = Math.min(red, green, blue);
          const delta = max - min;
          const lightness = (max + min) / 2;

          // Ignore shadows and near-white pixels so the extracted accent stays visible.
          if (lightness < 0.12 || lightness > 0.9 || delta < 0.12) continue;

          let hue = 0;
          if (delta > 0) {
            if (max === red) hue = ((green - blue) / delta) % 6;
            else if (max === green) hue = (blue - red) / delta + 2;
            else hue = (red - green) / delta + 4;
          }

          const hueDegrees = ((hue * 60 + 360) % 360) * (Math.PI / 180);
          hueX += Math.cos(hueDegrees) * delta;
          hueY += Math.sin(hueDegrees) * delta;
          saturationTotal += delta * 100;
          lightnessTotal += lightness * 100 * delta;
          samples += delta;
        }

        if (!samples) return;

        const hue = Math.round((Math.atan2(hueY, hueX) * (180 / Math.PI) + 360) % 360);
        const saturation = Math.round(Math.min(82, Math.max(58, saturationTotal / samples)));
        const lightness = Math.round(Math.min(40, Math.max(30, (lightnessTotal / samples) * 0.72)));

        hero.style.setProperty("--hero-accent", `hsl(${hue} ${saturation}% ${lightness}%)`);
        hero.style.setProperty("--hero-accent-glow", `hsl(${hue} ${saturation}% 56% / 26%)`);
        hero.style.setProperty("--hero-accent-text", `hsl(${hue} ${saturation}% 78%)`);
      } catch {
        // Les images sans autorisation CORS gardent simplement les accents par défaut.
      }
    };

    return () => {
      image.onload = null;
      image.src = "";
      hero.style.removeProperty("--hero-accent");
      hero.style.removeProperty("--hero-accent-glow");
      hero.style.removeProperty("--hero-accent-text");
    };
  }, [src]);

  return null;
}
