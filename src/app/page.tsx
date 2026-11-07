import Image from "next/image";
import Link from "next/link";
import { Core } from "@/components/Core";
import { HeroCore } from "@/components/site/HeroCore";
import { Reveal } from "@/components/site/Reveal";

const NAV = [
  { href: "#product", label: "Product" },
  { href: "#how", label: "How it works" },
  { href: "#focus-mode", label: "Focus Mode" },
  { href: "#about", label: "About" },
];

const CAPABILITIES = [
  { n: "01", title: "Scheduling", text: "Tell Minna what's coming up. It picks sensible times and sets the reminders." },
  { n: "02", title: "Organization", text: "Personal, work and school in one place, each with its own routines." },
  { n: "03", title: "Routines", text: "Checklists that come back on the right days, from packing your bag to wrapping up the week." },
  { n: "04", title: "Memory", text: "Optional. Lasting preferences you choose to keep, so suggestions get better." },
  { n: "05", title: "Email and calendar", text: "Gmail, Outlook and Google Calendar are next on the roadmap.", soon: true },
];

const NAGS = [
  { t: "6:00 PM", text: "Time to pack your gym bag." },
  { t: "6:10 PM", text: "Hey again. Have you had a chance to pack your gym bag?" },
  { t: "6:20 PM", text: "One more gentle nudge: pack your gym bag. It'll feel good once it's done." },
  { t: "6:24 PM", text: "Done.", done: true },
];

/** Each letter rises in on its own, slightly after the previous one */
function Letters({ text, start = 0 }: { text: string; start?: number }) {
  return (
    <>
      {text.split("").map((c, i) => (
        <span key={i} className="char" style={{ animationDelay: `${(start + i) * 55 + 60}ms` }}>
          {c}
        </span>
      ))}
    </>
  );
}

