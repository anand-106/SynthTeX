"use client";

import { useLayoutStore } from "@/stores/layoutStore";
import { usePathname } from "next/navigation";
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";

export function HeaderWrapper() {
  const bgColor = useLayoutStore((state) => state.bgColor);
  const pathname = usePathname();
  const isHomePage = pathname === "/";

  return (
    <header
      style={{ backgroundColor: isHomePage ? "transparent" : bgColor }}
      className={`flex justify-between items-center p-4 gap-4 h-16 ${
        isHomePage 
          ? "absolute top-0 left-0 right-0 z-50" 
          : "relative"
      }`}
    >
      <div className="flex">
        <h1 className="font-bold text-2xl font-gsans">Synth</h1>
        <h1 className="font-bold text-2xl font-gsans bg-linear-to-tl via-violet-500 to-zinc-400 bg-clip-text text-transparent">
          Tex
        </h1>
      </div>
      <div className="flex gap-2">

      <SignedOut>
        <SignInButton >
        <button className="bg-transparent text-white border-2 border-white rounded-lg font-medium text-sm sm:text-sm py-1  px-4 sm:px-5 cursor-pointer">
            Sign In
          </button>
        </SignInButton>
        <SignUpButton>
          <button className="bg-white text-black rounded-lg font-medium text-sm sm:text-sm px-4 py-1 sm:px-5 cursor-pointer">
            Sign Up
          </button>
        </SignUpButton>
      </SignedOut>
      <SignedIn>
        <UserButton />
      </SignedIn>
      </div>
    </header>
  );
}
