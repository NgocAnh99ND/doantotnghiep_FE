import React from "react";
import MainLayout from "./MainLayout";

export default function AdminLayout({ title, children }: React.PropsWithChildren<{ title: string }>) {
  return <MainLayout title={title}>{children}</MainLayout>;
}
