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
import { expandProblem, quantifyImpact, mapTechnologies, composeSubmission, inferMissingData } from "@/features/sprint/compose";
import type { SprintStep } from "@/features/sprint/types";

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
  const [editedSubmission, setEditedSubmission] = useState<any>(null);
  
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
      const { problem, impact, explore } = inferMissingData(
        state.problem,
        state.impact,
        state.explore
      );
      
      const submission = state.submission || composeSubmission(problem, impact, explore);

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

    // Progress based on current step
    if (state.step === 1 && state.problem) {
      // After problem is set, move to impact
      advanceToNextStep(dispatch, state.step);
    } else if (state.step === 2 && state.impact) {
      // After impact is set, move to explore
      advanceToNextStep(dispatch, state.step);
    } else if (state.step === 3 && state.explore) {
      // After explore is set, prepare submission
      const submission = composeSubmission(state.problem!, state.impact!, state.explore);
      dispatch({ type: 'SET_SUBMISSION', payload: submission });
      advanceToNextStep(dispatch, state.step);
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

    // Check for submit command
    if (isSubmitCommand(userMessage)) {
      handleSubmitCommand();
      return;
    }

    // Process based on current step
    switch (state.step) {
      case 1:
        // Problem step
        const problem = expandProblem(userMessage);
        dispatch({ type: 'SET_PROBLEM', payload: problem });
        
        // Ask for impact
        const impactPrompt = `Got it. ${problem.expanded}

**Step 2: Quantify the Impact** 📊

To size this opportunity, tell me about:
• How often does this happen? (times per week/day)
• Time lost per incident? (hours/minutes)
• Cost impact or risk? (rough estimate is fine)

Even ballpark numbers help - I'll calculate the rest.`;
        
        dispatch({
          type: 'ADD_MESSAGE',
          payload: { role: 'assistant', content: impactPrompt }
        });
        setIsTyping(false);
        advanceToNextStep(dispatch, state.step);
        break;

      case 2:
        // Impact step
        const impact = quantifyImpact(userMessage, state.problem?.userInput);
        dispatch({ type: 'SET_IMPACT', payload: impact });
        
        // Map technologies and propose MVS
        const explore = mapTechnologies(state.problem!, impact);
        dispatch({ type: 'SET_EXPLORE', payload: explore });
        
        // Show technology proposal
        let techProposal = `Perfect! Based on your impact of ${impact.calculatedMetrics?.weeklyHours} hours/week`;
        if (impact.calculatedMetrics?.annualImpact) {
          techProposal += ` (~$${Math.round(impact.calculatedMetrics.annualImpact).toLocaleString()} annually)`;
        }
        techProposal += `, here's my recommendation:

**Step 3: Technology Solution** 🚀

**Cisco Technologies:**
${explore.technologies.map(t => `• **${t.name}**: ${t.description}`).join('\n')}

**Quick Win (MVS):**
${explore.mvs?.title}
${explore.mvs?.implementation.map(i => `• ${i}`).join('\n')}

Ready to proceed with this approach? (Type "yes", make adjustments, or "submit")`;

        if (impact.assumptions && impact.assumptions.length > 0) {
          techProposal += `\n\n_Note: ${impact.assumptions.join('; ')}_`;
        }
        
        dispatch({
          type: 'ADD_MESSAGE',
          payload: { role: 'assistant', content: techProposal }
        });
        setIsTyping(false);
        advanceToNextStep(dispatch, state.step);
        break;

      case 3:
        // Explore/confirmation step
        if (userMessage.toLowerCase().includes('yes') || userMessage.toLowerCase().includes('proceed')) {
          handleProceedToSubmit();
        } else {
          // Handle adjustments - send to AI for processing
          chatMutation.mutate({ message: userMessage });
        }
        break;

      default:
        chatMutation.mutate({ message: userMessage });
    }
  };

  const handleSubmitCommand = () => {
    // Infer any missing data
    const { problem, impact, explore } = inferMissingData(
      state.problem,
      state.impact,
      state.explore
    );
    
    // Compose submission
    const submission = composeSubmission(problem, impact, explore);
    dispatch({ type: 'SET_SUBMISSION', payload: submission });
    
    // Move to submit step
    goToStep(dispatch, 4);
    setIsTyping(false);
  };

  const handleProceedToSubmit = () => {
    if (!state.problem || !state.impact || !state.explore) {
      handleSubmitCommand();
      return;
    }
    
    const submission = composeSubmission(state.problem, state.impact, state.explore);
    dispatch({ type: 'SET_SUBMISSION', payload: submission });
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
                <CardTitle className="text-2xl sm:text-3xl text-center mb-2 text-white drop-shadow-lg">
                  Data<sup className="text-primary">#</sup>3 Solution Sprint
                </CardTitle>
                <p className="text-center text-white/90 drop-shadow">
                  3-Step Sprint to Your Winning Solution
                </p>
              </div>
            </div>
            <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6">
              <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <Label htmlFor="firstName" className="text-sm sm:text-base mb-1.5">First Name</Label>
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
                  <Label htmlFor="lastName" className="text-sm sm:text-base mb-1.5">Last Name</Label>
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
                  <CardTitle className="text-lg sm:text-xl">
                    <i className="fas fa-rocket mr-2 text-primary"></i>
                    Your 3-Reply Sprint
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">1</div>
                      <div>
                        <p className="font-semibold text-sm">Name the Problem</p>
                        <p className="text-xs text-muted-foreground">Share your business challenge</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">2</div>
                      <div>
                        <p className="font-semibold text-sm">Quantify Impact</p>
                        <p className="text-xs text-muted-foreground">Time, cost, or risk estimates</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">3</div>
                      <div>
                        <p className="font-semibold text-sm">Get Your Solution</p>
                        <p className="text-xs text-muted-foreground">AI maps perfect Cisco tech + MVS</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-secondary/10 rounded-lg">
                    <p className="text-xs text-center">
                      💡 <strong>Pro tip:</strong> Type "submit" anytime to jump to final review
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
                    Start 3-Step Sprint
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
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
    const currentSubmission = editedSubmission || state.submission;
    
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <SprintStepper 
          currentStep={state.step}
          completedSteps={state.completedSteps}
          onStepClick={handleStepClick}
        />
        
        <div className="flex-1 py-4 sm:py-8 safe-area-padding">
          <div className="max-w-4xl mx-auto px-4">
            <Card className="glass-panel border-0">
              <CardHeader className="pb-4 sm:pb-6">
                <CardTitle className="text-xl sm:text-2xl">Final Review & Submit</CardTitle>
                <p className="text-sm sm:text-base text-muted-foreground">
                  {isEditMode ? "Edit your solution details below" : "Your solution is ready! Review and submit for scoring."}
                </p>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6">
                {/* Problem Summary */}
                <div className="glass-panel rounded-lg p-3 sm:p-4">
                  <Label className="font-bold mb-2 flex items-center text-sm sm:text-base">
                    <i className="fas fa-lightbulb text-primary mr-2"></i>
                    Problem Summary
                  </Label>
                  {isEditMode ? (
                    <Textarea
                      value={currentSubmission.problem_summary}
                      onChange={(e) => setEditedSubmission({...currentSubmission, problem_summary: e.target.value})}
                      className="text-sm min-h-[60px]"
                      placeholder="Describe the problem..."
                    />
                  ) : (
                    <p className="text-sm">{currentSubmission.problem_summary}</p>
                  )}
                </div>

                {/* Cisco Products */}
                <div className="glass-panel rounded-lg p-3 sm:p-4">
                  <Label className="font-bold mb-2 flex items-center text-sm sm:text-base">
                    <i className="fas fa-microchip text-primary mr-2"></i>
                    Cisco Technologies
                  </Label>
                  {isEditMode ? (
                    <div className="space-y-2">
                      {currentSubmission.cisco_products.map((product: string, idx: number) => (
                        <Input
                          key={idx}
                          value={product}
                          onChange={(e) => {
                            const newProducts = [...currentSubmission.cisco_products];
                            newProducts[idx] = e.target.value;
                            setEditedSubmission({...currentSubmission, cisco_products: newProducts});
                          }}
                          className="text-sm"
                          placeholder="Cisco product..."
                        />
                      ))}
                    </div>
                  ) : (
                    <ul className="list-disc list-inside space-y-1">
                      {currentSubmission.cisco_products.map((product: string, idx: number) => (
                        <li key={idx} className="text-sm">{product}</li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Impact Metrics */}
                <div className="glass-panel rounded-lg p-3 sm:p-4">
                  <Label className="font-bold mb-2 flex items-center text-sm sm:text-base">
                    <i className="fas fa-chart-line text-primary mr-2"></i>
                    Impact & KPIs
                  </Label>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-1">Current State</p>
                      {currentSubmission.current_state.baseline_kpis.map((kpi: any, idx: number) => (
                        <div key={idx} className="text-sm mb-1">
                          {isEditMode ? (
                            <div className="flex gap-2">
                              <Input
                                value={kpi.name}
                                onChange={(e) => {
                                  const newKpis = [...currentSubmission.current_state.baseline_kpis];
                                  newKpis[idx] = {...kpi, name: e.target.value};
                                  setEditedSubmission({...currentSubmission, current_state: {...currentSubmission.current_state, baseline_kpis: newKpis}});
                                }}
                                className="text-sm flex-1"
                                placeholder="KPI name..."
                              />
                              <Input
                                value={kpi.value}
                                onChange={(e) => {
                                  const newKpis = [...currentSubmission.current_state.baseline_kpis];
                                  newKpis[idx] = {...kpi, value: e.target.value};
                                  setEditedSubmission({...currentSubmission, current_state: {...currentSubmission.current_state, baseline_kpis: newKpis}});
                                }}
                                className="text-sm flex-1"
                                placeholder="Value..."
                              />
                            </div>
                          ) : (
                            <>{kpi.name}: <strong>{kpi.value}</strong></>
                          )}
                        </div>
                      ))}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-1">Target State</p>
                      {currentSubmission.target_state.kpis.map((kpi: any, idx: number) => (
                        <div key={idx} className="text-sm mb-1">
                          {isEditMode ? (
                            <div className="flex gap-2">
                              <Input
                                value={kpi.name}
                                onChange={(e) => {
                                  const newKpis = [...currentSubmission.target_state.kpis];
                                  newKpis[idx] = {...kpi, name: e.target.value};
                                  setEditedSubmission({...currentSubmission, target_state: {...currentSubmission.target_state, kpis: newKpis}});
                                }}
                                className="text-sm flex-1"
                                placeholder="KPI name..."
                              />
                              <Input
                                value={kpi.target}
                                onChange={(e) => {
                                  const newKpis = [...currentSubmission.target_state.kpis];
                                  newKpis[idx] = {...kpi, target: e.target.value};
                                  setEditedSubmission({...currentSubmission, target_state: {...currentSubmission.target_state, kpis: newKpis}});
                                }}
                                className="text-sm flex-1"
                                placeholder="Target..."
                              />
                            </div>
                          ) : (
                            <>{kpi.name}: <strong>{kpi.target}</strong></>
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
                        onClick={() => setIsEditMode(true)}
                        variant="outline"
                        className="flex-1"
                        data-testid="button-edit-mode"
                      >
                        <i className="fas fa-edit mr-2"></i>
                        Edit
                      </Button>
                      <Button
                        onClick={() => goToStep(dispatch, 3)}
                        variant="outline"
                        className="flex-1"
                        data-testid="button-back-to-chat"
                      >
                        <i className="fas fa-comments mr-2"></i>
                        Back to Chat
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
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SprintStepper 
        currentStep={state.step}
        completedSteps={state.completedSteps}
        onStepClick={handleStepClick}
      />
      
      <div className="flex-1 flex flex-col safe-area-padding">
        <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col px-4 py-4">
          <Card className="glass-panel border-0 overflow-hidden flex-1 flex flex-col">
            {/* Chat Header */}
            <div className="bg-gradient-to-r from-primary to-secondary p-4 sm:p-6 text-primary-foreground flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-robot text-base sm:text-lg"></i>
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg sm:text-xl font-bold truncate">Sprint Coach</h3>
                    <p className="text-xs sm:text-sm opacity-90">
                      Step {state.step} of 4 • {6 - state.inputsCount} inputs remaining
                    </p>
                  </div>
                </div>
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

            {/* Chat Messages */}
            <div 
              ref={chatContainerRef} 
              className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 sm:space-y-4 -webkit-overflow-scrolling-touch" 
              data-testid="chat-messages"
            >
              {state.messages.map((message, index) => (
                <div key={index} className="chat-message flex items-start gap-2 sm:gap-3">
                  {message.role === "assistant" ? (
                    <>
                      <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center flex-shrink-0">
                        <i className="fas fa-robot text-white text-xs sm:text-sm"></i>
                      </div>
                      <div className="glass-panel rounded-lg rounded-tl-none p-3 sm:p-4 max-w-[85%] sm:max-w-lg">
                        <div className="whitespace-pre-wrap text-sm sm:text-base text-foreground">
                          {message.content}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-7 h-7 sm:w-8 sm:h-8 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
                        <i className="fas fa-user text-xs sm:text-sm"></i>
                      </div>
                      <div className="bg-primary/10 border border-primary/20 rounded-lg rounded-tl-none p-3 sm:p-4 max-w-[85%] sm:max-w-lg">
                        <p className="whitespace-pre-wrap text-sm sm:text-base text-foreground">{message.content}</p>
                      </div>
                    </>
                  )}
                </div>
              ))}

              {isTyping && (
                <div className="chat-message flex items-start gap-2 sm:gap-3">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-robot text-white text-xs sm:text-sm"></i>
                  </div>
                  <div className="glass-panel rounded-lg rounded-tl-none p-3 sm:p-4">
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
            <div className="p-4 sm:p-6 border-t border-border flex-shrink-0 bg-background">
              <div className="flex gap-2 sm:gap-3">
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
                  className="flex-1 min-h-[48px] sm:min-h-12 resize-none mobile-textarea text-sm sm:text-base"
                  disabled={isTyping || state.inputsCount >= 6}
                  data-testid="input-chat-message"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!currentMessage.trim() || isTyping || state.inputsCount >= 6}
                  className="min-h-[48px] min-w-[48px] px-3 touch-manipulation"
                  data-testid="button-send-message"
                >
                  <i className="fas fa-paper-plane"></i>
                </Button>
              </div>
              
              {/* Submit anytime pill */}
              <div className="mt-3 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Input {state.inputsCount}/6
                </p>
                <div className="bg-secondary/20 text-secondary px-3 py-1 rounded-full text-xs">
                  💡 Type "submit" anytime to finish
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Exit Dialog */}
      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Exit Sprint?</AlertDialogTitle>
            <AlertDialogDescription>
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