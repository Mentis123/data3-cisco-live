import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

export default function Home() {
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTermsError, setShowTermsError] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 glass-panel">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                <i className="fas fa-network-wired text-background text-lg"></i>
              </div>
              <div>
                <h1 className="text-xl font-bold">Cisco Solution Sprint</h1>
                <p className="text-sm text-muted-foreground">Data#3 | Cisco Live Melbourne</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Link href="/leaderboard">
                <Button variant="secondary" data-testid="button-leaderboard">
                  <i className="fas fa-trophy mr-2"></i>Leaderboard
                </Button>
              </Link>
              <Button 
                variant="outline" 
                onClick={() => window.open("/static/cisco_live_how_to_play.html", "_blank")}
                data-testid="button-how-to-play"
              >
                <i className="fas fa-question-circle mr-2"></i>How to Play
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="relative h-64 mb-8 rounded-2xl overflow-hidden glass-panel">
            <img 
              src="https://images.unsplash.com/photo-1514890547357-a9ee288728e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=600" 
              alt="Melbourne skyline at sunset" 
              className="w-full h-full object-cover opacity-50"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent"></div>
            <div className="absolute bottom-6 left-6 right-6">
              <h2 className="text-4xl font-bold mb-2 text-white">Cisco Solution Sprint</h2>
              <p className="text-xl text-white/90">Innovate. Compete. Win at Cisco Live Melbourne 2025</p>
            </div>
          </div>

          <Card className="glass-panel border-0 mb-8">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-4">Welcome to the Challenge</h3>
              <p className="text-lg text-muted-foreground mb-6">
                Propose innovative business solutions using Cisco technologies. Chat with our AI assistant to refine your ideas, 
                then compete on the live leaderboard for prizes and recognition.
              </p>
              
              {/* Terms & Conditions */}
              <div className={`bg-muted/20 rounded-xl p-6 mb-6 transition-all ${showTermsError ? 'ring-2 ring-destructive animate-pulse' : ''}`}>
                <h4 className="text-lg font-semibold mb-3 flex items-center">
                  <i className="fas fa-shield-alt text-primary mr-2"></i>
                  Terms & Conditions
                </h4>
                <div className="text-left space-y-2 text-sm text-muted-foreground mb-4">
                  <p>• Participation requires acceptance of Data#3 privacy notice and Cisco Live terms</p>
                  <p>• Only first name and last initial will be displayed on public leaderboards</p>
                  <p>• Solutions will be scored by AI against published criteria</p>
                  <p>• Submissions become property of Data#3 for demonstration purposes</p>
                  <p>• Data#3 employees and family members are not eligible for prizes</p>
                </div>
                
                <label className="flex items-start space-x-3 cursor-pointer">
                  <Checkbox 
                    checked={acceptedTerms}
                    onCheckedChange={(checked) => {
                      setAcceptedTerms(!!checked);
                      if (checked) setShowTermsError(false);
                    }}
                    className={showTermsError ? 'ring-2 ring-destructive' : ''}
                    data-testid="checkbox-accept-terms"
                  />
                  <span className={`text-sm ${showTermsError ? 'text-destructive font-semibold' : ''}`}>
                    I accept the Terms & Conditions and privacy notice, and confirm my details match my Cisco Live registration badge.
                  </span>
                </label>
                {showTermsError && (
                  <p className="text-destructive text-sm mt-2 flex items-center">
                    <i className="fas fa-exclamation-circle mr-1"></i>
                    Please accept the Terms & Conditions to proceed
                  </p>
                )}
              </div>

              {/* Main Action Buttons */}
              <div className="grid md:grid-cols-2 gap-4">
                <Button 
                  onClick={() => {
                    if (!acceptedTerms) {
                      setShowTermsError(true);
                      setTimeout(() => setShowTermsError(false), 3000);
                    } else {
                      window.location.href = "/play";
                    }
                  }}
                  className="w-full h-16 text-lg"
                  data-testid="button-solve-problem"
                >
                  <i className="fas fa-lightbulb mr-3 text-xl"></i>
                  <div className="text-left">
                    <div className="font-bold">Solve a Problem</div>
                    <div className="text-sm opacity-90">Propose your solution</div>
                  </div>
                </Button>
                
                <Link href="/leaderboard">
                  <Button variant="secondary" className="w-full h-16 text-lg" data-testid="button-view-leaderboard">
                    <i className="fas fa-trophy mr-3 text-xl"></i>
                    <div className="text-left">
                      <div className="font-bold">View Leaderboard</div>
                      <div className="text-sm opacity-90">See live rankings</div>
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
