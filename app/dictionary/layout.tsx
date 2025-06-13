import type React from "react"
export default function DictionaryLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <main className="min-h-screen bg-gray-50">{children}</main>
}
