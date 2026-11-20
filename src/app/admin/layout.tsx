import type { ReactNode } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import "./admin.css";

export const metadata = { title: "Admin Televet", robots: { index: false, follow: false } };
export default function AdminLayout({ children }: { children: ReactNode }) { return <AdminShell>{children}</AdminShell>; }
