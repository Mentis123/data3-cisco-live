import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

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
                  <h1 className="text-base sm:text-xl font-bold truncate">Cisco Solution Sprint</h1>
                  <Link href="/admin-leaderboard">
                    <button 
                      className="ml-2 px-2 py-1 text-background bg-background hover:text-muted-foreground/20 transition-colors"
                      aria-label="Admin"
                      data-testid="button-secret-admin"
                    >
                      •
                    </button>
                  </Link>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Data#3 | Cisco Live Melbourne</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/leaderboard">
                <Button variant="secondary" size="sm" className="min-h-[44px] px-3 sm:px-4" data-testid="button-leaderboard">
                  <i className="fas fa-trophy sm:mr-2"></i>
                  <span className="hidden sm:inline">Leaderboard</span>
                </Button>
              </Link>
              <Button 
                variant="outline" 
                size="sm"
                className="min-h-[44px] px-3 sm:px-4"
                onClick={() => window.open("/static/cisco_live_how_to_play.html", "_blank")}
                data-testid="button-how-to-play"
              >
                <i className="fas fa-question-circle sm:mr-2"></i>
                <span className="hidden sm:inline">How to Play</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-4 sm:py-8">
        {/* Hero Section */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="relative h-48 sm:h-64 mb-6 sm:mb-8 rounded-xl sm:rounded-2xl overflow-hidden glass-panel">
            <img 
              src="https://images.unsplash.com/photo-1514890547357-a9ee288728e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=600" 
              alt="Melbourne skyline at sunset" 
              className="w-full h-full object-cover opacity-50"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent"></div>
            <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 right-4 sm:right-6">
              <h2 className="text-2xl sm:text-4xl font-bold mb-1 sm:mb-2 text-white">Cisco Solution Sprint</h2>
              <p className="text-sm sm:text-xl text-white/90">Innovate. Compete. Win at Cisco Live Melbourne 2025</p>
            </div>
          </div>

          <Card className="glass-panel border-0 mb-6 sm:mb-8">
            <CardContent className="p-4 sm:p-8">
              <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Welcome to the Challenge</h3>
              <p className="text-base sm:text-lg text-muted-foreground mb-4 sm:mb-6">
                Propose innovative business solutions using Cisco technologies. Chat with our AI assistant to refine your ideas, 
                then compete on the live leaderboard for prizes and recognition.
              </p>
              
              {/* Terms & Conditions */}
              <div className={`bg-muted/20 rounded-lg sm:rounded-xl p-4 sm:p-6 mb-4 sm:mb-6 transition-all ${showTermsError ? 'ring-2 ring-destructive animate-pulse' : ''}`}>
                <h4 className="text-base sm:text-lg font-semibold mb-3 flex items-center">
                  <i className="fas fa-shield-alt text-primary mr-2"></i>
                  Terms & Conditions
                </h4>
                <div className="text-left space-y-1 sm:space-y-2 text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
                  <p>• Participation requires acceptance of Data#3 privacy notice and Cisco Live terms</p>
                  <p>• Only first name and last initial will be displayed on public leaderboards</p>
                  <p>• Solutions will be scored by AI against published criteria</p>
                  <p>• Submissions become property of Data#3 for demonstration purposes</p>
                  <p>• Data#3 employees and family members are not eligible for prizes</p>
                </div>
                
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
                  <span className={`text-xs sm:text-sm leading-relaxed ${showTermsError ? 'text-destructive font-semibold' : ''}`}>
                    I accept the Terms & Conditions and privacy notice, and confirm my details match my Cisco Live registration badge.
                  </span>
                </label>
                {showTermsError && (
                  <p className="text-destructive text-xs sm:text-sm mt-2 flex items-center">
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
                    <div className="font-bold">Solve a Problem</div>
                    <div className="text-xs sm:text-sm opacity-90">Propose your solution</div>
                  </div>
                </Button>
                
                <Link href="/leaderboard">
                  <Button variant="secondary" className="w-full min-h-[60px] sm:min-h-[64px] px-4 py-3 text-base sm:text-lg touch-manipulation" data-testid="button-view-leaderboard">
                    <i className="fas fa-trophy mr-2 sm:mr-3 text-lg sm:text-xl"></i>
                    <div className="text-left">
                      <div className="font-bold">View Leaderboard</div>
                      <div className="text-xs sm:text-sm opacity-90">See live rankings</div>
                    </div>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
