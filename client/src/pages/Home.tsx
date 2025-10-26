import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import headerImage from "@assets/pixio-chat-image-2025-09-12T14-04-15-596Z_1757685866445.jpg";

export default function Home() {
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTermsError, setShowTermsError] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground safe-area-padding">
      {/* Navigation Header */}
      <header className="mobile-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center flex-shrink-0">
                <i className="fas fa-network-wired text-background text-lg sm:text-xl"></i>
              </div>
              <div className="min-w-0">
                <div className="flex items-center">
                  <h1 className="text-[1.1rem] sm:text-xl font-semibold leading-tight truncate">Cisco Solution Sprint</h1>
                  <div className="ml-1 flex items-center">
                    <Link href="/admin-leaderboard">
                      <button
                        className="px-2 py-1 text-transparent transition-colors hover:text-muted-foreground/10"
                        aria-label="Admin"
                        data-testid="button-secret-admin"
                      >
                        •
                      </button>
                    </Link>
                    <Link href="/stand">
                      <button
                        className="px-2 py-1 text-transparent transition-colors hover:text-muted-foreground/10"
                        aria-label="Stand signage"
                        data-testid="button-secret-stand"
                      >
                        ·
                      </button>
                    </Link>
                  </div>
                </div>
                <p className="text-[0.825rem] sm:text-sm text-muted-foreground hidden sm:block tracking-wide">Data<sup className="text-primary">#</sup>3 | Cisco Live Melbourne</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/beta">
                <Button variant="default" size="sm" className="min-h-[44px] px-3 sm:px-4" data-testid="button-beta">
                  <i className="fas fa-flask sm:mr-2"></i>
                  <span className="hidden sm:inline">Beta</span>
                </Button>
              </Link>
              <Link href="/leaderboard">
                <Button variant="secondary" size="sm" className="min-h-[44px] px-3 sm:px-4" data-testid="button-leaderboard">
                  <i className="fas fa-trophy sm:mr-2"></i>
                  <span className="hidden sm:inline">Leaderboard</span>
                </Button>
              </Link>
              <Link href="/how-to-play">
                <Button
                  variant="outline"
                  size="sm"
                  className="min-h-[44px] px-3 sm:px-4"
                  data-testid="button-how-to-play"
                >
                  <i className="fas fa-question-circle sm:mr-2"></i>
                  <span className="hidden sm:inline">How to Play</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-4 sm:py-8">
        {/* Hero Section */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="relative h-48 sm:h-64 mb-6 sm:mb-8 rounded-xl sm:rounded-2xl overflow-hidden glass-panel">
            <img 
              src={headerImage} 
              alt="Melbourne tech skyline" 
              className="w-full h-full object-cover opacity-70"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent"></div>
            <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 right-4 sm:right-6">
              <h2 className="text-balance text-[clamp(1.65rem,5.8vw,2.25rem)] sm:text-4xl font-bold leading-[1.15] sm:leading-tight mb-1 sm:mb-2 text-white">
                Can you beat the bot?
              </h2>
              <p className="text-pretty text-[0.975rem] sm:text-xl leading-relaxed text-white/90">
                Bring the frustration that&apos;s slowing your team, size the impact, and see if our AI puts you on the board.
              </p>
            </div>
          </div>

          <Card className="glass-panel border-0 mb-6 sm:mb-8">
            <CardContent className="p-4 sm:p-8">
              <h3 className="text-balance text-[1.25rem] sm:text-2xl font-bold leading-tight mb-3 sm:mb-4">This is your sprint</h3>
              <p className="text-pretty text-[0.975rem] sm:text-lg leading-relaxed text-muted-foreground mb-4 sm:mb-6">
                Tell us the business headache that&apos;s burning time or trust, show the stakes, and let our AI coach and judge
                decide if you really can beat the bot.
              </p>

              {/* How it works section */}
              <div className="mb-6 sm:mb-8">
                <h4 className="text-balance text-lg sm:text-xl font-bold leading-tight mb-4 sm:mb-5 text-center">Three moves to make</h4>
                <ul className="space-y-3 sm:space-y-4 text-left text-[0.975rem] sm:text-base leading-relaxed text-muted-foreground max-w-2xl mx-auto text-pretty">
                  <li className="flex items-start gap-3">
                    <i className="fas fa-comment-dots text-primary text-lg sm:text-xl mt-1"></i>
                    <span>
                      <span className="font-semibold text-foreground">Share the frustration.</span> Tell us what&apos;s grinding your
                      team to a halt.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <i className="fas fa-chart-line text-primary text-lg sm:text-xl mt-1"></i>
                    <span>
                      <span className="font-semibold text-foreground">Estimate the impact.</span> Put numbers around the time,
                      cost, or customer hit.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <i className="fas fa-robot text-primary text-lg sm:text-xl mt-1"></i>
                    <span>
                      <span className="font-semibold text-foreground">Let the bot decide.</span> The AI coach scores your pitch and
                      drops you straight onto the live leaderboard.
                    </span>
                  </li>
                </ul>
              </div>

              {/* Terms & Conditions */}
              <div className={`bg-muted/20 rounded-lg sm:rounded-xl p-4 sm:p-6 mb-4 sm:mb-6 transition-all ${showTermsError ? 'ring-2 ring-destructive animate-pulse' : ''}`}>
                <h4 className="text-lg sm:text-xl font-semibold leading-tight mb-3 flex items-center">
                  <i className="fas fa-shield-alt text-primary mr-2"></i>
                  Terms & Conditions
                </h4>
                <ul className="text-left space-y-1.5 sm:space-y-2 text-[0.95rem] sm:text-base leading-relaxed text-muted-foreground mb-3 sm:mb-4 list-disc list-inside text-pretty">
                  <li>Playing means you accept the Data<sup className="text-primary">#</sup>3 privacy notice and Cisco Live terms.</li>
                  <li>The leaderboard only shows your first name and last initial.</li>
                  <li>An AI judge scores every submission, and Data<sup className="text-primary">#</sup>3 may reuse standout entries for demonstrations.</li>
                  <li>Data<sup className="text-primary">#</sup>3 employees and their families are not eligible for prizes.</li>
                </ul>

                <label className="flex items-start space-x-3 cursor-pointer touch-manipulation">
                  <Checkbox
                    checked={acceptedTerms}
                    onCheckedChange={(checked) => {
                      setAcceptedTerms(!!checked);
                      if (checked) setShowTermsError(false);
                    }}
                    className={`flex-shrink-0 mt-0.5 ${showTermsError ? 'ring-2 ring-destructive' : ''}`}
                    data-testid="checkbox-accept-terms"
                  />
                  <span className={`text-[0.95rem] sm:text-base leading-relaxed ${showTermsError ? 'text-destructive font-semibold' : ''}`}>
                    I accept these terms, including the privacy notice, and confirm my entry matches my Cisco Live badge details.
                  </span>
                </label>
                {showTermsError && (
                  <p className="text-destructive text-[0.95rem] sm:text-base mt-2 flex items-center">
                    <i className="fas fa-exclamation-circle mr-1"></i>
                    Please accept the Terms & Conditions to proceed
                  </p>
                )}
              </div>

              {/* Main Action Buttons */}
              <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
                <Button 
                  onClick={() => {
                    if (!acceptedTerms) {
                      setShowTermsError(true);
                      setTimeout(() => setShowTermsError(false), 3000);
                    } else {
                      window.location.href = "/play";
                    }
                  }}
                  className="w-full min-h-[60px] sm:min-h-[64px] px-4 py-3 text-base sm:text-lg touch-manipulation"
                  data-testid="button-solve-problem"
                >
                  <i className="fas fa-lightbulb mr-2 sm:mr-3 text-lg sm:text-xl"></i>
                  <div className="text-left">
                    <div className="font-bold">Beat the Bot</div>
                    <div className="text-[0.95rem] sm:text-base leading-snug opacity-90">Pitch your frustration and see if you score.</div>
                  </div>
                </Button>

                <Link href="/leaderboard">
                  <Button variant="secondary" className="w-full min-h-[60px] sm:min-h-[64px] px-4 py-3 text-base sm:text-lg touch-manipulation" data-testid="button-view-leaderboard">
                    <i className="fas fa-trophy mr-2 sm:mr-3 text-lg sm:text-xl"></i>
                    <div className="text-left">
                      <div className="font-bold">See the Leaderboard</div>
                      <div className="text-[0.95rem] sm:text-base leading-snug opacity-90">Track who the bot is crowning right now.</div>
                    </div>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Auto-categorization message */}
          <p className="text-[0.9rem] text-center leading-snug text-muted-foreground text-pretty">
            Your challenge will be automatically categorized for the live leaderboard
          </p>
        </div>
      </div>
    </div>
  );
}