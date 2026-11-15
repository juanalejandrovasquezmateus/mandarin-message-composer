import { Composer } from "@/components/Composer";
import { Contribute } from "@/components/Contribute";
import { SiteNav } from "@/components/SiteNav";

export default function Home() {
  return (
    <>
      <SiteNav current="home" />
      <main className="mx-auto w-full max-w-3xl px-4 pb-16 pt-8 sm:px-6 sm:pt-10">
        <Composer />
        <div className="mt-12">
          <Contribute />
        </div>
        <footer className="mt-16 border-t border-line pt-4 text-xs text-muted">
          Lines marked as checked were approved by a real native speaker. AI drafts it;
          a person signs off on it; you always know which is which.
        </footer>
      </main>
    </>
  );
}
