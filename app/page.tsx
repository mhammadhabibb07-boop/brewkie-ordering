import { Suspense } from "react";
import MenuPage from "@/components/MenuPage";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-orange-500 text-xl font-semibold">Loading Brewkie...</div>}>
      <MenuPage />
    </Suspense>
  );
}
