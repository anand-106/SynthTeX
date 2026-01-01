import { create } from "zustand";


interface LayoutStore {
    bgColor : string,
    setBgColor: (color:string)=>void;
}

export const useLayoutStore = create<LayoutStore>((set)=>({
    bgColor: "#151515",
    setBgColor: (color)=>set({bgColor:color})
}))