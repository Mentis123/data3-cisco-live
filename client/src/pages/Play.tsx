import { useState, useEffect, useLayoutEffect, useRef } from "react";
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
import { audioManager } from "@/lib/audio";
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
import { RingVideoModal } from "@/components/RingVideoModal";
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
import { BACK_TO_HOME_BUTTON_CLASSES, BACK_TO_HOME_ICON_CLASSES } from "@/constants/buttons";

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
  NETWORKING: UNIFIED_THEME,
  SECURITY: UNIFIED_THEME,
  COLLABORATION: UNIFIED_THEME,
  DATA_CENTER: UNIFIED_THEME,
};

const getCategoryTheme = (category: string | null | undefined): CategoryTheme => {
  if (category && isTriviaCardCategory(category)) {
    return CATEGORY_THEMES[category];
  }
  return CATEGORY_THEMES.NETWORKING;
};

// Helper function to format markdown bold syntax into HTML
const formatMarkdown = (text: string): string => {
  // Convert **bold** to <strong>bold</strong>
  return text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
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
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [isWinner, setIsWinner] = useState(false);

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
  const [isBooting, setIsBooting] = useState(false);
  const [bootingText, setBootingText] = useState('Analyzing your expertise...');
  const [showBars, setShowBars] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [showStepCompletionBanner, setShowStepCompletionBanner] = useState(false);
  const [completedStepNumber, setCompletedStepNumber] = useState<number | null>(null);

  const selectedCategoryLabel = isTriviaCardCategory(selectedCategory)
    ? triviaCardCategoryMeta[selectedCategory].name
    : null;

  const selectedCategoryTheme = getCategoryTheme(selectedCategory);

  const previewSubmission = isRing
    ? state.submission ||
      (state.problem && state.impact ? composeSubmission(state.problem, state.impact) : null)
    : null;

  const activeCategory = previewSubmission?.chosen_category ?? selectedCategory ?? null;
  const activeCategoryLabel =
    activeCategory && isTriviaCardCategory(activeCategory)
      ? triviaCardCategoryMeta[activeCategory].name
      : selectedCategoryLabel;
  const activeCategoryTheme = getCategoryTheme(activeCategory || selectedCategory);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);
  const hasUserInitiatedChatRef = useRef(false);
  const [isUserNearBottom, setIsUserNearBottom] = useState(true);

  // Email validation helper
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
      const isNearBottom = distanceFromBottom <= 120;
      setIsUserNearBottom(isNearBottom);
      // Show FAB when user scrolls up and there are messages
      setShowScrollToBottom(!isNearBottom && state.messages.length > 0);
    };

    container.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, [registrationComplete, state.step, isRing, state.messages.length]);

  useEffect(() => {
    if (state.messages.some((message) => message.role === "user")) {
      hasUserInitiatedChatRef.current = true;
    }
  }, [state.messages]);

  useLayoutEffect(() => {
    if (!hasUserInitiatedChatRef.current) {
      return;
    }

    const container = chatContainerRef.current;
    if (!container) return;

    const lastMessage = state.messages[state.messages.length - 1];
    const shouldScroll = lastMessage?.role === "assistant" || isUserNearBottom;

    if (!shouldScroll) {
      return;
    }

    const scrollToBottom = (behavior: ScrollBehavior) => {
      if (chatBottomRef.current) {
        chatBottomRef.current.scrollIntoView({ behavior, block: "end" });
      } else {
        container.scrollTo({ top: container.scrollHeight, behavior });
      }
    };

    requestAnimationFrame(() => {
      scrollToBottom("smooth");

      // Double-check scroll position after a short delay to handle late rendering content
      setTimeout(() => {
        scrollToBottom("auto");
        container.scrollTop = container.scrollHeight;
      }, 120);
    });
  }, [state.messages, isTyping, isUserNearBottom]);

  // Check for max inputs
  useEffect(() => {
    if (state.inputsCount >= 6 && state.step < 4) {
      toast({
        title: "Maximum inputs reached",
        description: "You've reached the 6-input limit. Type 'submit' to complete your solution or 'back' to adjust.",
      });
    }
  }, [state.inputsCount, state.step, toast]);

  // Scroll to top when entering Final Review (step 4)
  useEffect(() => {
    if (state.step === 4) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [state.step]);

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
        previousImpact: state.impact?.userInput,
        category: activeCategory ?? undefined,
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
      try {
        // Keep isSubmitting true until we navigate away to prevent button from re-enabling

        console.log('[Play] Received backend response:', data);

        // Store complete submission data for announcement page
        const submissionData = {
          id: data.submissionId, // Use the real submission ID from the API response
          participantName: `${firstName} ${lastName.charAt(0)}.`,
          firstName,
          lastName,
          category: data.category || 'SECURE_CONNECTIVITY',
          totalScore: data.finalScore,
          pitchScore: data.pitchScore,
          triviaScore: data.triviaScore,
          rank: data.rank,
          subScores: data.subscores,
          createdAt: new Date().toISOString(),
          botBar: data.botBar,
          isEligible: data.isEligible,
          raffleEntered: data.raffleEntered,
          alreadyEntered: data.alreadyEntered,
        };

        console.log('[Play] Storing submission data:', submissionData);

        sessionStorage.setItem('newSubmissionData', JSON.stringify(submissionData));
        sessionStorage.setItem(
          "playSubmissionAudio",
          JSON.stringify({ timestamp: Date.now() })
        );

        // Store video state for Ring mode (to be triggered on "View Results" click)
        if (isRing) {
          sessionStorage.setItem('shouldShowVideo', JSON.stringify({
            isWinner: data.isEligible || false,
            timestamp: Date.now()
          }));
        }

        console.log('[Play] Navigating to /announcement');

        // Play click sound before navigation
        audioManager.playClickSound();

        // Navigate to announcement page
        // Use setTimeout to ensure navigation happens after state updates
        setTimeout(() => {
          console.log('[Play] Executing navigation to /announcement');
          setLocation('/announcement');
        }, 100);
      } catch (error) {
        console.error('[Play] Error in onSuccess handler:', error);
        // Even if there's an error, try to navigate to announcement page
        // Keep isSubmitting true until navigation
        setTimeout(() => {
          console.log('[Play] Fallback navigation to /announcement after error');
          setLocation('/announcement');
        }, 100);
      }
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

      // Detect if moving to step 2
      const wasStep1 = state.step === 1;
      advanceToNextStep(dispatch, state.step);

      if (wasStep1) {
        // Show step completion banner
        setCompletedStepNumber(1);
        setShowStepCompletionBanner(true);
        setTimeout(() => setShowStepCompletionBanner(false), 5000);
      }
    } else if (state.step === 2) {
      // Extract impact from the user's input
      const lastUserMessage = state.messages.filter(m => m.role === 'user').pop();
      if (lastUserMessage) {
        const impact = quantifyImpact(lastUserMessage.content, state.problem?.userInput);
        dispatch({ type: 'SET_IMPACT', payload: impact });
      }

      const wasStep2 = state.step === 2;
      advanceToNextStep(dispatch, state.step);

      if (wasStep2) {
        // Show step completion banner
        setCompletedStepNumber(2);
        setShowStepCompletionBanner(true);
        setTimeout(() => setShowStepCompletionBanner(false), 5000);
      }
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
    hasUserInitiatedChatRef.current = true;
    setIsUserNearBottom(true);
    setCurrentMessage("");
    setIsTyping(true);

    // Add user message and increment input count
    dispatch({ type: 'ADD_USER_INPUT', payload: userMessage });

    // Easter egg: Cat command shows categories
    if (userMessage.toLowerCase() === 'cat') {
      const categoryList = `Here are the 4 categories:

1. NETWORKING - Networking
2. SECURITY - Security
3. COLLABORATION - Collaboration
4. DATA_CENTER - Cloud & AI

Reply with the number and letter (e.g., "1a" for low scoring, "1b" for high scoring).`;
      
      dispatch({ type: 'ADD_MESSAGE', payload: { role: 'assistant', content: categoryList } });
      setIsTyping(false);
      return;
    }

    // Handle category selection (e.g., "1a", "3b", etc.)
    const categoryMatch = userMessage.match(/^([1-4])([ab])$/i);
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

    // For ring mode, validate email is required and valid
    if (isRing) {
      if (!email.trim()) {
        toast({
          title: "Email Required",
          description: "Please enter your email address. It's required for trivia attempts and raffle eligibility.",
          variant: "destructive",
        });
        return;
      }

      if (!isValidEmail(email)) {
        toast({
          title: "Invalid Email",
          description: "Please enter a valid email address.",
          variant: "destructive",
        });
        return;
      }

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
          <div className="mx-auto grid w-full max-w-6xl gap-10 px-6 pt-12 pb-12 lg:grid-cols-[1.25fr_1fr]">
            <div className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-2xl border border-white/20 bg-white/5 shadow-xl sm:h-28 sm:w-28">
                  <img
                    src={ringFullImage}
                    alt="Data#3 Solution Sprint Ring"
                    className="absolute inset-0 h-full w-full object-cover"
                    style={{ transform: "scale(1.8)" }}
                  />
                </div>
                <h1 className="text-balance text-4xl font-semibold leading-tight sm:text-5xl">
                  Enter the Ring
                </h1>
              </div>
              <div className="space-y-4">
                <p className="max-w-2xl text-pretty text-lg text-slate-200">
                  Enter your Cisco Live details, answer 5 trivia then build a project pitch with the AI Coach to earn a raffle entry.
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
                <CardTitle className="text-2xl font-semibold text-white">Register</CardTitle>
                <p className="text-sm text-slate-200/80">
                  Use the name on your Cisco Live badge. Only your first name and last initial appear on the leaderboard; we use the full name for raffle verification.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-semibold text-white/80">
                      Email address <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your.name@company.com"
                      className="border-white/10 bg-slate-950/40 text-base text-white placeholder:text-slate-400"
                      data-testid="input-email"
                      required
                    />
                    <p className="text-xs text-slate-300/70">
                      Required for trivia attempts and raffle eligibility. By submitting, you consent to being contacted if you win.
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
                        href="https://pages.data3.com/2506_7601-Cisco-Live-Customer-Event---1202_Cisco-Live-TCs.html"
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
                  size="lg"
                  onClick={() => {
                    audioManager.playClickSound();
                    setLocation(exitDestination);
                  }}
                  className={BACK_TO_HOME_BUTTON_CLASSES}
                >
                  <i className={BACK_TO_HOME_ICON_CLASSES} aria-hidden="true" />
                  <span>Back to Home</span>
                </Button>

                <p className="text-xs text-center text-slate-400">
                  Average run time under 3 minutes. More specific details lead to higher scores!
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
                      <span>Meta AI Glasses raffle eligibility</span>
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
              onClick={() => {
                audioManager.playClickSound();
                setLocation(exitDestination);
              }}
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
      <div className="flex min-h-screen min-h-[100dvh] flex-col bg-gradient-to-b from-data3-blue-black via-[#000025] to-data3-blue-black text-data3-white p-4 sm:p-6 lg:p-8">
        <div className="mx-auto flex w-full max-w-5xl flex-col">
          <div className="flex flex-col gap-10 px-4 pb-16 pt-10 sm:px-6 sm:pt-12 lg:px-8 border-4 border-data3-pale-blue/50 rounded-3xl shadow-[0_0_40px_rgba(120,220,255,0.3),inset_0_0_40px_rgba(120,220,255,0.1)] bg-gradient-to-br from-data3-blue-black/50 via-transparent to-data3-blue-black/50 backdrop-blur-sm">
            <div className="flex flex-col gap-4 sm:gap-6">
              <div className="flex items-center gap-4 sm:gap-6">
                <div className="relative h-28 w-28 overflow-hidden rounded-2xl border border-white/10 bg-white/10 shadow-2xl shadow-cyan-500/20 ring-2 ring-cyan-400/20 sm:h-32 sm:w-32">
                  <img
                    src={ringFullImage}
                    alt="Ring"
                    className="h-full w-full object-cover"
                  />
                </div>
                <h1 className="text-4xl font-semibold sm:text-5xl">The Ring</h1>
              </div>
              <p className="max-w-3xl text-pretty text-base text-data3-white/80 sm:text-lg">
                Welcome to the Ring. Answer Data#3 trivia to earn a spot on the leaderboard.
              </p>
            </div>
            <TriviaWarmup
              mode="ring"
              className="w-full"
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

                // Play trivia enter sound for user (conditional: force on desktop, respect settings on mobile)
                audioManager.playTriviaEnterSoundConditional()
                  .then(() => console.log('[Play] Trivia enter sound played for user'))
                  .catch(err => console.warn('[Play] Trivia enter sound failed:', err));

                // Trigger boot-up sequence with animated text
                setIsBooting(true);
                setBootingText(`Analyzing your ${activeCategoryLabel || 'expertise'}...`);

                // Update boot text progressively
                setTimeout(() => {
                  setBootingText('Preparing your Sprint Coach...');
                }, 2000);

                setTimeout(() => {
                  setBootingText('Ready to build your pitch!');
                }, 4000);

                setTimeout(() => {
                  setIsBooting(false);
                  setShowBars(true);

                  // Add the coach message after boot sequence completes
                  setTimeout(() => {
                    dispatch({
                      type: 'ADD_MESSAGE',
                      payload: {
                        role: "assistant",
                        content: `You scored ${score || 0}/60 on trivia, ${firstName}.

The next step is to pitch a project to earn up to 40 more points.

The AI Coach will guide you through the steps.

Start by describing a tech related problem at work, the AI Coach will help you explain how it impacts your company. The better your explanation, the more points you earn.`
                      }
                    });
                  }, 300);
                }, 5600);
              }}
            />

            <div className="flex flex-wrap gap-3">
              <Link href="/">
                <Button
                  variant="ghost"
                  size="lg"
                  className={BACK_TO_HOME_BUTTON_CLASSES}
                >
                  <i className={BACK_TO_HOME_ICON_CLASSES} aria-hidden="true" />
                  <span>Back to Home</span>
                </Button>
              </Link>
              <Link href="/dojo">
                <Button className="shadow-[0_25px_70px_-40px_rgba(0,174,255,0.9)]">
                  Practice in the Dojo
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const triviaDeckDialog = (
    <Dialog open={triviaDeckOpen} onOpenChange={setTriviaDeckOpen}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto border border-white/10 bg-slate-950/95 text-white backdrop-blur-xl">
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
      const submissionCategory = currentSubmission?.chosen_category ?? activeCategory;
      const submissionTheme = getCategoryTheme(submissionCategory);
      const submissionCategoryLabel =
        submissionCategory && isTriviaCardCategory(submissionCategory)
          ? triviaCardCategoryMeta[submissionCategory].name
          : activeCategoryLabel;

      return (
        <div className="min-h-screen bg-gradient-to-b from-data3-blue-black via-[#000025] to-data3-blue-black text-slate-100 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-6xl">
            <div className="border-4 border-data3-pale-blue/50 rounded-3xl shadow-[0_0_40px_rgba(120,220,255,0.3),inset_0_0_40px_rgba(120,220,255,0.1)] bg-gradient-to-br from-data3-blue-black/50 via-transparent to-data3-blue-black/50 backdrop-blur-sm p-6 sm:p-8 lg:p-10 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-300/70">Sprint Coach</p>
                <h2 className="text-2xl font-semibold leading-tight sm:text-3xl">Final review</h2>
                <p className="text-sm text-slate-300/80">
                  Tighten anything before you lock your score and generate the raffle entry.
                </p>
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
                    <p className="text-sm text-slate-300/80">Review carefully—adding more detail increases your final score!</p>
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
                        Edit Final Details
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
                <Button
                  variant="ghost"
                  onClick={() => goToStep(dispatch, 3)}
                  className="w-full border border-white/10 bg-white/10 text-white/80 hover:text-white"
                  data-testid="button-back-to-chat-bottom"
                >
                  <i className="fas fa-comments mr-2"></i>
                  Back to Coach
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-data3-blue-black via-[#000025] to-data3-blue-black text-foreground flex flex-col p-4 sm:p-6 lg:p-8">
      {isRing && triviaScore !== null && (
        <div className="mx-auto w-full max-w-4xl px-4 pt-4">
          <div
            className="flex items-center justify-between rounded-2xl border px-4 py-3 text-sm"
            style={{
              borderColor: activeCategoryTheme.border,
              backgroundColor: activeCategoryTheme.background,
              color: activeCategoryTheme.text,
              boxShadow: activeCategoryTheme.shadow,
            }}
          >
            <div className="flex flex-col gap-1 text-left">
              <span
                className="text-xs uppercase tracking-[0.25em]"
                style={{ color: activeCategoryTheme.subheading }}
              >
                Trivia locked
              </span>
              <span className="text-base font-semibold" style={{ color: activeCategoryTheme.text }}>
                {triviaScore}/60 locked in
                {activeCategoryLabel ? <span className="font-normal"> · {activeCategoryLabel}</span> : null}
              </span>
            </div>
            <Badge
              variant="outline"
              className="rounded-full border-0 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.25em]"
              style={{
                backgroundColor: activeCategoryTheme.badgeBg,
                color: activeCategoryTheme.badgeText,
              }}
            >
              Official
            </Badge>
          </div>
        </div>
      )}
      <div className="flex-1 safe-area-padding">
        <div className="max-w-4xl mx-auto">
          <div className="border-4 border-data3-pale-blue/50 rounded-3xl shadow-[0_0_40px_rgba(120,220,255,0.3),inset_0_0_40px_rgba(120,220,255,0.1)] bg-gradient-to-br from-data3-blue-black/50 via-transparent to-data3-blue-black/50 backdrop-blur-sm">
            <Card className="glass-panel border-0 overflow-hidden bg-transparent">
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
                        Edit Final Details
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
                <Button
                  variant="ghost"
                  onClick={() => goToStep(dispatch, 3)}
                  className="w-full border border-white/10 bg-white/10 text-white/80 hover:text-white"
                  data-testid="button-back-to-chat-bottom-classic"
                >
                  <i className="fas fa-comments mr-2"></i>
                  Back to Coach
                </Button>
              </CardContent>
            </Card>
          </div>
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
          <AlertDialogAction onClick={() => {
            audioManager.playClickSound();
            setLocation(exitDestination);
          }}>
            Exit to Home
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  if (isRing) {

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
              <div className="min-h-screen bg-gradient-to-b from-data3-blue-black via-[#000025] to-data3-blue-black text-data3-white p-4 sm:p-6 lg:p-8">
                <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-10 px-4 pb-16 pt-10 sm:px-6 sm:pt-12 lg:px-8 border-4 border-data3-pale-blue/50 rounded-3xl shadow-[0_0_40px_rgba(120,220,255,0.3),inset_0_0_40px_rgba(120,220,255,0.1)] bg-gradient-to-br from-data3-blue-black/50 via-transparent to-data3-blue-black/50 backdrop-blur-sm">

                <div className="flex w-full flex-col gap-4">
            <section className="relative flex flex-col rounded-3xl border border-white/10 bg-slate-900/70 backdrop-blur-xl">
              {/* Minimal Header */}
              {showBars && (
                <div className="sticky top-0 z-20 border-b border-white/10 bg-slate-950">
                  <div className="bg-gradient-to-r from-cyan-500/30 via-slate-900/40 to-cyan-400/20 p-3 sm:p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-cyan-400/50 bg-cyan-500/10 flex-shrink-0">
                          <i className="fas fa-brain text-lg text-cyan-300"></i>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-cyan-200 truncate">Sprint Coach</p>
                          {state.step < 4 && (
                            <p className="text-xs text-slate-300/70">Step {state.step} of 3</p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowExitDialog(true)}
                        className="h-9 w-9 p-0 border border-white/20 bg-white/10 text-white/80 hover:bg-white/10 hover:text-white sm:w-auto sm:px-3"
                        data-testid="button-exit-chat"
                      >
                        <i className="fas fa-times sm:mr-2"></i>
                        <span className="hidden sm:inline">Exit</span>
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              <div
                ref={chatContainerRef}
                className="relative flex-1 space-y-4 overflow-y-auto p-4 pb-6 sm:p-6 sm:pb-6"
                data-testid="chat-messages"
              >
                {isBooting ? (
                  /* Fullscreen Boot Animation */
                  <div className="fixed inset-0 flex flex-col items-center justify-start pt-32 gap-8 bg-slate-900/95 backdrop-blur-xl z-50">
                    {/* Larger Pulsing Ring Icon */}
                    <div className="relative">
                      <div className="absolute inset-0 rounded-full bg-cyan-400/20 animate-ping"></div>
                      <div className="relative flex h-32 w-32 items-center justify-center rounded-full border-4 border-cyan-400/50 bg-cyan-500/10">
                        <i className="fas fa-brain text-6xl text-cyan-300"></i>
                      </div>
                    </div>

                    {/* Animated Boot Text */}
                    <div className="space-y-3 text-center px-4 max-w-md">
                      <p className="text-xl font-semibold text-cyan-200">
                        {bootingText}
                      </p>
                      <div className="flex items-center justify-center gap-2">
                        <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-cyan-300"></span>
                        <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-cyan-300 [animation-delay:200ms]"></span>
                        <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-cyan-300 [animation-delay:400ms]"></span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Score Badge - Scrollable at top of messages */}
                    {triviaScore !== null && (
                      <div
                        className="rounded-2xl border px-4 py-3 mb-4"
                        style={{
                          borderColor: activeCategoryTheme.border,
                          backgroundColor: activeCategoryTheme.background,
                          boxShadow: activeCategoryTheme.shadow,
                        }}
                      >
                        <div className="flex items-center justify-between gap-3 text-center sm:text-left">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">🎯</span>
                            <div>
                              <p className="text-lg font-bold" style={{ color: activeCategoryTheme.text }}>
                                {triviaScore}/60 Locked
                              </p>
                              {activeCategoryLabel && (
                                <p className="text-xs" style={{ color: activeCategoryTheme.subheading }}>
                                  {activeCategoryLabel}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step Completion Banner */}
                    {showStepCompletionBanner && completedStepNumber && (
                      <div className="rounded-2xl border border-green-400/30 bg-green-500/10 px-4 py-3 mb-4 animate-slideIn">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">✨</span>
                          <div>
                            <p className="text-sm font-semibold text-green-200">
                              Step {completedStepNumber} Complete!
                            </p>
                            <p className="text-xs text-green-300/70">
                              {completedStepNumber === 1 && "Great start! Now let's quantify the impact."}
                              {completedStepNumber === 2 && "Excellent! Ready to review when you are."}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {state.messages.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-6 text-center">
                        <p className="text-lg font-semibold text-slate-300 mb-2">Let's get started!</p>
                        <p className="text-sm text-slate-400">Describe the problem you want to solve</p>
                      </div>
                    ) : null}

                    {state.messages.map((message, index) => (
                      <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {message.role === 'assistant' ? (
                          <div className="chat-bubble chat-bubble-assistant">
                            <div
                              className="whitespace-pre-wrap text-base leading-relaxed break-words"
                              dangerouslySetInnerHTML={{ __html: formatMarkdown(message.content) }}
                            />
                          </div>
                        ) : (
                          <div className="chat-bubble chat-bubble-user">
                            <p className="whitespace-pre-wrap text-base leading-relaxed break-words">{message.content}</p>
                          </div>
                        )}
                      </div>
                    ))}

                    <div ref={chatBottomRef} aria-hidden="true" />

                    {/* Enhanced Typing Indicator */}
                    {isTyping && (
                      <div className="flex justify-start items-center gap-3">
                        <div className="chat-bubble chat-bubble-typing">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-white/60">Coach is thinking</span>
                            <div className="flex space-x-1">
                              <div className="w-1.5 h-1.5 bg-white/50 rounded-full animate-pulse"></div>
                              <div className="w-1.5 h-1.5 bg-white/50 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                              <div className="w-1.5 h-1.5 bg-white/50 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Scroll to Bottom FAB */}
                    {showScrollToBottom && (
                      <button
                        onClick={() => {
                          if (chatBottomRef.current) {
                            chatBottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
                          }
                          if (chatContainerRef.current) {
                            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
                          }
                        }}
                        className="fixed bottom-32 right-8 z-20 flex h-12 w-12 items-center justify-center rounded-full border border-cyan-400/50 bg-cyan-500 text-white shadow-lg hover:bg-cyan-400 transition-all animate-slideIn"
                        aria-label="Scroll to bottom"
                      >
                        <i className="fas fa-arrow-down"></i>
                      </button>
                    )}
                  </>
                )}
              </div>
              {showBars && (
                <div className="sticky bottom-0 left-0 right-0 border-t border-white/10 bg-slate-950/80 p-4 sm:p-6 lg:static lg:bg-slate-950/60 lg:backdrop-blur-none backdrop-blur-xl">
                  {/* Review Banner - shows after Step 1 */}
                  {state.step >= 2 && state.step < 4 && (
                    <div className="mb-3 rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-2.5">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <i className="fas fa-check-circle text-sm text-green-400"></i>
                          <span className="text-sm text-slate-200">Click to submit your pitch</span>
                        </div>
                        <Button
                          onClick={handleSubmitCommand}
                          size="sm"
                          className="h-8 rounded-lg bg-cyan-500 text-cyan-950 hover:bg-cyan-400 text-xs font-semibold"
                          data-testid="button-quick-submit"
                        >
                          Review Now
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 items-end">
                    <Textarea
                      value={currentMessage}
                      onChange={(e) => setCurrentMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={
                        state.step === 1
                          ? 'Describe the problem...'
                          : state.step === 2
                          ? 'Quantify the impact...'
                          : state.step === 3
                          ? "Type 'yes' to submit..."
                          : 'Type your message...'
                      }
                      className="min-h-[56px] flex-1 resize-none rounded-2xl border border-white/10 bg-slate-950/40 text-base text-white placeholder:text-slate-400 focus-visible:border-cyan-400/60 focus-visible:ring-0"
                      disabled={isTyping || state.inputsCount >= 6}
                      data-testid="input-chat-message"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!currentMessage.trim() || isTyping || state.inputsCount >= 6}
                      className="h-12 min-w-[52px] rounded-xl bg-cyan-500 text-cyan-950 hover:bg-cyan-400"
                      data-testid="button-send-message"
                    >
                      <i className="fas fa-paper-plane"></i>
                    </Button>
                  </div>

                  {/* Show input counter only when approaching limit */}
                  {state.inputsCount >= 5 && state.step < 4 && (
                    <div className="mt-2 flex items-center justify-center gap-2 text-xs text-amber-300/80">
                      <i className="fas fa-exclamation-triangle text-[0.65rem]"></i>
                      <span>
                        {state.inputsCount === 5 ? '1 input remaining' : 'Input limit reached'}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
        {exitDialog}
        </Dialog>
      </>
    );
  }

  return (
    <>
      <div className="min-h-screen min-h-[100dvh] bg-background text-foreground flex flex-col">
        <div className="flex-1 flex flex-col safe-area-padding">
          <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col px-2 sm:px-4 py-4">
            <Card className="glass-panel border-0 flex-1 flex flex-col">
              {/* Chat Header */}
              <div className="sticky top-0 z-20 flex-shrink-0">
                <div className="relative bg-gradient-to-br from-primary via-primary/80 to-secondary text-primary-foreground">
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
              </div>

              {/* Chat Messages */}
              <div
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-2 sm:space-y-3 -webkit-overflow-scrolling-touch"
                data-testid="chat-messages"
              >
                {state.messages.map((message, index) => (
                  <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {message.role === 'assistant' ? (
                      <div className="chat-bubble chat-bubble-assistant">
                        <div
                          className="whitespace-pre-wrap text-[0.95rem] sm:text-base leading-relaxed break-words"
                          dangerouslySetInnerHTML={{ __html: formatMarkdown(message.content) }}
                        />
                      </div>
                    ) : (
                      <div className="chat-bubble chat-bubble-user">
                        <p className="whitespace-pre-wrap text-[0.95rem] sm:text-base leading-relaxed break-words">{message.content}</p>
                      </div>
                    )}
                  </div>
                ))}

                {isTyping && (
                  <div className="flex justify-start">
                    <div className="chat-bubble chat-bubble-typing">
                      <div className="flex space-x-1.5">
                        <div className="w-2 h-2 bg-white/50 rounded-full animate-pulse"></div>
                        <div className="w-2 h-2 bg-white/50 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-2 h-2 bg-white/50 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input - Sticky at Bottom */}
              <div className="sticky bottom-0 z-20 p-3 sm:p-4 border-t border-border/50 flex-shrink-0 bg-gradient-to-t from-background via-background to-background/95 backdrop-blur-sm">
                <div className="flex gap-2 w-full">
                  <Textarea
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={
                      state.step === 1 ? 'Describe the problem...' :
                      state.step === 2 ? 'Quantify the impact...' :
                      state.step === 3 ? "Type 'yes' to submit..." :
                      'Type your message...'
                    }
                    className="flex-1 min-h-[48px] sm:min-h-12 resize-none mobile-textarea text-[1rem] sm:text-base leading-relaxed max-h-[35vh] overflow-y-auto"
                    disabled={isTyping || state.inputsCount >= 6}
                    data-testid="input-chat-message"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!currentMessage.trim() || isTyping || state.inputsCount >= 6}
                    className="min-h-[48px] min-w-[48px] px-3 touch-manipulation bg-gradient-to-br from-[#00AEFF] to-[#007BC3] hover:from-[#2CC8FF] hover:to-[#00AEFF]"
                    data-testid="button-send-message"
                  >
                    <i className="fas fa-paper-plane"></i>
                  </Button>
                </div>

                {/* Compact counter and submit button */}
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">
                    {state.inputsCount}/6
                  </span>
                  {state.step >= 2 && (
                    <Button
                      onClick={handleSubmitCommand}
                      variant="outline"
                      size="sm"
                      className="text-xs px-3 py-1.5 h-auto bg-secondary/10 hover:bg-secondary/20 border-secondary/30"
                      data-testid="button-quick-submit"
                    >
                      <i className="fas fa-rocket text-xs mr-1.5"></i>
                      Submit Now
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

      {/* Ring Video Modal - shown in Ring mode when submission completes */}
      {showVideoModal && (
        <RingVideoModal
          isWinner={isWinner}
          onComplete={() => {
            try {
              console.log('[Play] Video modal complete - navigating to /announcement');
              setShowVideoModal(false);
              audioManager.playClickSound();
              // Use setTimeout to ensure navigation happens after state updates
              setTimeout(() => {
                console.log('[Play] Executing navigation to /announcement from video modal');
                setLocation('/announcement');
              }, 100);
            } catch (error) {
              console.error('[Play] Error in video modal onComplete:', error);
              setShowVideoModal(false);
              setTimeout(() => {
                setLocation('/announcement');
              }, 100);
            }
          }}
        />
      )}
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
