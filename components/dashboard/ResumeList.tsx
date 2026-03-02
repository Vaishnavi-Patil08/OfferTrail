"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { deleteResume } from "@/actions/resume";
import { Button } from "@/components/ui/button";

export type ResumeItem = {
  id: string;
  versionLabel: string;
  fileUrl: string;
  createdAt: string;
};

export function ResumeList({ resumes }: { resumes: ResumeItem[] }) {
  const router = useRouter();
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);

  async function handleConfirmDelete(id: string) {
    const result = await deleteResume(id);
    if (result?.success === false) {
      toast.error(result.message);
      return;
    }
    setConfirmingDeleteId(null);
    router.refresh();
  }

  return (
    <ul className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2 lg:gap-5 xl:gap-6">
      {resumes.map((r) => (
        <li
          key={r.id}
          className="card-premium flex flex-wrap items-center justify-between gap-3 p-3 sm:flex-nowrap sm:gap-4 sm:p-4 lg:p-5"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium lg:text-base">{r.versionLabel}</p>
            <p className="text-sm text-muted-foreground lg:text-base">
              {new Date(r.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href={`/api/resume/${r.id}/view`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium underline underline-offset-4 lg:text-base"
            >
              View PDF
            </Link>
            {confirmingDeleteId === r.id ? (
              <span className="flex items-center gap-1 text-sm">
                <span className="text-muted-foreground">Delete?</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-muted-foreground"
                  onClick={() => setConfirmingDeleteId(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-destructive hover:text-destructive"
                  onClick={() => handleConfirmDelete(r.id)}
                >
                  Delete
                </Button>
              </span>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                aria-label="Delete resume"
                onClick={() => setConfirmingDeleteId(r.id)}
              >
                <Trash2 className="size-4" />
              </Button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