export default function Home() {
  return (
    <div className="overflow-x-clip">
      {/* Header */}
      <header className="absolute inset-x-0 top-0 z-30">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-5 py-5 sm:px-10 sm:py-7">
          <Link href="/" className="display text-[28px] tracking-normal sm:text-[32px]">
            Minna<span className="text-vermilion">.</span>
          </Link>
          <nav className="flex items-center gap-8 text-sm" aria-label="Main">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} className="hidden text-ink-2 transition-colors hover:text-ink lg:inline">
                {n.label}
              </a>
            ))}
            <Link href="/app" className="btn-primary">
              Get started
            </Link>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative flex min-h-[100svh] flex-col justify-end pt-24 pb-8 sm:pb-10" aria-labelledby="hero-title">
          <div className="relative mx-auto w-full max-w-[1600px]">
            <h1 id="hero-title" aria-label="Meet Minna." className="display relative z-0 px-3 text-ink sm:px-6">
              <span aria-hidden className="block text-[31vw] leading-[0.8] sm:text-[24vw] 2xl:text-[23rem]">
                <Letters text="Meet" />
              </span>
              <span aria-hidden className="block text-right text-[31vw] leading-[0.8] sm:text-[24vw] 2xl:text-[23rem]">
                <Letters text="Minna" start={4} />
                <span className="char text-vermilion" style={{ animationDelay: `${9 * 55 + 120}ms` }}>
                  .
                </span>
              </span>
            </h1>
            {/* The Core sits in front of the type: beside "Meet", cutting into the top of "Minna." */}
            <div
              className="pointer-events-none absolute right-[3vw] top-[-38vw] z-10 w-[50vw] animate-fade sm:right-auto sm:left-[55%] sm:top-[-1vw] sm:w-[27vw] 2xl:w-[440px] 2xl:top-[-16px]"
              style={{ animationDelay: "250ms" }}
            >
              <HeroCore />
            </div>
          </div>

          <div className="relative z-20 mx-auto mt-10 grid w-full max-w-[1600px] gap-6 px-5 sm:mt-12 sm:grid-cols-[1fr_auto] sm:items-end sm:px-10">
            <div className="animate-rise" style={{ animationDelay: "350ms" }}>
              <p className="max-w-sm text-xl leading-snug sm:text-2xl">Your life. More organized. Less overwhelming.</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/app" className="btn-primary !px-5 !py-3">
                  Meet your assistant
                </Link>
                <a href="#how" className="btn-secondary !px-5 !py-3">
                  See how it works
                </a>
              </div>
            </div>
            <p className="max-w-[16rem] text-sm text-ink-2 sm:text-right">
              A personal assistant for school, work and everything in between.
            </p>
          </div>
        </section>

        {/* Section 1: Product */}
        <section id="product" className="scroll-mt-10 border-t border-line pt-20 sm:pt-28" aria-labelledby="product-title">
          <div className="mx-auto max-w-[1600px] px-5 sm:px-10">
            <Reveal>
              <p className="eyebrow">The product</p>
              <h2 id="product-title" className="display mt-4 text-[19vw] sm:text-[13vw] xl:text-[12rem]">
                Your life.
                <br />
                <span className="text-accent-ink">Handled.</span>
              </h2>
            </Reveal>
          </div>

          <div className="mx-auto mt-14 grid max-w-[1600px] gap-12 sm:mt-20 lg:grid-cols-12 lg:gap-0">
            <Reveal className="relative aspect-[4/3] lg:col-span-7 lg:aspect-auto lg:min-h-[640px]">
              <Image
                src="/assets/minna-editorial/minna-workflow.png"
                alt="The Minna Core with envelopes and calendars connected by a thin blue line"
                fill
                sizes="(min-width: 1024px) 58vw, 100vw"
                className="object-cover object-[70%_50%]"
              />
            </Reveal>
            <div className="px-5 sm:px-10 lg:col-span-5 lg:pl-16">
              <Reveal>
                <p className="max-w-md text-xl leading-snug">
                  Write it the way you&apos;d say it. Minna turns “chemistry exam on Thursday” into a reminder for the exam and a
                  study session the day before.
                </p>
              </Reveal>
              <ol className="mt-10 border-t border-line">
                {CAPABILITIES.map((c, i) => (
                  <Reveal as="li" key={c.n} delay={i * 60} className="grid grid-cols-[3rem_1fr] gap-x-4 border-b border-line py-5">
                    <span className="display text-2xl text-ink-2">{c.n}</span>
                    <div>
                      <h3 className="flex items-baseline gap-3 font-medium">
                        {c.title}
                        {c.soon && <span className="text-xs font-normal text-ink-2">Coming soon</span>}
                      </h3>
                      <p className="mt-1 text-sm text-ink-2">{c.text}</p>
                    </div>
                  </Reveal>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="scroll-mt-10 bg-ink py-20 text-bg sm:py-28" aria-labelledby="how-title">
          <div className="mx-auto max-w-[1600px] px-5 sm:px-10">
            <Reveal>
              <p className="eyebrow !text-bg/60">How it works</p>
              <h2 id="how-title" className="sr-only">
                How it works
              </h2>
            </Reveal>
            <ol className="mt-10 grid gap-12 md:grid-cols-3 md:gap-8">
              {[
                { n: "1", h: "Tell it.", p: "Type or speak. “Remind me to finish my math homework tomorrow at 6.”" },
                { n: "2", h: "It plans.", p: "Minna picks the time, the area and how persistent to be. You can undo anything." },
                { n: "3", h: "It follows up.", p: "Notifications at the right moment, and again if it isn't done yet." },
              ].map((s, i) => (
                <Reveal as="li" key={s.n} delay={i * 100} className="border-t border-bg/20 pt-6">
                  <span className="display text-[8rem] leading-none text-bg/15">{s.n}</span>
                  <h3 className="display -mt-6 text-6xl">{s.h}</h3>
                  <p className="mt-4 max-w-xs text-bg/70">{s.p}</p>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>

        {/* Section 2: Focus Mode */}
        <section id="focus-mode" className="scroll-mt-10 py-20 sm:py-28" aria-labelledby="focus-title">
          <div className="mx-auto grid max-w-[1600px] items-center gap-12 px-5 sm:px-10 lg:grid-cols-12">
            <div className="relative z-10 lg:col-span-6">
              <Reveal>
                <p className="eyebrow !text-vermilion">Focus Mode</p>
                <h2 id="focus-title" className="display mt-4 text-[22vw] sm:text-[14vw] lg:text-[10vw] xl:text-[10rem]">
                  Until it&apos;s
                  <br />
                  done.
                </h2>
                <p className="mt-6 max-w-md text-xl leading-snug">
                  The important things shouldn&apos;t depend on you remembering every detail.
                </p>
                <p className="mt-4 max-w-md text-ink-2">
                  Turn on Focus Mode for anything that can&apos;t slip. Minna reminds you, then again every ten minutes, until you
                  mark it done.
                </p>
              </Reveal>
              <Reveal delay={150}>
                <ul className="mt-10 max-w-md border-l-2 border-vermilion pl-5" aria-label="Example of Focus Mode reminders">
                  {NAGS.map((n) => (
                    <li key={n.t} className="grid grid-cols-[4.5rem_1fr] gap-3 py-2 text-sm">
                      <span className="tabular-nums text-ink-2">{n.t}</span>
                      <span className={n.done ? "font-medium" : ""}>{n.text}</span>
                    </li>
                  ))}
                </ul>
              </Reveal>
            </div>
            <Reveal className="relative aspect-[4/3] lg:col-span-6 lg:-mr-10 lg:aspect-[5/4]" delay={100}>
              <Image
                src="/assets/minna-editorial/minna-mom-mode.png"
                alt="The Minna Core beside a checklist"
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
            </Reveal>
          </div>
        </section>

        {/* Section 3: Real life */}
        <section className="border-t border-line py-20 sm:py-28" aria-labelledby="life-title">
          <div className="mx-auto max-w-[1600px] px-5 sm:px-10">
            <Reveal>
              <h2 id="life-title" className="display text-[19vw] sm:text-[12vw] xl:text-[11rem]">
                Made for
                <br />
                real life.
              </h2>
            </Reveal>
            <div className="mt-16 grid gap-16 lg:grid-cols-12">
              <Reveal className="lg:col-span-5">
                <h3 className="display text-5xl">Students</h3>
                <ul className="mt-6 border-t border-line text-lg">
                  {["Assignments and exams, with study sessions planned before", "A packing list every evening from your timetable", "Deadlines that remind you early enough to act", "Plans with friends, practice, the dentist"].map((t) => (
                    <li key={t} className="border-b border-line py-3">
                      {t}
                    </li>
                  ))}
                </ul>
              </Reveal>
              <Reveal className="lg:col-span-5 lg:col-start-8 lg:mt-40" delay={120}>
                <h3 className="display text-5xl">Professionals</h3>
                <ul className="mt-6 border-t border-line text-lg">
                  {["Follow-ups you promised in a meeting", "Prep reminders before the meetings that matter", "No work notifications outside your work hours", "A short routine to plan the day and close the week"].map((t) => (
                    <li key={t} className="border-b border-line py-3">
                      {t}
                    </li>
                  ))}
                </ul>
              </Reveal>
            </div>
          </div>
          <Reveal className="relative mx-auto mt-20 aspect-[16/9] max-w-[1600px] sm:aspect-[21/9]">
            <Image
              src="/assets/minna-editorial/minna-organize.png"
              alt="The Minna Core beside a network of small glass cubes linked by blue lines"
              fill
              sizes="100vw"
              className="object-cover object-[60%_45%]"
            />
          </Reveal>
        </section>

        {/* Section 4: Memory */}
        <section className="bg-bg-2 py-20 sm:py-28" aria-labelledby="memory-title">
          <div className="mx-auto grid max-w-[1600px] gap-12 px-5 sm:px-10 lg:grid-cols-12">
            <Reveal className="lg:col-span-7">
              <p className="eyebrow">Memory</p>
              <h2 id="memory-title" className="display mt-4 text-[19vw] sm:text-[12vw] lg:text-[9vw] xl:text-[9.5rem]">
                Your second
                <br />
                brain.
              </h2>
              <p className="mt-6 max-w-md text-xl leading-snug">
                Minna can keep the things worth knowing about you, so its suggestions fit how you actually live.
              </p>
            </Reveal>
            <Reveal className="lg:col-span-5 lg:pt-24" delay={120}>
              <p className="eyebrow mb-3">For example</p>
              <ul className="border-t border-ink/15">
                {[
                  ["Studies math on Mondays", "Saved by Minna"],
                  ["Prefers reminders in the evening", "Added by you"],
                  ["Football practice on Tuesdays", "Added by you"],
                ].map(([t, s]) => (
                  <li key={t} className="flex items-baseline justify-between gap-4 border-b border-ink/15 py-3">
                    <span>{t}</span>
                    <span className="shrink-0 text-xs text-ink-2">{s}</span>
                  </li>
                ))}
              </ul>
              <ul className="mt-8 space-y-2 text-sm text-ink-2">
                <li>Off until you turn it on.</li>
                <li>See, edit or delete every memory.</li>
                <li>Stored on your device. No sensitive traits.</li>
              </ul>
            </Reveal>
          </div>
        </section>

        {/* About */}
        <section id="about" className="scroll-mt-10 py-20 sm:py-28" aria-labelledby="about-title">
          <div className="mx-auto grid max-w-[1600px] gap-10 px-5 sm:px-10 lg:grid-cols-12">
            <Reveal className="lg:col-span-4">
              <p className="eyebrow">About</p>
              <h2 id="about-title" className="display mt-4 text-6xl">
                Why Minna
              </h2>
            </Reveal>
            <Reveal className="lg:col-span-6 lg:col-start-6" delay={100}>
              <p className="text-2xl leading-snug">
                Minna started with a simple problem: forgetting the books for school, the deadline, the thing you promised, and
                someone having to remind you. Again.
              </p>
              <p className="mt-6 max-w-xl text-ink-2">
                So Minna does the reminding. It&apos;s persistent when it matters and quiet when it doesn&apos;t. Your reminders
                and memories stay on your device, and you can export or delete them whenever you like.
              </p>
            </Reveal>
          </div>
        </section>

        {/* Final CTA */}
        <section className="relative overflow-hidden border-t border-line pt-20 pb-10 sm:pt-28" aria-labelledby="cta-title">
          <div className="mx-auto max-w-[1600px] px-5 sm:px-10">
            <Reveal>
              <h2 id="cta-title" className="display relative z-0 text-[22vw] sm:text-[17vw] xl:text-[16rem]">
                Make room
                <br />
                for more.
              </h2>
            </Reveal>
            <div className="pointer-events-none relative z-10 ml-auto -mt-[2vw] mr-[-10vw] w-[58vw] sm:absolute sm:right-[-9vw] sm:top-[16%] sm:mt-0 sm:mr-0 sm:w-[34vw] 2xl:right-[-60px] 2xl:w-[520px]">
              <Core size="100%" />
            </div>
            <Reveal className="relative z-20 mt-12 flex flex-wrap items-center gap-6">
              <Link href="/app" className="btn-primary !px-6 !py-3.5 text-base">
                Meet your assistant
              </Link>
              <p className="text-sm text-ink-2">Free to try. Works in your browser and on your home screen.</p>
            </Reveal>
          </div>

          <footer className="mx-auto mt-24 flex max-w-[1600px] flex-col gap-4 border-t border-line px-5 pt-6 text-sm text-ink-2 sm:flex-row sm:items-center sm:justify-between sm:px-10">
            <span className="display text-2xl tracking-normal text-ink">Minna<span className="text-vermilion">.</span></span>
            <nav className="flex flex-wrap gap-6" aria-label="Footer">
              {NAV.map((n) => (
                <a key={n.href} href={n.href} className="hover:text-ink">
                  {n.label}
                </a>
              ))}
              <Link href="/app" className="hover:text-ink">
                Open the app
              </Link>
            </nav>
            <span>© {new Date().getFullYear()} Minna</span>
          </footer>
        </section>
      </main>
    </div>
  );
}
