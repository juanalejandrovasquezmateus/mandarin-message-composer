import type { Metadata } from "next";
import { ReviewDesk } from "@/components/ReviewDesk";

export const metadata: Metadata = {
  title: "Reviewer desk · Mandarin Message Composer",
};

export default function ReviewPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 pb-16 pt-8 sm:px-6 sm:pt-12">
      <ReviewDesk />
    </main>
  );
}
