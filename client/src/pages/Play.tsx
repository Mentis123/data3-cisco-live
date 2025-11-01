import { useState, useEffect, useRef } from "react";
import { useLocation, Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import headerImage from "@assets/pixio-chat-image-2025-09-12T14-04-15-596Z_1757685866445.jpg";
import ringFullImage from "@assets/ringfull.jpg";
import { SprintStepper } from "@/components/SprintStepper";
import { SprintProvider, useSprint, isSubmitCommand, advanceToNextStep, goToStep } from "@/features/sprint/context";
import { expandProblem, quantifyImpact, composeSubmission, inferMissingData } from "@/features/sprint/compose";
import type { SprintStep } from "@/features/sprint/types";
import { TriviaCardDeck } from "@/components/trivia-cards/TriviaCardDeck";
import {
  triviaCardDeck,
  triviaCardCategoryMeta,
  isTriviaCardCategory,
  type TriviaCardCategory,
} from "@/data/triviaCards";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { TriviaWarmup } from "@/components/trivia";

type CategoryTheme = {
  border: string;
  background: string;
  text: string;
  subheading: string;
  badgeBg: string;
  badgeText: string;
  shadow: string;
};

// Unified Data#3 brand theme for all categories
const UNIFIED_THEME: CategoryTheme = {
  border: "rgba(0, 174, 255, 0.50)",
  background: "rgba(0, 123, 195, 0.15)",
  text: "#EEEEEE",
  subheading: "rgba(120, 220, 255, 0.90)",
  badgeBg: "#00AEFF",
  badgeText: "#000025",
  shadow: "0 20px 70px -40px rgba(0, 174, 255, 0.70)",
};

const CATEGORY_THEMES: Record<TriviaCardCategory, CategoryTheme> = {
  SECURE_CONNECTIVITY: UNIFIED_THEME,
  HYBRID_DC: UNIFIED_THEME,
  COLLAB_CX: UNIFIED_THEME,
  OBSERVABILITY: UNIFIED_THEME,
  EDGE_IOT: UNIFIED_THEME,
};

const getCategoryTheme = (category: string | null | undefined): CategoryTheme => {
  if (category && isTriviaCardCategory(category)) {
    return CATEGORY_THEMES[category];
  }
  return CATEGORY_THEMES.EDGE_IOT;
};

type PlayVariant = "classic" | "ring";

type PlayContentProps = {
  variant?: PlayVariant;
};

export function PlayContent({ variant = "classic" }: PlayContentProps) {
  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { state, dispatch } = useSprint();

  const isRing = variant === "ring";
  const exitDestination = isRing ? "/" : "/old";
  const [hasCompletedTrivia, setHasCompletedTrivia] = useState(!isRing);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [sessionToken, setSessionToken] = useState<string>("");
  const [currentMessage, setCurrentMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [triviaDeckOpen, setTriviaDeckOpen] = useState(false);
  const [mobileInsightsOpen, setMobileInsightsOpen] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedSubmission, setEditedSubmission] = useState<any>(null);
  const [triviaScore, setTriviaScore] = useState<number | null>(null);
  const [triviaAttemptId, setTriviaAttemptId] = useState<string | null>(null);
  const [showOfficialRunConfirm, setShowOfficialRunConfirm] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTermsError, setShowTermsError] = useState(false);

  const selectedCategoryLabel = isTriviaCardCategory(selectedCategory)
    ? triviaCardCategoryMeta[selectedCategory].name
    : null;

  const selectedCategoryTheme = getCategoryTheme(selectedCategory);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Email validation helper
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [state.messages, isTyping]);

  // Check for max inputs
  useEffect(() => {
    if (state.inputsCount >= 6 && state.step < 4) {
      toast({
        title: "Maximum inputs reached",
        description: "You've reached the 6-input limit. Type 'submit' to complete your solution or 'back' to adjust.",
      });
    }
  }, [state.inputsCount, state.step, toast]);

  const startSessionMutation = useMutation({
    mutationFn: async ({ firstName, lastName, email }: { firstName: string; lastName: string; email?: string }) => {
      const response = await apiRequest("POST", "/api/start", { firstName, lastName, email });
      return response.json();
    },
    onSuccess: (data) => {
      setSessionToken(data.sessionToken);
      setRegistrationComplete(true);

      // For ring mode, don't add the initial message yet - wait until after trivia
      // For classic mode, add the initial message immediately
      if (!isRing) {
        dispatch({
          type: 'ADD_MESSAGE',
          payload: {
            role: "assistant",
            content: `Hi ${firstName}! Let's create a winning solution together. I'll guide you through 3 quick steps.

**Step 1: Name the Problem** 🎯

Tell me about a specific business challenge that:
• Wastes time or resources
• Creates friction for users
• Causes errors or delays
• Impacts productivity

Just describe it naturally - what's the problem that needs solving?`
          }
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const chatMutation = useMutation({
    mutationFn: async ({ message }: { message: string }) => {
      const response = await apiRequest("POST", "/api/chat", { 
        sessionToken, 
        messages: [{ role: "user", content: message }],
        sprintStep: state.step,
        previousProblem: state.problem?.userInput,
        previousImpact: state.impact?.userInput
      });
      return response.json();
    },
    onSuccess: (data) => {
      setIsTyping(false);
      
      // Process the response based on current step
      handleAIResponse(data.content);
    },
    onError: (error) => {
      setIsTyping(false);
      toast({
        title: "Chat Error", 
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const submitSolutionMutation = useMutation({
    mutationFn: async () => {
      if (isSubmitting) {
        throw new Error("Already submitting, please wait...");
      }
      setIsSubmitting(true);

      // Ensure we have all data
      const { problem, impact } = inferMissingData(
        state.problem,
        state.impact
      );

      const submission = state.submission || composeSubmission(problem, impact);

      const response = await apiRequest("POST", "/api/submit", {
        sessionToken,
        solutionText: state.messages.map(m => `${m.role}: ${m.content}`).join("\n\n"),
        triviaAttemptId: triviaAttemptId ?? undefined,
        structuredFields: submission,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setIsSubmitting(false);

      // Store complete submission data for announcement page
      const submissionData = {
        id: `submission-${Date.now()}`,
        participantName: `${firstName} ${lastName.charAt(0)}.`,
        firstName,
        lastName,
        category: data.category || 'SECURE_CONNECTIVITY',
        totalScore: data.finalScore,
        rank: data.rank,
        subScores: data.subscores,
        createdAt: new Date().toISOString(),
        botBar: data.botBar,
        isEligible: data.isEligible,
        raffleEntered: data.raffleEntered,
        alreadyEntered: data.alreadyEntered,
      };

      sessionStorage.setItem('newSubmissionData', JSON.stringify(submissionData));
      sessionStorage.setItem(
        "playSubmissionAudio",
        JSON.stringify({ timestamp: Date.now() })
      );

      // Navigate to announcement page
      setLocation('/announcement');
    },
    onError: (error) => {
      setIsSubmitting(false);
      toast({
        title: "Submission Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAIResponse = (content: string) => {
    // Add assistant message
    dispatch({
      type: 'ADD_MESSAGE',
      payload: { role: 'assistant', content }
    });

    // Extract structured data from AI response based on current step
    if (state.step === 1) {
      // Extract problem from the user's input (last user message)
      const lastUserMessage = state.messages.filter(m => m.role === 'user').pop();
      if (lastUserMessage) {
        const problem = expandProblem(lastUserMessage.content);
        dispatch({ type: 'SET_PROBLEM', payload: problem });
      }
      advanceToNextStep(dispatch, state.step);
    } else if (state.step === 2) {
      // Extract impact from the user's input
      const lastUserMessage = state.messages.filter(m => m.role === 'user').pop();
      if (lastUserMessage) {
        const impact = quantifyImpact(lastUserMessage.content, state.problem?.userInput);
        dispatch({ type: 'SET_IMPACT', payload: impact });
      }
      advanceToNextStep(dispatch, state.step);
    } else if (state.step === 3) {
      // Check if the AI response confirms proceeding
      const lowerContent = content.toLowerCase();
      if (lowerContent.includes('ready to submit') || lowerContent.includes('solution is ready') || lowerContent.includes('proceed with this')) {
        // Prepare submission if not already done
        if (!state.submission && state.problem && state.impact) {
          const submission = composeSubmission(state.problem, state.impact);
          dispatch({ type: 'SET_SUBMISSION', payload: submission });
        }
      }
    }
  };

  const handleSendMessage = () => {
    if (!currentMessage.trim() || isTyping) return;
    if (state.inputsCount >= 6) {
      toast({
        title: "Input limit reached",
        description: "Type 'submit' to complete or 'back' to adjust",
        variant: "destructive",
      });
      return;
    }

    const userMessage = currentMessage.trim();
    setCurrentMessage("");
    setIsTyping(true);

    // Add user message and increment input count
    dispatch({ type: 'ADD_USER_INPUT', payload: userMessage });

    // Easter egg: Cat command shows categories
    if (userMessage.toLowerCase() === 'cat') {
      const categoryList = `Here are the 5 categories:

1. SECURE_CONNECTIVITY - Zero Trust & Secure Connectivity
2. HYBRID_DC - Data Centre & Hybrid Cloud  
3. COLLAB_CX - Collaboration & Contact Centre
4. OBSERVABILITY - Observability & Performance
5. EDGE_IOT - Edge & IoT Solutions

Reply with the number and letter (e.g., "1a" for low scoring, "1b" for high scoring).`;
      
      dispatch({ type: 'ADD_MESSAGE', payload: { role: 'assistant', content: categoryList } });
      setIsTyping(false);
      return;
    }

    // Handle category selection (e.g., "1a", "3b", etc.)
    const categoryMatch = userMessage.match(/^([1-5])([ab])$/i);
    if (categoryMatch) {
      const categoryNum = parseInt(categoryMatch[1]);
      const scoringLevel = categoryMatch[2].toLowerCase();
      
      handleCategorySelection(categoryNum, scoringLevel);
      return;
    }

    // Check for submit command - only allow in Step 3 or beyond
    if (isSubmitCommand(userMessage) && state.step >= 3) {
      handleSubmitCommand();
      return;
    }

    // Check for confirmation in Step 3
    if (state.step === 3 && (userMessage.toLowerCase().includes('yes') || userMessage.toLowerCase().includes('proceed') || userMessage.toLowerCase().includes('confirm'))) {
      handleProceedToSubmit();
      return;
    }

    // Always use AI for all responses
    chatMutation.mutate({ message: userMessage });
  };

  const handleSubmitCommand = () => {
    // Infer any missing data
    const { problem, impact } = inferMissingData(
      state.problem,
      state.impact
    );

    // Compose submission
    const submission = composeSubmission(problem, impact);
    dispatch({ type: 'SET_SUBMISSION', payload: submission });

    // Move to submit step
    goToStep(dispatch, 4);
    setIsTyping(false);
  };

  const handleProceedToSubmit = () => {
    if (!state.problem || !state.impact) {
      handleSubmitCommand();
      return;
    }

    const submission = composeSubmission(state.problem, state.impact);
    dispatch({ type: 'SET_SUBMISSION', payload: submission });
    goToStep(dispatch, 4);
    setIsTyping(false);
  };

  const testSubmissions = {
    1: { // SECURE_CONNECTIVITY
      a: {
        problem: "Our company has security issues and people can access things they shouldn't",
        impact: "It's bad for business and costs money"
      },
      b: {
        problem: "Remote employees access critical financial systems through legacy VPN with no device verification, creating 47 security incidents monthly averaging 3.2 hours remediation each",
        impact: "147.4 hours monthly × $180/hour security analyst cost = $26,532 monthly ($318,384 annually). Current system allows lateral movement - one compromised device accessed 12 different systems in October breach"
      }
    },
    2: { // HYBRID_DC
      a: {
        problem: "Our servers are slow and we need cloud integration",
        impact: "Takes too long to do things and users complain"
      },
      b: {
        problem: "Three physical data centers running 340 VMs on aging hardware with 23% average CPU utilization, taking 6-8 weeks to provision new services while business demands 48-hour deployment cycles",
        impact: "Current provisioning: 6 weeks × $150K delayed project revenue × 12 annual requests = $10.8M opportunity cost. Resource waste: 77% unused compute capacity × $2.3M annual infrastructure spend = $1.77M inefficiency"
      }
    },
    3: { // COLLAB_CX
      a: {
        problem: "Customer calls are handled poorly and meetings don't work well",
        impact: "Customers are unhappy and productivity is low"
      },
      b: {
        problem: "Contact center experiences 34% first-call resolution rate with average 8.2-minute handle time, while 73% of customer escalations stem from agent inability to access integrated customer data during calls",
        impact: "Poor FCR costs: 66% callbacks × 14,200 monthly calls × 8.2 min average × $0.85/min = $67,588 monthly ($811K annually). Agent productivity loss: 73% escalations requiring supervisor intervention averaging 12 additional minutes = $156K annual labor cost"
      }
    },
    4: { // OBSERVABILITY
      a: {
        problem: "Network is sometimes slow and we can't see what's wrong",
        impact: "Users complain and IT doesn't know how to fix things quickly"
      },
      b: {
        problem: "Network outages detected reactively after 23-minute average user-reported delays, with root cause analysis taking 4.7 hours across 15 distributed sites using manual troubleshooting methods",
        impact: "Downtime cost: 23 minutes × 850 users × $95/hour productivity = $30,658 per incident. MTTR reduction opportunity: Current 4.7 hours vs target 45 minutes = 4.25 hours savings × $180/hour NOC analyst × 18 monthly incidents = $41,310 monthly savings"
      }
    },
    5: { // EDGE_IOT
      a: {
        problem: "Factory equipment isn't connected and we need IoT",
        impact: "Can't monitor things properly and maintenance is reactive"
      },
      b: {
        problem: "Manufacturing line sensors generate 2.3TB daily data transmitted to cloud for processing, creating 340ms latency causing 12 false-positive shutdown alerts monthly and $47K in unnecessary production stops",
        impact: "Current cloud processing: 340ms latency × 12 false shutdowns × $3,900 average restart cost = $46,800 monthly waste. Edge processing opportunity: Reduce latency to 15ms enabling real-time decision making, preventing 89% false positives and saving $41,652 monthly ($499,824 annually)"
      }
    }
  };

  const handleCategorySelection = (categoryNum: number, scoringLevel: string) => {
    const submission = testSubmissions[categoryNum as keyof typeof testSubmissions];
    if (!submission) {
      setIsTyping(false);
      return;
    }

    const data = submission[scoringLevel as 'a' | 'b'];
    if (!data) {
      setIsTyping(false);
      return;
    }

    // Simulate the three-step process with the test data
    const problem = expandProblem(data.problem);
    const impact = quantifyImpact(data.impact, data.problem);

    // Set all the data and advance to final submission
    dispatch({ type: 'SET_PROBLEM', payload: problem });
    dispatch({ type: 'SET_IMPACT', payload: impact });
    const finalSubmission = composeSubmission(problem, impact);
    dispatch({ type: 'SET_SUBMISSION', payload: finalSubmission });
    
    // Add confirmation message
    const confirmMessage = `Test submission loaded: Category ${categoryNum}, ${scoringLevel === 'a' ? 'Low' : 'High'} scoring. Ready to submit!`;
    dispatch({ type: 'ADD_MESSAGE', payload: { role: 'assistant', content: confirmMessage } });
    
    // Go to step 4 (submit)
    goToStep(dispatch, 4);
    setIsTyping(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleStepClick = (step: SprintStep) => {
    if (step < state.step) {
      goToStep(dispatch, step);
    }
  };

  const handleStartChat = () => {
    if (!firstName.trim() || !lastName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in your first and last name.",
        variant: "destructive",
      });
      return;
    }

    // For ring mode, validate terms acceptance before showing confirmation dialog
    if (isRing) {
      if (!acceptedTerms) {
        setShowTermsError(true);
        setTimeout(() => setShowTermsError(false), 3000);
        return;
      }
      setShowOfficialRunConfirm(true);
    } else {
      startSessionMutation.mutate({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim() || undefined,
      });
    }
  };

  const handleConfirmOfficialRun = () => {
    setShowOfficialRunConfirm(false);
    startSessionMutation.mutate({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim() || undefined,
    });
  };

  // Registration view
  if (!registrationComplete) {
    if (isRing) {
      return (
        <div className="min-h-screen min-h-[100dvh] bg-[radial-gradient(circle_at_top,_#1e3a8a_0%,_#020617_60%)] text-slate-100">
          <div className="mx-auto w-full max-w-6xl px-6 py-6">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1 text-sm font-semibold uppercase tracking-[0.3em] text-white/90">
              <span className="inline-block h-2 w-2 rounded-full bg-cyan-400"></span>
              Official Attempt
            </div>
          </div>
          <div className="mx-auto grid w-full max-w-6xl gap-10 px-6 pb-12 lg:grid-cols-[1.25fr_1fr]">
            <div className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-2xl border border-white/20 bg-white/5 shadow-xl sm:h-28 sm:w-28">
                  <img
                    src={ringFullImage}
                    alt="Data#3 Solution Sprint Ring"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                </div>
                <h1 className="text-balance text-4xl font-semibold leading-tight sm:text-5xl">
                  Enter the Ring
                </h1>
              </div>
              <div className="space-y-4">
                <p className="max-w-2xl text-pretty text-lg text-slate-200">
                  Check in with your Cisco Live badge name and email, answer 5 trivia then face the Sprint Coach and build your project pitch. Score high enough and win a raffle entry.
                </p>
                {triviaScore !== null && (
                  <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-1 text-sm font-semibold text-cyan-200">
                    <i className="fas fa-check-circle"></i>
                    Trivia: {triviaScore}/60
                  </div>
                )}
              </div>
            </div>

            <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
              <CardHeader className="space-y-2">
                <CardTitle className="text-2xl font-semibold text-white">Badge check-in</CardTitle>
                <p className="text-sm text-slate-200/80">
                  Use the name on your Cisco Live badge. Only initials appear on the leaderboard; we use the full name for raffle verification.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-semibold text-white/80">
                      Email address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your.name@company.com"
                      className="border-white/10 bg-slate-950/40 text-base text-white placeholder:text-slate-400"
                      data-testid="input-email"
                    />
                    <p className="text-xs text-slate-300/70">
                      Required for raffle eligibility. By submitting, you consent to being contacted if you win.
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-sm font-semibold text-white/80">
                        First name
                      </Label>
                      <Input
                        id="firstName"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="As printed on your badge"
                        className="border-white/10 bg-slate-950/40 text-base text-white placeholder:text-slate-400"
                        data-testid="input-first-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-sm font-semibold text-white/80">
                        Last name
                      </Label>
                      <Input
                        id="lastName"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="We show the initial only"
                        className="border-white/10 bg-slate-950/40 text-base text-white placeholder:text-slate-400"
                        data-testid="input-last-name"
                      />
                    </div>
                  </div>
                </div>

                {/* Terms & Conditions */}
                <div className={`rounded-2xl border border-white/10 bg-slate-900/60 p-4 text-sm text-slate-200 space-y-3 transition-all ${showTermsError ? 'ring-2 ring-destructive animate-pulse' : ''}`}>
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
                    <span className={`text-sm leading-relaxed ${showTermsError ? 'text-destructive font-semibold' : 'text-slate-200/90'}`}>
                      I agree to the{' '}
                      <a
                        href="https://www.data3.com/"
                        target="_blank"
                        rel="noreferrer"
                        className="underline decoration-dotted underline-offset-4 text-cyan-300 hover:text-cyan-200"
                      >
                        Terms &amp; Conditions
                      </a>{' '}
                      and confirm my entry matches my Cisco Live badge details.
                    </span>
                  </label>
                  {showTermsError && (
                    <p className="text-destructive text-sm flex items-center">
                      <i className="fas fa-exclamation-circle mr-1"></i>
                      Please review the Terms & Conditions before you start
                    </p>
                  )}
                </div>

                <Button
                  onClick={handleStartChat}
                  disabled={!firstName.trim() || !lastName.trim() || !email.trim() || !isValidEmail(email) || startSessionMutation.isPending}
                  className="w-full bg-cyan-500 text-cyan-950 hover:bg-cyan-400 disabled:opacity-30 disabled:cursor-not-allowed"
                  data-testid="button-start-chat"
                >
                  {startSessionMutation.isPending ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-cyan-950" />
                      Checking badge...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-play mr-2"></i>
                      Enter the ring
                    </>
                  )}
                </Button>

                <Button
                  variant="ghost"
                  onClick={() => setLocation(exitDestination)}
                  className="w-full border border-white/10 bg-transparent text-slate-200 hover:bg-white/10"
                >
                  <i className="fas fa-arrow-left mr-2"></i>
                  Back to home
                </Button>

                <p className="text-xs text-center text-slate-400">
                  Average run time under 3 minutes. Need help? Flag down a Sprint Captain.
                </p>
              </CardContent>
            </Card>
          </div>

          <AlertDialog open={showOfficialRunConfirm} onOpenChange={setShowOfficialRunConfirm}>
            <AlertDialogContent className="border-white/10 bg-slate-900/95 text-white backdrop-blur-xl">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-2xl font-semibold text-white">
                  Ready to enter the Ring?
                </AlertDialogTitle>
                <AlertDialogDescription className="space-y-4 text-base text-slate-200/90">
                  <p className="leading-relaxed">
                    This is your <strong className="text-cyan-300">official competition entry</strong>. Your trivia score and case submission will count toward:
                  </p>
                  <ul className="space-y-2 text-left">
                    <li className="flex items-start gap-3">
                      <span aria-hidden="true" className="text-cyan-300">🏆</span>
                      <span>Leaderboard placement and final ranking</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span aria-hidden="true" className="text-cyan-300">🎫</span>
                      <span>Daily Meta AI Glasses raffle eligibility</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span aria-hidden="true" className="text-cyan-300">⏱️</span>
                      <span>One official attempt per category</span>
                    </li>
                  </ul>
                  <p className="pt-2 text-sm text-slate-300/80">
                    Please confirm the name you entered matches your Cisco Live badge exactly: <strong className="text-white">{firstName} {lastName}</strong>
                  </p>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="border-white/20 bg-transparent text-white/80 hover:bg-white/10 hover:text-white">
                  Go back
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleConfirmOfficialRun}
                  className="bg-cyan-500 text-cyan-950 hover:bg-cyan-400"
                >
                  <i className="fas fa-bolt mr-2"></i>
                  Let's Go!
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-background text-foreground py-4 sm:py-8 safe-area-padding">
        <div className="max-w-2xl mx-auto px-4">
          <div className="mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation(exitDestination)}
              className="text-muted-foreground hover:text-foreground"
              data-testid="button-home-registration"
            >
              <i className="fas fa-arrow-left mr-2"></i>
              Back to Home
            </Button>
          </div>

          <Card className="glass-panel border-0 overflow-hidden">
            <div className="relative h-32 sm:h-40">
              <img
                src={headerImage}
                alt="Melbourne tech skyline"
                className="w-full h-full object-cover opacity-60"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
                <CardTitle className="text-balance text-[clamp(1.6rem,5.5vw,2.25rem)] sm:text-3xl leading-[1.15] text-center mb-2 text-white drop-shadow-lg">
                  Data<sup className="text-primary">#</sup>3 Solution Sprint
                </CardTitle>
                <p className="text-pretty text-[0.95rem] sm:text-base text-center text-white/90 drop-shadow">
                  Quick Sprint to Your Winning Solution
                </p>
              </div>
            </div>
            <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6">
              <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <Label htmlFor="firstName" className="text-[0.95rem] sm:text-lg font-medium leading-tight mb-1.5">First Name</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="As shown on your badge"
                    className="mobile-input"
                    data-testid="input-first-name"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName" className="text-[0.95rem] sm:text-lg font-medium leading-tight mb-1.5">Last Name</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Only initial shown on leaderboard"
                    className="mobile-input"
                    data-testid="input-last-name"
                  />
                </div>
              </div>

              <Card className="mb-6 bg-primary/5 border-primary/20">
                <CardHeader>
                  <CardTitle className="text-balance text-lg sm:text-xl leading-tight">
                    <i className="fas fa-rocket mr-2 text-primary"></i>
                    Your 3-Reply Sprint
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">1</div>
                      <div>
                        <p className="font-semibold text-[1rem] leading-tight">Name the Problem</p>
                        <p className="text-[0.95rem] text-muted-foreground leading-snug">Share your business challenge</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">2</div>
                      <div>
                        <p className="font-semibold text-[1rem] leading-tight">Quantify Impact</p>
                        <p className="text-[0.95rem] text-muted-foreground leading-snug">Time, cost, or risk estimates</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">3</div>
                      <div>
                        <p className="font-semibold text-[1rem] leading-tight">Review & Submit</p>
                        <p className="text-[0.95rem] text-muted-foreground leading-snug">Lock KPIs, confirm the plan, then score instantly</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-secondary/10 rounded-lg">
                    <p className="text-[0.9rem] text-center leading-snug text-pretty">
                      💡 <strong>Pro tip:</strong> Submit anytime to jump to final review
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Button
                onClick={handleStartChat}
                disabled={!firstName.trim() || !lastName.trim() || !email.trim() || !isValidEmail(email) || startSessionMutation.isPending}
                className="w-full min-h-[52px] text-base sm:text-lg touch-manipulation disabled:opacity-30 disabled:cursor-not-allowed"
                data-testid="button-start-chat"
              >
                {startSessionMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Checking In...
                  </>
                ) : (
                  <>
                    <i className="fas fa-bolt mr-2"></i>
                    Start Your Sprint
                  </>
                )}
              </Button>

              <p className="text-sm text-center leading-snug text-muted-foreground">
                Average completion: 3 replies • Max: 6 inputs
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isRing && registrationComplete && !hasCompletedTrivia) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-data3-blue-black via-[#000025] to-data3-blue-black text-data3-white p-4 sm:p-6 lg:p-8">
        <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-10 px-4 pb-16 pt-10 sm:px-6 sm:pt-12 lg:px-8 border-4 border-data3-pale-blue/50 rounded-3xl shadow-[0_0_40px_rgba(120,220,255,0.3),inset_0_0_40px_rgba(120,220,255,0.1)] bg-gradient-to-br from-data3-blue-black/50 via-transparent to-data3-blue-black/50 backdrop-blur-sm">
          <div className="flex flex-row flex-wrap items-center gap-6">
            <div className="flex items-center justify-start gap-4">
              <div className="relative h-28 w-28 overflow-hidden rounded-2xl border border-white/10 bg-white/10 shadow-2xl shadow-cyan-500/20 ring-2 ring-cyan-400/20 sm:h-32 sm:w-32">
                <img
                  src={ringFullImage}
                  alt="Ring"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
            <div className="space-y-4 text-left sm:max-w-2xl">
              <h1 className="text-4xl font-semibold sm:text-5xl">Beat the Bot</h1>
              <p className="max-w-3xl text-pretty text-base text-data3-white/80 sm:text-lg">
                This is your official attempt. Answer Data#3 trivia pulled from the live stats deck — your score counts toward the leaderboard.
              </p>
            </div>
          </div>
          <TriviaWarmup
            mode="ring"
            exitHref={exitDestination}
            email={email}
            firstName={firstName}
            lastName={lastName}
            onContinue={(score?: number, category?: string, attemptId?: string) => {
              setHasCompletedTrivia(true);
              if (score !== undefined) {
                setTriviaScore(score);
              }
              if (category) {
                setSelectedCategory(category);
              }
              if (attemptId) {
                setTriviaAttemptId(attemptId);
              }

              // Initialize the pitcher project chat conversation after trivia completion
              dispatch({
                type: 'ADD_MESSAGE',
                payload: {
                  role: "assistant",
                  content: `Excellent work, ${firstName}! You scored ${score || 0}/60 on the trivia.

Now let's move to your **Project Pitch** — the core of your Beat the Bot entry.

I'll guide you through 3 quick steps to craft a winning business case:

**Step 1: Name the Problem** 🎯

Tell me about a specific business challenge that:
• Wastes time or resources
• Creates friction for users
• Causes errors or delays
• Impacts productivity

Just describe it naturally - what's the problem that needs solving?`
                }
              });
            }}
            className="h-full"
          />

          <div className="flex flex-wrap gap-3">
            <Link href="/">
              <Button variant="secondary" className="backdrop-blur">
                Back to home
              </Button>
            </Link>
            <Link href="/dojo">
              <Button className="shadow-[0_25px_70px_-40px_rgba(0,174,255,0.9)]">
                Train in the Dojo
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const triviaDeckDialog = (
    <Dialog open={triviaDeckOpen} onOpenChange={setTriviaDeckOpen}>
      <DialogContent className="max-w-4xl border border-white/10 bg-slate-950/95 text-white backdrop-blur-xl">
        <DialogHeader className="space-y-2">
        <DialogTitle className="text-2xl font-semibold text-white">Practice trivia cards</DialogTitle>
          <DialogDescription className="text-sm text-slate-300">
            Work through each dial with instant rationales before you lock your score.
          </DialogDescription>
        </DialogHeader>
        <TriviaCardDeck cards={triviaCardDeck} />
      </DialogContent>
    </Dialog>
  );

  // Submit/Review view
  if (state.step === 4 && state.submission) {
    const currentSubmission = editedSubmission || state.submission;

    if (isRing) {
      const submissionCategory = currentSubmission?.chosen_category ?? selectedCategory;
      const submissionTheme = getCategoryTheme(submissionCategory);
      const submissionCategoryLabel =
        submissionCategory && isTriviaCardCategory(submissionCategory)
          ? triviaCardCategoryMeta[submissionCategory].name
          : selectedCategoryLabel;

      return (
        <Dialog open={triviaDeckOpen} onOpenChange={setTriviaDeckOpen}>
          <div className="min-h-screen min-h-[100dvh] bg-[radial-gradient(circle_at_top,_#0f172a_0%,_#020617_75%)] text-slate-100">
            <div className="mx-auto w-full max-w-6xl px-6 py-10 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-300/70">Sprint Coach</p>
                <h2 className="text-2xl font-semibold leading-tight sm:text-3xl">Final review</h2>
                <p className="text-sm text-slate-300/80">
                  Tighten anything before you lock your score and generate the raffle entry.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border border-cyan-400/40 bg-cyan-500/10 px-3 text-cyan-100 hover:bg-cyan-400/20 hover:text-white"
                  >
                    <i className="fas fa-bolt mr-2"></i>
                    Practice cards
                  </Button>
                </DialogTrigger>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => goToStep(dispatch, 3)}
                  className="border border-white/10 bg-white/10 text-white/80 hover:text-white"
                  data-testid="button-back-to-chat"
                >
                  <i className="fas fa-comments mr-2"></i>
                  Back to coach
                </Button>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
              <Card className="border-white/10 bg-slate-900/70 backdrop-blur-xl">
                <CardHeader className="space-y-4 pb-2">
                  <div className="space-y-2">
                    <CardTitle className="text-xl font-semibold text-white sm:text-2xl">
                      Lock your solution
                    </CardTitle>
                    <p className="text-sm text-slate-300/90">
                      Update the story or metrics below. Everything syncs instantly with the leaderboard.
                    </p>
                  </div>
                  <SprintStepper
                    currentStep={state.step}
                    completedSteps={state.completedSteps}
                    onStepClick={handleStepClick}
                    className="hidden lg:block"
                  />
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <Label className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200">
                      <i className="fas fa-lightbulb"></i>
                      Problem summary
                    </Label>
                    {isEditMode ? (
                      <Textarea
                        value={currentSubmission.problem_summary}
                        onChange={(e) => setEditedSubmission({ ...currentSubmission, problem_summary: e.target.value })}
                        className="min-h-[80px] border-white/10 bg-slate-950/60 text-base text-white placeholder:text-slate-400"
                        placeholder="Describe the problem..."
                      />
                    ) : (
                      <p className="text-base leading-relaxed text-slate-100/90">{currentSubmission.problem_summary}</p>
                    )}
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <Label className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200">
                      <i className="fas fa-chart-line"></i>
                      Impact summary
                    </Label>
                    {isEditMode ? (
                      <Textarea
                        value={currentSubmission.impact_summary}
                        onChange={(e) => setEditedSubmission({ ...currentSubmission, impact_summary: e.target.value })}
                        className="min-h-[80px] border-white/10 bg-slate-950/60 text-base text-white placeholder:text-slate-400"
                        placeholder="Summarise the quantified impact..."
                      />
                    ) : (
                      <p className="text-base leading-relaxed text-slate-100/90">{currentSubmission.impact_summary}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card className="border-white/10 bg-slate-900/60 backdrop-blur-xl">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-semibold text-white">Performance metrics</CardTitle>
                    <p className="text-sm text-slate-300/80">Baseline vs target goals that feed the scorecard.</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Baseline</p>
                        {currentSubmission.baseline_metrics.map((metric: any, idx: number) => (
                          <div key={idx} className="rounded-xl border border-white/10 bg-white/5 p-3">
                            {isEditMode ? (
                              <div className="space-y-2">
                                <Input
                                  value={metric.name}
                                  onChange={(e) => {
                                    const newMetrics = [...currentSubmission.baseline_metrics];
                                    newMetrics[idx] = { ...metric, name: e.target.value };
                                    setEditedSubmission({ ...currentSubmission, baseline_metrics: newMetrics });
                                  }}
                                  className="border-white/10 bg-slate-950/60 text-sm text-white placeholder:text-slate-400"
                                  placeholder="Metric name..."
                                />
                                <Input
                                  value={metric.value}
                                  onChange={(e) => {
                                    const newMetrics = [...currentSubmission.baseline_metrics];
                                    newMetrics[idx] = { ...metric, value: e.target.value };
                                    setEditedSubmission({ ...currentSubmission, baseline_metrics: newMetrics });
                                  }}
                                  className="border-white/10 bg-slate-950/60 text-sm text-white placeholder:text-slate-400"
                                  placeholder="Value..."
                                />
                              </div>
                            ) : (
                              <div>
                                <p className="text-sm font-medium text-white/90">{metric.name}</p>
                                <p className="text-sm text-slate-300/90">{metric.value}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="space-y-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Targets</p>
                        {currentSubmission.target_metrics.map((metric: any, idx: number) => (
                          <div key={idx} className="rounded-xl border border-white/10 bg-white/5 p-3">
                            {isEditMode ? (
                              <div className="space-y-2">
                                <Input
                                  value={metric.name}
                                  onChange={(e) => {
                                    const newMetrics = [...currentSubmission.target_metrics];
                                    newMetrics[idx] = { ...metric, name: e.target.value };
                                    setEditedSubmission({ ...currentSubmission, target_metrics: newMetrics });
                                  }}
                                  className="border-white/10 bg-slate-950/60 text-sm text-white placeholder:text-slate-400"
                                  placeholder="Metric name..."
                                />
                                <Input
                                  value={metric.target}
                                  onChange={(e) => {
                                    const newMetrics = [...currentSubmission.target_metrics];
                                    newMetrics[idx] = { ...metric, target: e.target.value };
                                    setEditedSubmission({ ...currentSubmission, target_metrics: newMetrics });
                                  }}
                                  className="border-white/10 bg-slate-950/60 text-sm text-white placeholder:text-slate-400"
                                  placeholder="Target..."
                                />
                              </div>
                            ) : (
                              <div>
                                <p className="text-sm font-medium text-white/90">{metric.name}</p>
                                <p className="text-sm text-cyan-300">{metric.target}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-white/10 bg-slate-900/60 backdrop-blur-xl">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-semibold text-white">Execution checklist</CardTitle>
                    <p className="text-sm text-slate-300/80">Share this with your Sprint Captain after you submit.</p>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm text-slate-200/90">
                    {currentSubmission.action_plan?.length ? (
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Action plan</p>
                        <ul className="space-y-2">
                          {currentSubmission.action_plan.map((item: string, idx: number) => (
                            <li key={idx} className="flex gap-2">
                              <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full border border-cyan-400/40 bg-cyan-500/10 text-xs text-cyan-200">
                                {idx + 1}
                              </span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    {currentSubmission.success_checks?.length ? (
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Success checks</p>
                        <ul className="space-y-1">
                          {currentSubmission.success_checks.map((item: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-2">
                              <i className="fas fa-check text-cyan-300"></i>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    {currentSubmission.risks?.length ? (
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Risks</p>
                        <ul className="space-y-1 text-amber-200/90">
                          {currentSubmission.risks.map((item: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-2">
                              <i className="fas fa-exclamation-triangle"></i>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>

                <Card className="border-white/10 bg-slate-900/60 backdrop-blur-xl">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-semibold text-white">Run stats</CardTitle>
                    <p className="text-sm text-slate-300/80">Quick snapshot before you lock the run.</p>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-slate-200/90">
                    <div className="flex items-center justify-between">
                      <span className="uppercase tracking-[0.25em] text-xs text-slate-400">Category</span>
                      <span className="font-semibold text-cyan-300">{currentSubmission.chosen_category}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="uppercase tracking-[0.25em] text-xs text-slate-400">Inputs used</span>
                      <span className="font-semibold">{state.inputsCount}/6</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="uppercase tracking-[0.25em] text-xs text-slate-400">Session</span>
                      <span className="font-mono text-xs text-slate-300/80">{sessionToken.slice(0, 8)}…</span>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex flex-col gap-3 sm:flex-row">
                  {isEditMode ? (
                    <>
                      <Button
                        onClick={() => {
                          dispatch({ type: 'UPDATE_SUBMISSION', payload: currentSubmission });
                          setIsEditMode(false);
                        }}
                        className="flex-1 bg-cyan-500 text-cyan-950 hover:bg-cyan-400"
                        data-testid="button-save-edits"
                      >
                        <i className="fas fa-save mr-2"></i>
                        Save changes
                      </Button>
                      <Button
                        onClick={() => {
                          setEditedSubmission(null);
                          setIsEditMode(false);
                        }}
                        variant="outline"
                        className="flex-1 border-white/20 bg-transparent text-white/80 hover:text-white"
                        data-testid="button-cancel-edit"
                      >
                        <i className="fas fa-times mr-2"></i>
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        onClick={() => {
                          setEditedSubmission(currentSubmission);
                          setIsEditMode(true);
                        }}
                        variant="outline"
                        className="flex-1 border-white/20 bg-transparent text-white/80 hover:text-white"
                        data-testid="button-edit-mode"
                      >
                        <i className="fas fa-edit mr-2"></i>
                        Tweak details
                      </Button>
                      <Button
                        onClick={() => submitSolutionMutation.mutate()}
                        disabled={isSubmitting}
                        className="flex-1 bg-cyan-500 text-cyan-950 hover:bg-cyan-400"
                        data-testid="button-submit-solution"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-cyan-950"></div>
                            Submitting…
                          </>
                        ) : (
                          <>
                            <i className="fas fa-trophy mr-2"></i>
                            Submit & compete
                          </>
                        )}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
            </div>
          </div>
          <DialogContent className="max-w-4xl border border-white/10 bg-slate-950/95 text-white backdrop-blur-xl">
            <DialogHeader className="space-y-2">
              <DialogTitle className="text-2xl font-semibold text-white">Practice trivia cards</DialogTitle>
              <DialogDescription className="text-sm text-slate-300">
                Work through each dial with instant rationales before you lock your score.
              </DialogDescription>
            </DialogHeader>
            <TriviaCardDeck cards={triviaCardDeck} />
          </DialogContent>
        </Dialog>
      );
    }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {triviaDeckDialog}
      {isRing && triviaScore !== null && (
        <div className="mx-auto w-full max-w-4xl px-4 pt-4">
          <div
            className="flex items-center justify-between rounded-2xl border px-4 py-3 text-sm"
            style={{
              borderColor: selectedCategoryTheme.border,
              backgroundColor: selectedCategoryTheme.background,
              color: selectedCategoryTheme.text,
              boxShadow: selectedCategoryTheme.shadow,
            }}
          >
            <div className="flex flex-col gap-1 text-left">
              <span
                className="text-xs uppercase tracking-[0.25em]"
                style={{ color: selectedCategoryTheme.subheading }}
              >
                Trivia locked
              </span>
              <span className="text-base font-semibold" style={{ color: selectedCategoryTheme.text }}>
                {triviaScore}/60 locked in
                {selectedCategoryLabel ? <span className="font-normal"> · {selectedCategoryLabel}</span> : null}
              </span>
            </div>
            <Badge
              variant="outline"
              className="rounded-full border-0 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.25em]"
              style={{
                backgroundColor: selectedCategoryTheme.badgeBg,
                color: selectedCategoryTheme.badgeText,
              }}
            >
              Official
            </Badge>
          </div>
        </div>
      )}
      <div className="flex-1 py-4 sm:py-8 safe-area-padding">
        <div className="max-w-4xl mx-auto px-4">
          <Card className="glass-panel border-0 overflow-hidden">
                <div className="relative bg-gradient-to-br from-primary via-primary/80 to-secondary text-primary-foreground">
                <div className="absolute inset-0 bg-black/10" aria-hidden="true" />
                <div className="absolute -top-12 right-0 h-32 w-32 rounded-full bg-white/20 blur-3xl" aria-hidden="true" />
                <div className="absolute bottom-0 left-0 h-24 w-24 rounded-full bg-white/10 blur-3xl" aria-hidden="true" />

                <div className="relative z-10 p-4 sm:p-6 space-y-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                      <p className="text-sm uppercase tracking-[0.08em] text-white/70">Sprint Coach</p>
                      <h2 className="text-xl sm:text-2xl font-semibold leading-tight">Final Review &amp; Submit</h2>
                      <p className="text-sm sm:text-base text-white/80 leading-snug">
                        Double-check your solution and send it for scoring.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border border-white/40 bg-white/10 text-white/90 hover:bg-white/20"
                        >
                          <i className="fas fa-bolt mr-2"></i>
                          Practice cards
                        </Button>
                      </DialogTrigger>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => goToStep(dispatch, 3)}
                        className="bg-white/15 text-white hover:bg-white/25"
                        data-testid="button-back-to-chat"
                      >
                        <i className="fas fa-comments mr-2"></i>
                        Back to Chat
                      </Button>
                    </div>
                  </div>

                  <SprintStepper
                    currentStep={state.step}
                    completedSteps={state.completedSteps}
                    onStepClick={handleStepClick}
                  />
                </div>
              </div>

              <CardHeader className="pb-4 sm:pb-6">
                <CardTitle className="text-[1.35rem] sm:text-2xl leading-tight">Final Review & Submit</CardTitle>
                <p className="text-base sm:text-lg leading-relaxed text-muted-foreground">
                  {isEditMode ? "Edit your solution details below" : "Your solution is ready! Review and submit for scoring."}
                </p>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6">
                {/* Problem Summary */}
                <div className="glass-panel rounded-lg p-3 sm:p-4">
                  <Label className="font-bold mb-2 flex items-center text-base sm:text-lg leading-tight">
                    <i className="fas fa-lightbulb text-primary mr-2"></i>
                    Problem Summary
                  </Label>
                  {isEditMode ? (
                    <Textarea
                      value={currentSubmission.problem_summary}
                      onChange={(e) => setEditedSubmission({...currentSubmission, problem_summary: e.target.value})}
                      className="text-base leading-relaxed min-h-[60px]"
                      placeholder="Describe the problem..."
                    />
                  ) : (
                    <p className="text-base leading-relaxed">{currentSubmission.problem_summary}</p>
                  )}
                </div>

                {/* Impact Summary */}
                <div className="glass-panel rounded-lg p-3 sm:p-4">
                  <Label className="font-bold mb-2 flex items-center text-base sm:text-lg leading-tight">
                    <i className="fas fa-chart-line text-primary mr-2"></i>
                    Impact Summary
                  </Label>
                  {isEditMode ? (
                    <Textarea
                      value={currentSubmission.impact_summary}
                      onChange={(e) => setEditedSubmission({ ...currentSubmission, impact_summary: e.target.value })}
                      className="text-base leading-relaxed min-h-[60px]"
                      placeholder="Summarise the quantified impact..."
                    />
                  ) : (
                    <p className="text-base leading-relaxed">{currentSubmission.impact_summary}</p>
                  )}
                </div>

                {/* Metrics */}
                <div className="glass-panel rounded-lg p-3 sm:p-4">
                  <Label className="font-bold mb-2 flex items-center text-base sm:text-lg leading-tight">
                    <i className="fas fa-bullseye text-primary mr-2"></i>
                    Baseline & Targets
                  </Label>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-semibold text-muted-foreground mb-1 leading-snug">Baseline Metrics</p>
                      {currentSubmission.baseline_metrics.map((metric: any, idx: number) => (
                        <div key={idx} className="text-base leading-snug mb-1">
                          {isEditMode ? (
                            <div className="flex gap-2">
                              <Input
                                value={metric.name}
                                onChange={(e) => {
                                  const newMetrics = [...currentSubmission.baseline_metrics];
                                  newMetrics[idx] = { ...metric, name: e.target.value };
                                  setEditedSubmission({ ...currentSubmission, baseline_metrics: newMetrics });
                                }}
                                className="text-base flex-1"
                                placeholder="Metric name..."
                              />
                              <Input
                                value={metric.value}
                                onChange={(e) => {
                                  const newMetrics = [...currentSubmission.baseline_metrics];
                                  newMetrics[idx] = { ...metric, value: e.target.value };
                                  setEditedSubmission({ ...currentSubmission, baseline_metrics: newMetrics });
                                }}
                                className="text-base flex-1"
                                placeholder="Value..."
                              />
                            </div>
                          ) : (
                            <>{metric.name}: <strong>{metric.value}</strong></>
                          )}
                        </div>
                      ))}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-muted-foreground mb-1 leading-snug">Target Metrics</p>
                      {currentSubmission.target_metrics.map((metric: any, idx: number) => (
                        <div key={idx} className="text-base leading-snug mb-1">
                          {isEditMode ? (
                            <div className="flex gap-2">
                              <Input
                                value={metric.name}
                                onChange={(e) => {
                                  const newMetrics = [...currentSubmission.target_metrics];
                                  newMetrics[idx] = { ...metric, name: e.target.value };
                                  setEditedSubmission({ ...currentSubmission, target_metrics: newMetrics });
                                }}
                                className="text-base flex-1"
                                placeholder="Metric name..."
                              />
                              <Input
                                value={metric.target}
                                onChange={(e) => {
                                  const newMetrics = [...currentSubmission.target_metrics];
                                  newMetrics[idx] = { ...metric, target: e.target.value };
                                  setEditedSubmission({ ...currentSubmission, target_metrics: newMetrics });
                                }}
                                className="text-base flex-1"
                                placeholder="Target..."
                              />
                            </div>
                          ) : (
                            <>{metric.name}: <strong>{metric.target}</strong></>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Submit Actions */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  {isEditMode ? (
                    <>
                      <Button
                        onClick={() => {
                          dispatch({ type: 'UPDATE_SUBMISSION', payload: currentSubmission });
                          setIsEditMode(false);
                        }}
                        className="flex-1"
                        data-testid="button-save-edits"
                      >
                        <i className="fas fa-save mr-2"></i>
                        Save Changes
                      </Button>
                      <Button
                        onClick={() => {
                          setEditedSubmission(null);
                          setIsEditMode(false);
                        }}
                        variant="outline"
                        className="flex-1"
                        data-testid="button-cancel-edit"
                      >
                        <i className="fas fa-times mr-2"></i>
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        onClick={() => {
                          setEditedSubmission(currentSubmission);
                          setIsEditMode(true);
                        }}
                        variant="outline"
                        className="flex-1"
                        data-testid="button-edit-mode"
                      >
                        <i className="fas fa-edit mr-2"></i>
                        Edit
                      </Button>
                      <Button
                        onClick={() => submitSolutionMutation.mutate()}
                        disabled={isSubmitting}
                        className="flex-1 btn-primary"
                        data-testid="button-submit-solution"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Submitting...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-trophy mr-2"></i>
                            Submit & Compete
                          </>
                        )}
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Chat view with stepper
  const exitDialog = (
    <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-pretty text-[1.05rem] sm:text-lg font-semibold">Exit Sprint?</AlertDialogTitle>
          <AlertDialogDescription className="text-pretty text-[0.95rem] sm:text-base leading-relaxed">
            Your progress will be lost if you exit now. Are you sure you want to leave?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Continue Sprint</AlertDialogCancel>
          <AlertDialogAction onClick={() => setLocation(exitDestination)}>
            Exit to Home
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  if (isRing) {
    const previewSubmission =
      state.submission ||
      (state.problem && state.impact ? composeSubmission(state.problem, state.impact) : null);

    const SprintMapCard = () => (
      <Card className="border-white/10 bg-slate-900/60 backdrop-blur-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-white">Sprint map</CardTitle>
          <p className="text-xs text-slate-300/80">Four beats to the leaderboard.</p>
        </CardHeader>
        <CardContent>
          <SprintStepper currentStep={state.step} completedSteps={state.completedSteps} onStepClick={handleStepClick} />
        </CardContent>
      </Card>
    );

    const CoachShortcutsCard = () => (
      <Card className="border-white/10 bg-slate-900/60 backdrop-blur-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-white">Coach shortcuts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-200/90">
          <p>
            <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs text-cyan-200">cat</code> show categories &amp; test runs
          </p>
          <p>
            <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs text-cyan-200">submit</code> jump straight to review
          </p>
          <p>Shift + Enter for a new line</p>
        </CardContent>
      </Card>
    );

    const SolutionSnapshotCard = () => (
      <Card className="border-white/10 bg-slate-900/60 backdrop-blur-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-white">Solution snapshot</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-200/90">
          {state.problem ? (
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Problem</p>
              <p className="mt-1 text-pretty leading-snug text-white/90">{state.problem.userInput}</p>
            </div>
          ) : (
            <p className="text-slate-400">Complete Step 1 to populate the snapshot.</p>
          )}
          {state.impact ? (
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Impact cues</p>
              <p className="mt-1 text-pretty leading-snug text-white/90">{state.impact.userInput}</p>
            </div>
          ) : null}
          {previewSubmission ? (
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2">
              <span className="text-xs uppercase tracking-[0.3em] text-slate-400">Category</span>
              <span className="font-semibold text-cyan-300">{previewSubmission.chosen_category}</span>
            </div>
          ) : null}
        </CardContent>
      </Card>
    );

    const MetricTargetsCard = () => (
      <Card className="border-white/10 bg-slate-900/60 backdrop-blur-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-white">Metric targets</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-200/90">
          {previewSubmission ? (
            <>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Baseline</p>
                <ul className="mt-2 space-y-2">
                  {previewSubmission.baseline_metrics.map((metric: any, idx: number) => (
                    <li key={idx} className="flex items-start justify-between gap-3">
                      <span className="text-slate-300/90">{metric.name}</span>
                      <span className="font-semibold text-white">{metric.value}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Target</p>
                <ul className="mt-2 space-y-2">
                  {previewSubmission.target_metrics.map((metric: any, idx: number) => (
                    <li key={idx} className="flex items-start justify-between gap-3">
                      <span className="text-slate-300/90">{metric.name}</span>
                      <span className="font-semibold text-cyan-300">{metric.target}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : (
            <p className="text-slate-400">Quantify the impact to generate baselines and targets.</p>
          )}
        </CardContent>
      </Card>
    );

    const ReadyToLockCard = () => (
      <Card className="border-white/10 bg-slate-900/60 backdrop-blur-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-white">Ready to lock it?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-200/90">
          <p>Finish the impact step to jump into the final review screen and submit for scoring.</p>
          <Button
            onClick={handleSubmitCommand}
            disabled={state.step < 2}
            className="w-full rounded-xl bg-cyan-500 text-cyan-950 hover:bg-cyan-400 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-slate-500"
          >
            Review &amp; submit
          </Button>
        </CardContent>
      </Card>
    );

    const PrimaryInsights = () => (
      <>
        <SprintMapCard />
        <CoachShortcutsCard />
      </>
    );

    const SecondaryInsights = () => (
      <>
        <SolutionSnapshotCard />
        <MetricTargetsCard />
        <ReadyToLockCard />
      </>
    );

    return (
      <>
        <Dialog open={triviaDeckOpen} onOpenChange={setTriviaDeckOpen}>
          <div className="min-h-screen min-h-[100dvh] bg-[radial-gradient(circle_at_top,_#020617_0%,_#0b1120_65%)] text-slate-100">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-6 lg:grid lg:grid-cols-[280px_minmax(0,1fr)_320px] lg:gap-6">
            {triviaScore !== null && (
              <div
                className="order-0 rounded-3xl border px-4 py-3 text-sm lg:col-span-3"
                style={{
                  borderColor: selectedCategoryTheme.border,
                  backgroundColor: selectedCategoryTheme.background,
                  color: selectedCategoryTheme.text,
                  boxShadow: selectedCategoryTheme.shadow,
                }}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <p
                      className="text-xs uppercase tracking-[0.3em]"
                      style={{ color: selectedCategoryTheme.subheading }}
                    >
                      Trivia locked
                    </p>
                    <p className="text-base font-semibold" style={{ color: selectedCategoryTheme.text }}>
                      {triviaScore}/60 locked in
                      {submissionCategoryLabel ? <span className="font-normal"> · {submissionCategoryLabel}</span> : null}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="rounded-full border-0 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.25em]"
                    style={{
                      backgroundColor: selectedCategoryTheme.badgeBg,
                      color: selectedCategoryTheme.badgeText,
                    }}
                  >
                    Official entry
                  </Badge>
                </div>
              </div>
            )}
            <section className="order-1 relative flex min-h-[60vh] flex-col rounded-3xl border border-white/10 bg-slate-900/70 backdrop-blur-xl lg:overflow-hidden">
              <div className="relative border-b border-white/10 bg-gradient-to-r from-cyan-500/30 via-slate-900/40 to-cyan-400/20 p-4 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-[0.3em] text-cyan-200/80">Sprint Coach</p>
                    <p className="text-sm text-slate-200/80">Follow the prompts — three replies max.</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <span className="rounded-full border border-cyan-400/50 bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200">
                      Step {state.step}/4
                    </span>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 border border-cyan-400/40 bg-cyan-500/10 px-3 text-cyan-100 hover:bg-cyan-400/20 hover:text-white"
                      >
                        <i className="fas fa-bolt mr-2"></i>
                        Practice cards
                      </Button>
                    </DialogTrigger>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowExitDialog(true)}
                      className="h-9 border border-white/20 bg-white/10 px-3 text-white/80 hover:text-white"
                      data-testid="button-exit-chat"
                    >
                      <i className="fas fa-door-open mr-2"></i>
                      Exit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setMobileInsightsOpen(true)}
                      className="h-9 border border-cyan-400/40 bg-cyan-500/10 px-3 text-cyan-100 hover:bg-cyan-400/20 hover:text-white lg:hidden"
                    >
                      <i className="fas fa-layer-group mr-2"></i>
                      Sprint insights
                    </Button>
                  </div>
                </div>
              </div>
              <div
                ref={chatContainerRef}
                className="flex-1 space-y-3 overflow-y-auto p-4 pb-28 sm:p-6 sm:pb-6"
                data-testid="chat-messages"
              >
                {state.messages.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-6 text-sm text-slate-300/80">
                    Kick off with the business problem. The coach replies instantly.
                  </div>
                ) : null}
                {state.messages.map((message, index) => {
                  if (message.role === 'assistant') {
                    return (
                      <div key={index} className="flex items-start gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-cyan-400/40 bg-cyan-500/10 text-cyan-200">
                          <i className="fas fa-robot"></i>
                        </div>
                        <div className="max-w-[75%] rounded-2xl border border-white/10 bg-white/5 p-3 text-sm leading-relaxed text-slate-100/90 whitespace-pre-wrap break-words">
                          {message.content}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={index} className="ml-auto flex items-start gap-3">
                      <div className="max-w-[75%] rounded-2xl border border-cyan-400/50 bg-cyan-500/10 p-3 text-sm leading-relaxed text-cyan-100 whitespace-pre-wrap break-words">
                        {message.content}
                      </div>
                      <div className="flex h-8 w-8 items-center justify-center rounded-full border border-cyan-400/40 bg-cyan-500/10 text-cyan-200">
                        <i className="fas fa-user"></i>
                      </div>
                    </div>
                  );
                })}
                {isTyping && (
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-cyan-400/40 bg-cyan-500/10 text-cyan-200">
                      <i className="fas fa-robot"></i>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                      <div className="flex gap-1">
                        <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-300"></span>
                        <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-300 [animation-delay:150ms]"></span>
                        <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-300 [animation-delay:300ms]"></span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              <div className="sticky bottom-0 left-0 right-0 border-t border-white/10 bg-slate-950/80 p-4 sm:p-6 lg:static lg:bg-slate-950/60 lg:backdrop-blur-none backdrop-blur-xl">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <Textarea
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={
                      state.step === 1
                        ? 'Drop the core problem…'
                        : state.step === 2
                        ? 'Quantify the impact — time, cost, risk…'
                        : state.step === 3
                        ? 'Confirm you’re ready to submit or fine tune…'
                        : 'Type your message…'
                    }
                    className="min-h-[56px] flex-1 resize-none rounded-2xl border border-white/10 bg-slate-950/40 text-base text-white placeholder:text-slate-400 focus-visible:border-cyan-400/60 focus-visible:ring-0"
                    disabled={isTyping || state.inputsCount >= 6}
                    data-testid="input-chat-message"
                  />
                  <div className="flex gap-2 sm:flex-none">
                    <Button
                      onClick={handleSendMessage}
                      disabled={!currentMessage.trim() || isTyping || state.inputsCount >= 6}
                      className="h-12 min-w-[52px] rounded-xl bg-cyan-500 text-cyan-950 hover:bg-cyan-400"
                      data-testid="button-send-message"
                    >
                      <i className="fas fa-paper-plane"></i>
                    </Button>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs font-medium uppercase tracking-[0.2em] text-slate-300/70 sm:text-sm sm:normal-case sm:tracking-normal sm:text-slate-300/80">
                  <span className="flex items-center gap-1 text-[0.7rem] sm:text-sm">
                    <i className="fas fa-circle-dot text-[0.55rem] text-cyan-300"></i>
                    Inputs {state.inputsCount}/6
                  </span>
                  {state.step >= 2 ? (
                    <Button
                      onClick={handleSubmitCommand}
                      variant="outline"
                      className="rounded-xl border-white/20 bg-transparent px-4 text-xs font-semibold uppercase tracking-[0.2em] text-white/80 hover:text-white sm:text-sm sm:font-normal sm:tracking-normal"
                      data-testid="button-quick-submit"
                    >
                      <i className="fas fa-gauge mr-2"></i>
                      Jump to review
                    </Button>
                  ) : (
                    <span className="text-[0.65rem] uppercase tracking-[0.3em] text-slate-500 sm:text-xs">Finish Step 1 to unlock review</span>
                  )}
                </div>
              </div>
            </section>

            <aside className="order-2 hidden space-y-4 lg:order-1 lg:block">
              <PrimaryInsights />
            </aside>

            <aside className="order-3 hidden space-y-4 lg:block">
              <SecondaryInsights />
            </aside>
          </div>
        </div>
        {exitDialog}
        <Sheet open={mobileInsightsOpen} onOpenChange={setMobileInsightsOpen}>
          <SheetContent
            side="bottom"
            className="h-[85vh] overflow-y-auto border-t border-white/10 bg-slate-950/95 text-white backdrop-blur-xl sm:h-[75vh]"
          >
            <SheetHeader className="text-left">
              <SheetTitle className="text-lg font-semibold text-white">Sprint insights</SheetTitle>
              <SheetDescription className="text-sm text-slate-300">
                Progress, shortcuts, and your draft in one quick view.
              </SheetDescription>
            </SheetHeader>
            <div className="mt-4 space-y-4 pb-8">
              <PrimaryInsights />
              <SecondaryInsights />
            </div>
          </SheetContent>
        </Sheet>
        <DialogContent className="max-w-4xl border border-white/10 bg-slate-950/95 text-white backdrop-blur-xl">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-2xl font-semibold text-white">Practice trivia cards</DialogTitle>
            <DialogDescription className="text-sm text-slate-300">
              Work through each dial with instant rationales before you lock your score.
            </DialogDescription>
          </DialogHeader>
          <TriviaCardDeck cards={triviaCardDeck} />
        </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <>
      <div className="min-h-screen min-h-[100dvh] bg-background text-foreground flex flex-col">
        <div className="flex-1 flex flex-col safe-area-padding overflow-hidden">
          <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col px-2 sm:px-4 py-4 overflow-hidden">
            <Card className="glass-panel border-0 overflow-hidden flex-1 flex flex-col">
              {/* Chat Header */}
              <div className="relative bg-gradient-to-br from-primary via-primary/80 to-secondary text-primary-foreground flex-shrink-0">
                <div className="absolute inset-0 bg-black/10" aria-hidden="true" />
                <div className="absolute -top-12 right-0 h-32 w-32 rounded-full bg-white/20 blur-3xl" aria-hidden="true" />
                <div className="absolute bottom-0 left-0 h-24 w-24 rounded-full bg-white/10 blur-3xl" aria-hidden="true" />
              <div className="relative z-10 p-4 sm:p-6 space-y-3 sm:space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/15 border border-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                      <i className="fas fa-robot text-lg sm:text-2xl"></i>
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-xl sm:text-2xl font-semibold leading-tight">Sprint Coach</h3>
                    </div>
                  </div>

                  <div className="ml-auto flex items-center gap-2">
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border border-white/30 bg-white/10 text-white/90 hover:bg-white/20"
                      >
                        <i className="fas fa-bolt mr-2"></i>
                        Practice cards
                      </Button>
                    </DialogTrigger>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowExitDialog(true)}
                      className="text-white/90 hover:text-white hover:bg-white/20"
                      data-testid="button-exit-chat"
                    >
                      <i className="fas fa-home mr-2"></i>
                      Exit
                    </Button>
                  </div>
                </div>

                <SprintStepper
                  currentStep={state.step}
                  completedSteps={state.completedSteps}
                    onStepClick={handleStepClick}
                  />
                </div>
              </div>

              {/* Chat Messages */}
              <div
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-3 sm:space-y-4 -webkit-overflow-scrolling-touch"
                data-testid="chat-messages"
              >
                {state.messages.map((message, index) => (
                  <div key={index} className="chat-message flex items-start gap-2 sm:gap-3">
                    {message.role === 'assistant' ? (
                      <>
                        <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center flex-shrink-0">
                          <i className="fas fa-robot text-white text-sm sm:text-base"></i>
                        </div>
                        <div className="glass-panel rounded-lg rounded-tl-none p-2.5 sm:p-4 max-w-[calc(100%-3rem)] sm:max-w-lg">
                          <div className="whitespace-pre-wrap text-[0.95rem] sm:text-base leading-relaxed text-foreground break-words overflow-wrap-anywhere text-pretty">
                            {message.content}
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-7 h-7 sm:w-8 sm:h-8 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
                          <i className="fas fa-user text-sm sm:text-base"></i>
                        </div>
                        <div className="bg-primary/10 border border-primary/20 rounded-lg rounded-tl-none p-2.5 sm:p-4 max-w-[calc(100%-3rem)] sm:max-w-lg">
                          <p className="whitespace-pre-wrap text-[0.95rem] sm:text-base leading-relaxed text-foreground break-words overflow-wrap-anywhere text-pretty">{message.content}</p>
                        </div>
                      </>
                    )}
                  </div>
                ))}

                {isTyping && (
                  <div className="chat-message flex items-start gap-2 sm:gap-3">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center flex-shrink-0">
                      <i className="fas fa-robot text-white text-sm sm:text-base"></i>
                    </div>
                    <div className="glass-panel rounded-lg rounded-tl-none p-2.5 sm:p-4">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <div className="p-2 sm:p-6 border-t border-border flex-shrink-0 bg-background">
                <div className="flex gap-2 sm:gap-3 w-full">
                  <Textarea
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={
                      state.step === 1 ? 'Describe your business problem...' :
                      state.step === 2 ? 'How often? Time lost? Cost impact?' :
                      state.step === 3 ? "Type 'yes' to proceed or adjust..." :
                      'Type your message...'
                    }
                    className="flex-1 min-h-[44px] sm:min-h-12 resize-none mobile-textarea text-[1rem] sm:text-base leading-relaxed max-h-[45vh] max-h-[45svh] overflow-y-auto"
                    disabled={isTyping || state.inputsCount >= 6}
                    data-testid="input-chat-message"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!currentMessage.trim() || isTyping || state.inputsCount >= 6}
                    className="min-h-[44px] min-w-[44px] sm:min-h-[48px] sm:min-w-[48px] px-2.5 sm:px-3 touch-manipulation"
                    data-testid="button-send-message"
                  >
                    <i className="fas fa-paper-plane"></i>
                  </Button>
                </div>

                {/* Input counter and Submit button */}
                <div className="mt-2 sm:mt-3 flex items-center justify-between gap-2">
                  <p className="text-[0.9rem] leading-snug text-muted-foreground flex-shrink-0">
                    Input {state.inputsCount}/6
                  </p>
                  {state.step >= 2 && (
                    <Button
                      onClick={handleSubmitCommand}
                      variant="outline"
                      size="sm"
                      className="text-[0.9rem] px-2 sm:px-3 py-1.5 h-auto touch-manipulation bg-secondary/10 hover:bg-secondary/20 border-secondary/20"
                      data-testid="button-quick-submit"
                    >
                      <i className="fas fa-rocket text-sm mr-1.5"></i>
                      Submit
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
      {exitDialog}
      {triviaDeckDialog}
    </>
  );

}

export default function Play() {
  return (
    <SprintProvider>
      <PlayContent />
    </SprintProvider>
  );
}
