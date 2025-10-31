import { Link } from "wouter";

import { Data3Logo } from "@/components/Data3Logo";
import ringImage from "@assets/ringfull.jpg";
import dojoImage from "@assets/dojofull.jpg";
import leaderboardImage from "@assets/leaderboardfull.jpg";
import howitworksImage from "@assets/howitworksfull.jpg";

// Claude: Removed unused data constants (categories, howItWorks, scoringTiers, quickRules, microFaq)
// These sections have been moved to the HowToPlay ("Learn") page as per UX refactor brief

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-data3-blue-black via-[#000025] to-data3-blue-black text-data3-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 pb-32 pt-4 sm:px-6 sm:pt-6 lg:px-8">
        {/* Hero Section: Data3 Logo (left) + Tagline (center) + Cisco Live Logo (right) */}
        <div className="flex items-center justify-between gap-2 sm:gap-4 w-full">
          <img
            src="/Data3_Logo_Blue_Blue_Boxed-01.png"
            alt="Data#3"
            className="h-12 w-auto sm:h-16 md:h-20 lg:h-24 flex-shrink-0"
            style={{ minWidth: "50px" }}
          />
          <h1 className="text-center text-sm sm:text-lg md:text-xl lg:text-2xl xl:text-3xl text-data3-white font-light tracking-wide flex-grow px-2 sm:px-4 whitespace-nowrap overflow-hidden text-ellipsis">
            Delivering the Digital Future
          </h1>
          <img
            src="/cisco_live.png"
            alt="Cisco Live"
            className="h-12 w-auto sm:h-16 md:h-20 lg:h-24 flex-shrink-0"
            style={{ minWidth: "50px" }}
          />
        </div>

        {/* "Beat the Bot" Section */}
        <section className="space-y-6 text-center">
          <p className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-data3-pale-blue">
            Beat the Bot
          </p>
          <div className="space-y-2">
            <p className="text-lg sm:text-xl text-data3-white/90">Training dojo</p>
            <p className="text-lg sm:text-xl text-data3-white/90">Enter the ring when you're ready</p>
            <p className="text-lg sm:text-xl text-data3-white/90">Every win is a raffle entry</p>
          </div>
        </section>

        {/* Hero Tiles Grid - Claude: Keep the 4 main navigation tiles */}
        <section className="space-y-8">
          <div className="mx-auto grid w-full max-w-2xl gap-4 sm:gap-5 sm:grid-cols-2">
            <Link href="/play" className="group">
              <div className="relative overflow-hidden rounded-2xl border border-data3-pale-blue/20 bg-gradient-to-br from-data3-blue/5 via-data3-blue/10 to-transparent shadow-lg transition-all duration-300 group-hover:-translate-y-2 group-hover:border-data3-light-blue/40 group-hover:shadow-[0_0_30px_rgba(0,174,255,0.35)]">
                <div className="relative aspect-square">
                  <img src={ringImage} alt="Enter the Ring" className="absolute inset-0 h-full w-full object-cover opacity-80 transition-opacity duration-300 group-hover:opacity-100" style={{ transform: 'scale(1.8)' }} />
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/5 to-transparent transition-colors duration-300 group-hover:from-white/15 group-hover:via-white/10 group-hover:to-white/5" />
                  <div className="relative z-10 flex h-full w-full flex-col items-center justify-center gap-4 px-6 text-center">
                    <span className="text-4xl sm:text-5xl font-bold text-data3-blue-black drop-shadow-md">Enter the Ring</span>
                  </div>
                </div>
              </div>
            </Link>
            <Link href="/dojo" className="group">
              <div className="relative overflow-hidden rounded-2xl border border-data3-pale-blue/20 bg-gradient-to-br from-data3-cool-purple/5 via-data3-cool-purple/10 to-transparent shadow-lg transition-all duration-300 group-hover:-translate-y-2 group-hover:border-data3-cool-purple/40 group-hover:shadow-[0_0_30px_rgba(115,0,255,0.35)]">
                <div className="relative aspect-square">
                  <img src={dojoImage} alt="Training Dojo" className="absolute inset-0 h-full w-full object-cover opacity-80 transition-opacity duration-300 group-hover:opacity-100" style={{ transform: 'scale(1.8)' }} />
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/5 to-transparent transition-colors duration-300 group-hover:from-white/15 group-hover:via-white/10 group-hover:to-white/5" />
                  <div className="relative z-10 flex h-full w-full flex-col items-center justify-center gap-4 px-6 text-center">
                    <span className="text-4xl sm:text-5xl font-bold text-data3-white drop-shadow-lg">Training Dojo</span>
                  </div>
                </div>
              </div>
            </Link>
            <Link href="/how-to-play" className="group">
              <div className="relative overflow-hidden rounded-2xl border border-data3-pale-blue/20 bg-gradient-to-br from-data3-light-blue/5 via-data3-light-blue/10 to-transparent shadow-lg transition-all duration-300 group-hover:-translate-y-2 group-hover:border-data3-aqua/40 group-hover:shadow-[0_0_30px_rgba(0,255,255,0.35)]">
                <div className="relative aspect-square">
                  <img src={howitworksImage} alt="How it works" className="absolute inset-0 h-full w-full object-cover opacity-80 transition-opacity duration-300 group-hover:opacity-100" style={{ transform: 'scale(1.8)' }} />
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/5 to-transparent transition-colors duration-300 group-hover:from-white/15 group-hover:via-white/10 group-hover:to-white/5" />
                  <div className="relative z-10 flex h-full w-full flex-col items-center justify-center gap-4 px-6 text-center">
                    <span className="text-4xl sm:text-5xl font-bold text-data3-white drop-shadow-lg">How to Play</span>
                  </div>
                </div>
              </div>
            </Link>
            <Link href="/leaderboard" className="group">
              <div className="relative overflow-hidden rounded-2xl border border-data3-pale-blue/20 bg-gradient-to-br from-data3-magenta/5 via-data3-magenta/10 to-transparent shadow-lg transition-all duration-300 group-hover:-translate-y-2 group-hover:border-data3-magenta/40 group-hover:shadow-[0_0_30px_rgba(255,0,255,0.35)]">
                <div className="relative aspect-square">
                  <img src={leaderboardImage} alt="View Leaderboard" className="absolute inset-0 h-full w-full object-cover opacity-80 transition-opacity duration-300 group-hover:opacity-100" style={{ transform: 'scale(1.8)' }} />
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/5 to-transparent transition-colors duration-300 group-hover:from-white/15 group-hover:via-white/10 group-hover:to-white/5" />
                  <div className="relative z-10 flex h-full w-full flex-col items-center justify-center gap-4 px-6 text-center">
                    <span className="text-4xl sm:text-5xl font-bold text-data3-blue-black drop-shadow-lg">View Leaderboard</span>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </section>
        {/* Steps Section */}
        <section className="space-y-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-data3-white">
            Three Moves to Enter
          </h2>
          <div className="grid gap-6 sm:grid-cols-3 max-w-5xl mx-auto">
            <div className="flex flex-col items-center text-center space-y-3 p-6 rounded-xl border border-data3-pale-blue/20 bg-white/5 backdrop-blur">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 text-white text-2xl font-bold">
                1
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-data3-white">Answer five trivia</p>
            </div>
            <div className="flex flex-col items-center text-center space-y-3 p-6 rounded-xl border border-data3-pale-blue/20 bg-white/5 backdrop-blur">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-purple-500 text-white text-2xl font-bold">
                2
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-data3-white">Pitch your project</p>
            </div>
            <div className="flex flex-col items-center text-center space-y-3 p-6 rounded-xl border border-data3-pale-blue/20 bg-white/5 backdrop-blur">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-400 to-pink-500 text-white text-2xl font-bold">
                3
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-data3-white">Beat the bot<br />Earn a raffle entry</p>
            </div>
          </div>
        </section>

        {/* Data#3 Branded Footer */}
        <footer className="border-t border-data3-pale-blue/20 pt-12 mt-8">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <img
                  src="/Data3_Logo_Blue_Blue_Boxed-01.png"
                  alt="Data#3"
                  className="h-12 w-auto"
                />
                <Link href="/admin">
                  <button
                    className="px-2 py-1 text-transparent transition-colors hover:text-muted-foreground/10"
                    aria-label="Admin"
                    data-testid="button-secret-admin"
                  >
                    •
                  </button>
                </Link>
              </div>
              <p className="text-sm text-data3-pale-blue">
                <Data3Logo className="font-semibold" /> - Delivering the Digital Future
              </p>
            </div>
            <div className="space-y-3">
              <h4 className="text-data3-light-blue font-bold text-sm uppercase tracking-wider">
                About <Data3Logo />
              </h4>
              <p className="text-sm text-data3-white/80 leading-relaxed">
                With 45+ years of experience, <Data3Logo className="font-semibold" /> is a leading Australian IT services provider focused on helping customers harness the power of people and technology for a better future.
              </p>
            </div>
            <div className="space-y-3">
              <h4 className="text-data3-light-blue font-bold text-sm uppercase tracking-wider">
                Learn More
              </h4>
              <a
                href="https://www.data3.com"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-sm text-data3-pale-blue hover:text-data3-light-blue transition-colors underline underline-offset-4"
              >
                www.data3.com
              </a>
              <p className="text-xs text-data3-grey mt-4">
                Grounded in Experience • Ever-Evolving • Human First
              </p>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-data3-pale-blue/10 text-center">
            <p className="text-sm text-data3-grey">
              © 2025 Data#3. Experience vibe coded by our resident{" "}
              <a
                href="https://www.linkedin.com/in/adam-aka-mentis"
                target="_blank"
                rel="noopener noreferrer"
                className="text-data3-light-blue hover:text-data3-aqua underline underline-offset-4"
              >
                Tech Wizard
              </a>
              .
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
