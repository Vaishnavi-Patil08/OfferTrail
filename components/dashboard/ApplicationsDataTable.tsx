"use client";

import * as React from "react";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { deleteApplication, updateApplicationStatus } from "@/actions/application";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type ApplicationRow = {
  id: string;
  company: string;
  role: string | null;
  date: Date;
  status: string | null;
};

const STATUS_OPTIONS = [
  { value: "", label: "—" },
  { value: "Applied", label: "Applied" },
  { value: "Interviewing", label: "Interviewing" },
  { value: "Offer", label: "Offer" },
  { value: "Rejected", label: "Rejected" },
  { value: "Withdrawn", label: "Withdrawn" },
];

export function ApplicationsDataTable({ data }: { data: ApplicationRow[] }) {
  const router = useRouter();
  const [search, setSearch] = React.useState("");
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(null);

  const filteredData = React.useMemo(() => {
    if (!search.trim()) return data;
    const q = search.trim().toLowerCase();
    return data.filter(
      (row) =>
        row.company.toLowerCase().includes(q) ||
        (row.role?.toLowerCase().includes(q) ?? false) ||
        (row.status?.toLowerCase().includes(q) ?? false)
    );
  }, [data, search]);

  const columns: ColumnDef<ApplicationRow>[] = [
    {
      accessorKey: "company",
      header: "Company",
      cell: ({ row }) => (
        <span className="font-medium">{row.getValue("company")}</span>
      ),
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => row.getValue("role") ?? "—",
    },
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => {
        const d = row.getValue("date") as Date;
        return d.toLocaleDateString();
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <select
          className="rounded-md border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          value={row.original.status ?? ""}
          onClick={(e) => e.stopPropagation()}
          onChange={async (e) => {
            e.stopPropagation();
            const value = e.target.value || null;
            const result = await updateApplicationStatus(row.original.id, value);
            if (result?.success === false) {
              toast.error(result.message);
              return;
            }
            router.refresh();
          }}
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value || "none"} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ),
    },
    {
      id: "actions",
      header: () => <span className="block w-20 shrink-0" />,
      cell: ({ row }) => (
        <span
          className="inline-flex w-20 shrink-0 items-center justify-center gap-0.5"
          onClick={(e) => e.stopPropagation()}
        >
          <Link
            href={`/dashboard/applications/${row.original.id}/edit`}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Edit application"
          >
            <Pencil className="size-4 shrink-0" style={{ width: 16, height: 16 }} />
          </Link>
          {confirmDeleteId === row.original.id ? (
            <span
              className="inline-flex shrink-0 items-center gap-0.5 text-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="text-muted-foreground">Delete?</span>
              <button
                type="button"
                className="rounded px-1 text-muted-foreground hover:text-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmDeleteId(null);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded px-1 text-destructive hover:underline"
                onClick={async (e) => {
                  e.stopPropagation();
                  const result = await deleteApplication(row.original.id);
                  if (result?.success === false) {
                    toast.error(result.message);
                    return;
                  }
                  setConfirmDeleteId(null);
                  router.refresh();
                }}
              >
                Delete
              </button>
            </span>
          ) : (
            <button
              type="button"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md [color:rgb(220_38_38)] hover:bg-red-500/10 hover:[color:rgb(185_28_28)]"
              aria-label="Delete application"
              onClick={(e) => {
                e.stopPropagation();
                setConfirmDeleteId(row.original.id);
              }}
            >
              <Trash2 className="size-4 shrink-0" style={{ width: 16, height: 16 }} />
            </button>
          )}
        </span>
      ),
    },
  ];

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-3">
      <div className="relative">
        <Input
          placeholder="Search by company, role, or status..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="overflow-hidden rounded-lg border border-border/50 shadow-sm">
        <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className="cursor-pointer"
                onClick={() =>
                  router.push(`/dashboard/applications/${row.original.id}`)
                }
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(
                      cell.column.columnDef.cell,
                      cell.getContext()
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-24 text-center text-muted-foreground"
              >
                {search.trim()
                  ? "No applications match your search."
                  : "No applications yet."}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      </div>
    </div>
  );
}
