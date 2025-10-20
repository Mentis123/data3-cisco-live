import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import headerImage from "@assets/pixio-chat-image-2025-09-12T14-04-15-596Z_1757685866445.jpg";
import { SprintStepper } from "@/components/SprintStepper";
import { SprintProvider, useSprint, isSubmitCommand, advanceToNextStep, goToStep } from "@/features/sprint/context";
import { expandProblem, quantifyImpact, composeSubmission, inferMissingData } from "@/features/sprint/compose";
import type { SprintStep, SubmissionDraft } from "@/features/sprint/types";

function PlayContent() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { state, dispatch } = useSprint();
  
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [sessionToken, setSessionToken] = useState<string>("");
  const [currentMessage, setCurrentMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedSubmission, setEditedSubmission] = useState<SubmissionDraft | null>(null);
  
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
    mutationFn: async ({ firstName, lastName }: { firstName: string; lastName: string }) => {
      const response = await apiRequest("POST", "/api/start", { firstName, lastName });
      return response.json();
    },
    onSuccess: (data) => {
      setSessionToken(data.sessionToken);
      setRegistrationComplete(true);
      
      // Add initial assistant message for Step 1
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
        structuredFields: submission,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setIsSubmitting(false);
      toast({
        title: "Solution Submitted!",
        description: `Your score: ${data.finalScore}/50 (Rank #${data.rank}). Watch the leaderboard for live updates!`,
      });

      sessionStorage.setItem(
        "playSubmissionAudio",
        JSON.stringify({ timestamp: Date.now() })
      );

      setTimeout(() => {
        setLocation("/leaderboard");
      }, 3000);
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

  const handleEditField = <K extends 'problem_summary' | 'impact_summary'>(
    key: K,
    value: string
  ) => {
    setEditedSubmission((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const handleBaselineMetricChange = (
    index: number,
    field: 'name' | 'value',
    value: string
  ) => {
    setEditedSubmission((prev) => {
      if (!prev) return prev;
      const metrics = [...prev.baseline_metrics];
      const existing = metrics[index] ?? { name: '', value: '' };
      metrics[index] = { ...existing, [field]: value };
      return { ...prev, baseline_metrics: metrics };
    });
  };

  const handleTargetMetricChange = (
    index: number,
    field: 'name' | 'target',
    value: string
  ) => {
    setEditedSubmission((prev) => {
      if (!prev) return prev;
      const metrics = [...prev.target_metrics];
      const existing = metrics[index] ?? { name: '', target: '' };
      metrics[index] = { ...existing, [field]: value };
      return { ...prev, target_metrics: metrics };
    });
  };

  const handleRemoveBaselineMetric = (index: number) => {
    setEditedSubmission((prev) => {
      if (!prev) return prev;
      const metrics = prev.baseline_metrics.filter((_, idx) => idx !== index);
      return { ...prev, baseline_metrics: metrics };
    });
  };

  const handleRemoveTargetMetric = (index: number) => {
    setEditedSubmission((prev) => {
      if (!prev) return prev;
      const metrics = prev.target_metrics.filter((_, idx) => idx !== index);
      return { ...prev, target_metrics: metrics };
    });
  };

  const handleAddBaselineMetric = () => {
    setEditedSubmission((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        baseline_metrics: [...prev.baseline_metrics, { name: '', value: '' }]
      };
    });
  };

  const handleAddTargetMetric = () => {
    setEditedSubmission((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        target_metrics: [...prev.target_metrics, { name: '', target: '' }]
      };
    });
  };

  const handleEnterEditMode = () => {
    if (!state.submission) {
      return;
    }

    setEditedSubmission({
      ...state.submission,
      problem_summary: state.submission.problem_summary,
      impact_summary: state.submission.impact_summary,
      baseline_metrics: [...state.submission.baseline_metrics],
      target_metrics: [...state.submission.target_metrics],
      action_plan: [...state.submission.action_plan],
      success_checks: [...state.submission.success_checks],
      risks: [...state.submission.risks]
    });
    setIsEditMode(true);
  };

  const sanitizeBaselineMetrics = (
    metrics: Array<{ name: string; value: string }>
  ) =>
    metrics
      .map((metric) => ({
        name: metric.name.trim(),
        value: metric.value.trim()
      }))
      .filter((metric) => metric.name || metric.value);

  const sanitizeTargetMetrics = (
    metrics: Array<{ name: string; target: string }>
  ) =>
    metrics
      .map((metric) => ({
        name: metric.name.trim(),
        target: metric.target.trim()
      }))
      .filter((metric) => metric.name || metric.target);

  const handleSaveEdits = () => {
    if (!editedSubmission) {
      return;
    }

    const sanitizedSubmission: SubmissionDraft = {
      ...editedSubmission,
      problem_summary: editedSubmission.problem_summary.trim(),
      impact_summary: editedSubmission.impact_summary.trim(),
      baseline_metrics: sanitizeBaselineMetrics(editedSubmission.baseline_metrics),
      target_metrics: sanitizeTargetMetrics(editedSubmission.target_metrics)
    };

    dispatch({ type: 'UPDATE_SUBMISSION', payload: sanitizedSubmission });
    setEditedSubmission(null);
    setIsEditMode(false);
  };

  const handleCancelEdits = () => {
    setEditedSubmission(null);
    setIsEditMode(false);
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

    startSessionMutation.mutate({ firstName, lastName });
  };

  // Registration view
  if (!registrationComplete) {
    return (
      <div className="min-h-screen bg-background text-foreground py-4 sm:py-8 safe-area-padding">
        <div className="max-w-2xl mx-auto px-4">
          <div className="mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/')}
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
                <CardHeader className="px-4 py-4 sm:px-6 sm:py-5">
                  <CardTitle className="flex items-center gap-3 text-[clamp(1.05rem,4.4vw,1.35rem)] sm:text-xl leading-tight">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <i className="fas fa-rocket text-sm sm:text-base"></i>
                    </span>
                    <span className="whitespace-nowrap sm:whitespace-normal">Your 3-Reply Sprint</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-5 sm:px-6 sm:pb-6">
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
                disabled={!firstName.trim() || !lastName.trim() || startSessionMutation.isPending}
                className="w-full min-h-[52px] text-base sm:text-lg touch-manipulation"
                data-testid="button-start-chat"
              >
                {startSessionMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Starting Sprint...
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

  // Submit/Review view
  if (state.step === 4 && state.submission) {
    const currentSubmission = editedSubmission ?? state.submission;

    if (!currentSubmission) {
      return null;
    }

    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col">
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
                      onChange={(e) => handleEditField('problem_summary', e.target.value)}
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
                      onChange={(e) => handleEditField('impact_summary', e.target.value)}
                      className="text-base leading-relaxed min-h-[60px]"
                      placeholder="Summarise the quantified impact..."
                    />
                  ) : currentSubmission.impact_summary ? (
                    <p className="text-base leading-relaxed">{currentSubmission.impact_summary}</p>
                  ) : (
                    <p className="text-base text-muted-foreground italic">No impact summary provided yet.</p>
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
                      {isEditMode ? (
                        <>
                          {currentSubmission.baseline_metrics.length === 0 && (
                            <p className="text-sm text-muted-foreground italic mb-2">
                              Optional: add baseline KPIs if you have them ready.
                            </p>
                          )}
                          {currentSubmission.baseline_metrics.map((metric, idx) => (
                            <div key={idx} className="flex gap-2 mb-2">
                              <Input
                                value={metric.name}
                                onChange={(e) => handleBaselineMetricChange(idx, 'name', e.target.value)}
                                className="text-base flex-1"
                                placeholder="Metric name..."
                              />
                              <Input
                                value={metric.value}
                                onChange={(e) => handleBaselineMetricChange(idx, 'value', e.target.value)}
                                className="text-base flex-1"
                                placeholder="Value..."
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="self-center text-muted-foreground"
                                onClick={() => handleRemoveBaselineMetric(idx)}
                                aria-label="Remove baseline metric"
                              >
                                <i className="fas fa-times"></i>
                              </Button>
                            </div>
                          ))}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="mt-1 text-sm"
                            onClick={handleAddBaselineMetric}
                          >
                            <i className="fas fa-plus mr-2" aria-hidden="true"></i>
                            Add baseline metric
                          </Button>
                        </>
                      ) : currentSubmission.baseline_metrics.length > 0 ? (
                        currentSubmission.baseline_metrics.map((metric, idx) => (
                          <div key={idx} className="text-base leading-snug mb-1">
                            <span className="font-medium">{metric.name || 'Metric'}</span>
                            {metric.value ? <span>: <strong>{metric.value}</strong></span> : null}
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground italic">No baseline metrics provided. You can still submit without them.</p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-muted-foreground mb-1 leading-snug">Target Metrics</p>
                      {isEditMode ? (
                        <>
                          {currentSubmission.target_metrics.length === 0 && (
                            <p className="text-sm text-muted-foreground italic mb-2">
                              Optional: capture target outcomes if you want to highlight improvements.
                            </p>
                          )}
                          {currentSubmission.target_metrics.map((metric, idx) => (
                            <div key={idx} className="flex gap-2 mb-2">
                              <Input
                                value={metric.name}
                                onChange={(e) => handleTargetMetricChange(idx, 'name', e.target.value)}
                                className="text-base flex-1"
                                placeholder="Metric name..."
                              />
                              <Input
                                value={metric.target}
                                onChange={(e) => handleTargetMetricChange(idx, 'target', e.target.value)}
                                className="text-base flex-1"
                                placeholder="Target..."
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="self-center text-muted-foreground"
                                onClick={() => handleRemoveTargetMetric(idx)}
                                aria-label="Remove target metric"
                              >
                                <i className="fas fa-times"></i>
                              </Button>
                            </div>
                          ))}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="mt-1 text-sm"
                            onClick={handleAddTargetMetric}
                          >
                            <i className="fas fa-plus mr-2" aria-hidden="true"></i>
                            Add target metric
                          </Button>
                        </>
                      ) : currentSubmission.target_metrics.length > 0 ? (
                        currentSubmission.target_metrics.map((metric, idx) => (
                          <div key={idx} className="text-base leading-snug mb-1">
                            <span className="font-medium">{metric.name || 'Metric'}</span>
                            {metric.target ? <span>: <strong>{metric.target}</strong></span> : null}
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground italic">No target metrics defined yet. Submitting without targets is allowed.</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Submit Actions */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  {isEditMode ? (
                    <>
                      <Button
                        onClick={handleSaveEdits}
                        className="flex-1"
                        data-testid="button-save-edits"
                      >
                        <i className="fas fa-save mr-2"></i>
                        Save Changes
                      </Button>
                      <Button
                        onClick={handleCancelEdits}
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
                        onClick={handleEnterEditMode}
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
  return (
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

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowExitDialog(true)}
                    className="ml-auto text-white/90 hover:text-white hover:bg-white/20"
                    data-testid="button-exit-chat"
                  >
                    <i className="fas fa-home mr-2"></i>
                    Exit
                  </Button>
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
                  {message.role === "assistant" ? (
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
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: "0.2s" }}></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: "0.4s" }}></div>
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
                    state.step === 1 ? "Describe your business problem..." :
                    state.step === 2 ? "How often? Time lost? Cost impact?" :
                    state.step === 3 ? "Type 'yes' to proceed or adjust..." :
                    "Type your message..."
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
                {/* Submit button - show from step 2 onwards */}
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

      {/* Exit Dialog */}
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
            <AlertDialogAction onClick={() => setLocation("/")}>
              Exit to Home
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function Play() {
  return (
    <SprintProvider>
      <PlayContent />
    </SprintProvider>
  );
}