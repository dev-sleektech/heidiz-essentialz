"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { AbujaHills, AbujaCity } from "@/components/home/abuja-skyline";

export function Hero() {
  return (
    <section className="relative isolate flex min-h-[92vh] items-center overflow-hidden bg-brand-black text-white">
      {/* Placeholder cinematic backdrop; swap for hero video/photography.
          A stylized Abuja skyline (Aso Rock, Zuma Rock, the National Mosque
          and Assembly) drifts behind the gradient until real footage lands. */}
      <div className="absolute inset-0">
        <div className="absolute inset-x-0 bottom-[26%] h-[24%] text-burnt-orange-light/30">
          <div className="flex h-full w-[200%] animate-skyline-slow">
            <AbujaHills className="h-full w-1/2 shrink-0" />
            <AbujaHills className="h-full w-1/2 shrink-0" />
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 h-[40%] text-champagne/50">
          <div className="flex h-full w-[200%] animate-skyline-fast">
            <AbujaCity className="h-full w-1/2 shrink-0" />
            <AbujaCity className="h-full w-1/2 shrink-0" />
          </div>
        </div>

        <div className="absolute inset-0 bg-[radial-gradient(120%_100%_at_50%_0%,rgba(181,83,30,0.35)_0%,rgba(0,0,0,0.75)_60%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.15)_0%,rgba(0,0,0,0.35)_55%,rgba(0,0,0,0.72)_100%)]" />
        <div className="absolute -top-40 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-burnt-orange/20 blur-[120px]" />
      </div>

      <Container className="relative z-10 flex flex-col items-center gap-8 text-center">
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-xs tracking-luxury uppercase text-champagne"
        >
          HEIDIZ Essentialz · FCT-Abuja, Nigeria
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="max-w-4xl font-display text-5xl leading-[1.1] md:text-6xl lg:text-7xl"
        >
          Luxury, Elegance &amp; Beauty in Every Detail.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="max-w-xl text-base text-white/70 md:text-lg"
        >
          Discover premium fragrances, skincare, beauty essentials, and
          fashion accessories curated for those who appreciate timeless
          sophistication.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="flex flex-col items-center gap-4 pt-2 sm:flex-row"
        >
          <ButtonLink href="/shop" size="lg" variant="primary">
            Shop Collection
            <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
          </ButtonLink>
          <ButtonLink
            href="/new-arrivals"
            size="lg"
            variant="outline"
            className="border-white/40 text-white hover:bg-white hover:text-brand-black"
          >
            Discover New Arrivals
          </ButtonLink>
        </motion.div>
      </Container>

      <div className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 text-[0.65rem] tracking-luxury text-white/40">
        SCROLL TO EXPLORE
      </div>
    </section>
  );
}
