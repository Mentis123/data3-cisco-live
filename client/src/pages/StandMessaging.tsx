import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { standMessaging } from "@/lib/standMessaging";

export default function StandMessaging() {
  const { side1, side2, side3, side4 } = standMessaging;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black text-slate-100">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10 lg:px-8">
        <header className="space-y-3 text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-primary/70">Data#3 | Cisco Live</p>
          <h1 className="text-3xl font-semibold sm:text-4xl">Stand Messaging Dashboard</h1>
          <p className="text-sm text-slate-300">Quick-launch view for booth displays. Designed to mirror the four-panel signage.</p>
        </header>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="flex h-full flex-col border-slate-800/60 bg-slate-900/80 backdrop-blur">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl text-white">{side1.title}</CardTitle>
              <CardDescription className="text-slate-300">{side1.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col justify-between gap-6">
              <div className="grid grid-cols-2 gap-4">
                {side1.stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-lg border border-slate-800/70 bg-slate-950/70 p-4 shadow-inner"
                  >
                    <div className="text-2xl font-bold text-white sm:text-3xl">{stat.value}</div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-primary/80">
                      {stat.label}
                    </div>
                    {stat.helper ? (
                      <p className="mt-1 text-xs text-slate-400">{stat.helper}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="text-xs text-slate-400/90">{side1.footer}</CardFooter>
          </Card>

          <Card className="flex h-full flex-col border-none bg-gradient-to-br from-primary via-primary/90 to-secondary text-primary-foreground shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-3xl font-semibold">{side2.title}</CardTitle>
              <CardDescription className="text-primary-foreground/80 text-sm">{side2.subtitle}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-5">
              <div className="rounded-lg border border-primary/20 bg-black/20 p-4 text-left shadow-inner">
                <h2 className="text-lg font-medium uppercase tracking-widest text-primary-foreground/80">Today&apos;s Promise</h2>
                <p className="mt-2 text-2xl font-semibold leading-tight sm:text-3xl">{side2.highlight}</p>
              </div>

              <ul className="space-y-3 text-sm">
                {side2.pillars.map((pillar) => (
                  <li key={pillar} className="flex items-start gap-3">
                    <span className="mt-1 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-bold text-white">
                      ✓
                    </span>
                    <span className="text-base font-medium text-primary-foreground/90">{pillar}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-auto space-y-2 rounded-xl border-2 border-dashed border-white/40 bg-white/10 p-4 text-center">
                <p className="text-xs font-semibold uppercase tracking-widest text-white/70">{side2.shoutOutLabel}</p>
                <p className="text-sm text-white/80">{side2.shoutOutHint}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="flex h-full flex-col border-slate-800/60 bg-slate-900/75">
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl text-white">{side3.title}</CardTitle>
              <CardDescription className="text-slate-300">{side3.hook}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-5 text-left">
              <ol className="space-y-4">
                {side3.instructions.map((instruction, index) => (
                  <li key={instruction.title} className="flex items-start gap-4">
                    <span className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/20 text-lg font-semibold text-primary">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-base font-semibold text-white">{instruction.title}</p>
                      <p className="text-sm text-slate-300">{instruction.detail}</p>
                    </div>
                  </li>
                ))}
              </ol>

              <div className="mt-auto flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-slate-700 p-4 text-center">
                <div className="aspect-square w-24 rounded bg-slate-800/80" aria-hidden="true" />
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Scan to play</p>
                <p className="text-sm text-slate-300">{side3.hook}</p>
              </div>
            </CardContent>
            <CardFooter className="text-xs text-slate-400/80">{side3.footer}</CardFooter>
          </Card>

          <Card className="flex h-full flex-col items-center justify-center border-slate-800/60 bg-slate-950/80 text-center">
            <CardHeader className="items-center pb-2">
              <CardTitle className="text-lg uppercase tracking-[0.4em] text-primary/80">{side4.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col items-center justify-center gap-4">
              <blockquote className="text-3xl font-semibold leading-tight text-white sm:text-4xl">
                “{side4.quote}”
              </blockquote>
              <p className="text-sm font-medium uppercase tracking-[0.3em] text-primary/70">{side4.attribution}</p>
              <p className="text-sm text-slate-300">{side4.context}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
