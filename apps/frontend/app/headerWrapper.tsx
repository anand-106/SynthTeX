"use client";

import { useLayoutStore } from "@/stores/layoutStore";
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";

export function HeaderWrapper() {
  const bgColor = useLayoutStore((state) => state.bgColor);

  return (
    <header
      style={{ backgroundColor: bgColor }}
      className="flex justify-between items-center p-4 gap-4 h-16"
    >
      <div className="flex">
        <h1 className="font-bold text-2xl font-gsans">Synth</h1>
        <h1 className="font-bold text-2xl font-gsans bg-linear-to-tl via-violet-500 to-zinc-400 bg-clip-text text-transparent">
          Tex
        </h1>
      </div>
      <SignedOut>
        <SignInButton />
        <SignUpButton>
          <button className="bg-[#6c47ff] text-ceramic-white rounded-full font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 cursor-pointer">
            Sign Up
          </button>
        </SignUpButton>
      </SignedOut>
      <SignedIn>
        <UserButton />
      </SignedIn>
    </header>
  );
}
