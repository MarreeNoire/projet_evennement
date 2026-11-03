import type { ReactNode } from "react";

export default function EventLayout({ children, modal }: LayoutProps<"/evenements/[slug]"> & { modal?: ReactNode }) {
  return (
    <>
      {children}
      {modal}
    </>
  );
}
