"use client"

import * as Dialog from "@radix-ui/react-dialog";
import { useState } from "react";
import { FaRegPlusSquare } from "react-icons/fa";

export default function CreateProjectModal({
  onCreate,
}: {
  onCreate: (name: string, description: string) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleCreate = () => {
    if (!name.trim()) return;
    onCreate(name, description);
    setName("");
    setDescription("");
  };

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button className="h-[100px] w-[100px] cursor-pointer flex items-center justify-center text-white">
          <FaRegPlusSquare size={24} />
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60" />

        <Dialog.Content className="fixed top-1/2 left-1/2 w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-lg bg-[#121212] p-6 text-white shadow-lg">
          <Dialog.Title className="text-lg font-semibold">
            Create Project
          </Dialog.Title>

          <div className="mt-4 space-y-3">
            <input
              placeholder="Project name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded bg-[#1E1E1E] px-3 py-2 outline-none"
            />

            <textarea
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded bg-[#1E1E1E] px-3 py-2 outline-none"
            />
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <Dialog.Close className="rounded px-4 py-2 text-sm text-gray-400 hover:bg-[#1E1E1E]">
              Cancel
            </Dialog.Close>

            <Dialog.Close
              onClick={handleCreate}
              className="rounded bg-white px-4 py-2 text-sm text-black hover:bg-gray-200"
            >
              Create
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
