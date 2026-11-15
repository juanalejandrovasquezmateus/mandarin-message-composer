import Link from "next/link";
import { Composer } from "@/components/Composer";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 pb-16 pt-8 sm:px-6 sm:pt-12">
      <Composer />
      <footer className="mt-16 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4 text-xs text-muted">
        <span>Lines marked as checked were approved by a real native speaker.</span>
        <Link href="/review" className="underline-offset-2 hover:underline">
          Reviewer desk
        </Link>
      </footer>
    </main>
  );
}
