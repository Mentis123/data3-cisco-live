import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";
import { SprintProvider, useSprint } from "@/features/sprint/context";
import { SprintStepper } from "@/components/SprintStepper";
import { expandProblem, quantifyImpact, composeSubmission } from "@/features/sprint/compose";
import {
  triviaCardCategoryMeta,
  isTriviaCardCategory,
  type TriviaCardCategory,
} from "@/data/triviaCards";
import pitchDojoImage from "@assets/dojofull.jpg";

type CategoryTheme = {
  border: string;
  background: string;
  text: string;
  subheading: string;
  badgeBg: string;
  badgeText: string;
  shadow: string;
};

const UNIFIED_THEME: CategoryTheme = {
  border: "rgba(0, 174, 255, 0.50)",
  background: "rgba(0, 123, 195, 0.15)",
  text: "#EEEEEE",
  subheading: "rgba(120, 220, 255, 0.90)",
  badgeBg: "#00AEFF",
  badgeText: "#000025",
  shadow: "0 20px 70px -40px rgba(0, 174, 255, 0.70)",
};

function PitchDojoContent() {
  const [selectedCategory, setSelectedCategory] = useState<TriviaCardCategory | null>(null);
  const [sessionToken, setSessionToken] = useState<string>("");
  const [currentMessage, setCurrentMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isBooting, setIsBooting] = useState(false);
  const [showStepCompletionBanner, setShowStepCompletionBanner] = useState(false);
  const [completedStepNumber, setCompletedStepNumber] = useState<number | null>(null);
  const { state, dispatch } = useSprint();

  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    container.scrollTo({
      top: container.scrollHeight,
      behavior: "smooth",
    });
  }, [state.messages, isTyping]);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Scroll to ensure chat area is visible when category is selected
  useEffect(() => {
    if (selectedCategory) {
      // Small delay to ensure DOM has updated
      setTimeout(() => {
        // Scroll down slightly to ensure the loading message is visible below the header
        // This positions the chat container nicely in the viewport
        window.scrollTo({
          top: 100,
          behavior: 'smooth'
        });
      }, 100);
    }
  }, [selectedCategory]);

  const handleCategorySelect = async (category: TriviaCardCategory) => {
    setIsBooting(true);

    try {
      // Start a new session for this category
      const response = await apiRequest("POST", "/api/start", {
        firstName: "Dojo",
        lastName: "Practice",
        email: "practice@dojo.local",
        category,
      });
      const result = await response.json() as { sessionToken: string };

      setSessionToken(result.sessionToken);
      setSelectedCategory(category);

      // Simulate boot sequence
      await new Promise(resolve => setTimeout(resolve, 1200));

      // Add initial AI coach message
      const categoryMeta = triviaCardCategoryMeta[category];
      dispatch({
        type: "ADD_MESSAGE",
        payload: {
          role: "assistant",
          content: `Welcome to Pitch Dojo! 🥋

You've selected **${categoryMeta.name}** as your focus area. I'm your AI coach, and I'll guide you through crafting a winning pitch in 3 steps.

**Step 1: Name the Problem** 🎯

Tell me about a specific business challenge related to ${categoryMeta.name} that:
• Wastes time or resources
• Creates friction for users
• Causes errors or delays
• Impacts productivity

Just describe it naturally - what's the problem that needs solving?`
        }
      });

      setIsBooting(false);
    } catch (error) {
      console.error("Failed to start practice session:", error);
      setIsBooting(false);
    }
  };

  const handleSendMessage = async () => {
    if (!currentMessage.trim() || isTyping || !sessionToken) return;

    const userMessage = currentMessage.trim();
    setCurrentMessage("");

    dispatch({
      type: "ADD_MESSAGE",
      payload: { role: "user", content: userMessage },
    });

    setIsTyping(true);

    try {
      const response = await apiRequest("POST", "/api/chat", {
        sessionToken,
        message: userMessage,
      });
      const result = await response.json() as { reply: string; step: number };

      dispatch({
        type: "ADD_MESSAGE",
        payload: { role: "assistant", content: result.reply },
      });

      // Update step if needed and show completion banner
      if (result.step !== state.step) {
        const previousStep = state.step;
        dispatch({ type: "SET_STEP", payload: result.step as 1 | 2 | 3 | 4 });

        // Show step completion banner when moving to next step
        if (result.step > previousStep && previousStep < 4) {
          setCompletedStepNumber(previousStep);
          setShowStepCompletionBanner(true);
          setTimeout(() => setShowStepCompletionBanner(false), 5000);
        }
      }

      // Handle problem expansion (step 1 -> 2 transition)
      if (result.step === 2 && !state.problem) {
        const problem = await expandProblem(state.messages);
        if (problem) {
          dispatch({ type: "SET_PROBLEM", payload: problem });
        }
      }

      // Handle impact quantification (step 2 -> 3 transition)
      if (result.step === 3 && !state.impact && state.problem) {
        const impact = await quantifyImpact(state.messages, state.problem);
        if (impact) {
          dispatch({ type: "SET_IMPACT", payload: impact });
        }
      }

      // Handle submission composition (step 3 -> 4 transition)
      if (result.step === 4 && !state.submission && state.problem && state.impact) {
        const submission = composeSubmission(state.problem, state.impact);
        dispatch({ type: "SET_SUBMISSION", payload: submission });
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      dispatch({
        type: "ADD_MESSAGE",
        payload: {
          role: "assistant",
          content: "Sorry, there was an error processing your message. Please try again.",
        },
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleRestart = () => {
    setSelectedCategory(null);
    setSessionToken("");
    setCurrentMessage("");
    dispatch({ type: "RESET_SPRINT" });
  };

  // Category selection view
  if (!selectedCategory) {
    return (
      <div className="flex min-h-screen min-h-[100dvh] flex-col bg-gradient-to-b from-data3-blue-black via-[#000025] to-data3-blue-black text-data3-white p-4 sm:p-6 lg:p-8">
        <div className="mx-auto flex w-full max-w-5xl flex-col">
          <div className="flex flex-col gap-10 px-4 pb-16 pt-10 sm:px-6 sm:pt-12 lg:px-8 border-4 border-data3-pale-blue/50 rounded-3xl shadow-[0_0_40px_rgba(120,220,255,0.3),inset_0_0_40px_rgba(120,220,255,0.1)] bg-gradient-to-br from-data3-blue-black/50 via-transparent to-data3-blue-black/50 backdrop-blur-sm">

            {/* Header */}
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
              <img
                src={pitchDojoImage}
                alt="Pitch Dojo"
                className="h-24 w-24 rounded-2xl object-cover shadow-2xl shadow-data3-light-blue/40 ring-2 ring-data3-light-blue/50"
              />
              <div className="flex-1 space-y-4 text-center sm:text-left">
                <Badge className="w-fit bg-data3-blue/30 text-data3-pale-blue border-data3-light-blue/50">
                  PRACTICE MODE
                </Badge>
                <h1 className="text-4xl font-semibold sm:text-5xl">Pitch Dojo</h1>
                <p className="max-w-3xl text-pretty text-base text-data3-white/80 sm:text-lg">
                  Practice your pitch with our AI coach. Choose a Cisco architecture category and refine your problem statement, impact quantification, and solution before entering the ring.
                </p>
              </div>
            </div>

            {/* Category Selection */}
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold">Choose Your Focus Area</h2>
                <p className="text-sm text-data3-white/60">
                  Select a Cisco technology category to practice your pitch
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {(Object.entries(triviaCardCategoryMeta) as [TriviaCardCategory, typeof triviaCardCategoryMeta[TriviaCardCategory]][]).map(([categoryId, meta]) => (
                  <Card
                    key={categoryId}
                    className="cursor-pointer transition-all hover:scale-105 border-2 hover:border-data3-light-blue/70 bg-gradient-to-br from-data3-blue/20 to-transparent backdrop-blur-sm"
                    onClick={() => handleCategorySelect(categoryId)}
                  >
                    <CardContent className="p-6 space-y-3">
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                        style={{ backgroundColor: meta.color + "30" }}
                      >
                        {meta.icon}
                      </div>
                      <h3 className="text-lg font-semibold text-data3-white">
                        {meta.name}
                      </h3>
                      <p className="text-sm text-data3-white/60">
                        {meta.description}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Navigation */}
            <div className="mx-auto mt-8 grid w-full max-w-md gap-3 sm:grid-cols-2">
              <Link href="/play">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full border-cyan-400/40 text-cyan-300 hover:bg-cyan-500/10"
                >
                  Enter the Ring Now
                </Button>
              </Link>
              <Link href="/">
                <Button
                  size="lg"
                  variant="ghost"
                  className="w-full border border-white/10 bg-white/5 text-white hover:bg-white/10"
                >
                  <i className="fas fa-home mr-2"></i>
                  Back to Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Chat interface view
  const categoryMeta = triviaCardCategoryMeta[selectedCategory];
  const previewSubmission = state.submission ||
    (state.problem && state.impact ? composeSubmission(state.problem, state.impact) : null);

  return (
    <div className="min-h-screen min-h-[100dvh] bg-gradient-to-b from-data3-blue-black via-[#000025] to-data3-blue-black text-data3-white p-4 sm:p-6 lg:p-8">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-4 lg:flex-row">
        {/* Main Chat Container */}
        <div className="flex-1 flex flex-col rounded-3xl border border-white/10 bg-slate-900/70 backdrop-blur-xl overflow-hidden">
          {/* Header */}
          <div className="sticky top-0 z-20 border-b border-white/10 bg-slate-950">
            <div className="bg-gradient-to-r from-cyan-500/30 via-slate-900/40 to-cyan-400/20 p-3 sm:p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-cyan-400/50 bg-cyan-500/10 flex-shrink-0">
                    <i className="fas fa-brain text-lg text-cyan-300"></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className="bg-data3-blue/30 text-data3-pale-blue border-data3-light-blue/50 text-xs">
                        PRACTICE MODE
                      </Badge>
                      <span className="text-xs text-slate-300/70">•</span>
                      <span className="text-xs text-slate-300/70">{categoryMeta.name}</span>
                    </div>
                    <p className="text-sm font-semibold text-cyan-200 truncate">Sprint Coach</p>
                  </div>
                </div>
                <Button
                  onClick={handleRestart}
                  variant="ghost"
                  size="sm"
                  className="text-white/90 hover:text-white hover:bg-white/20"
                >
                  <i className="fas fa-arrow-left mr-2"></i>
                  <span className="hidden sm:inline">Change Category</span>
                  <span className="sm:hidden">Back</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-4"
          >
            {isBooting ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-data3-light-blue mx-auto"></div>
                  <p className="text-data3-white/60">Initializing practice session...</p>
                </div>
              </div>
            ) : (
              <>
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
                          {completedStepNumber === 3 && "Perfect! Let's finalize your solution."}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {state.messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-3 ${
                        message.role === "user"
                          ? "bg-data3-light-blue/20 text-data3-white border border-data3-light-blue/30"
                          : "bg-white/5 text-data3-white/90 border border-white/10"
                      }`}
                    >
                      <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white/5 text-data3-white/90 border border-white/10 rounded-lg px-4 py-3">
                      <div className="flex gap-1">
                        <span className="animate-bounce">●</span>
                        <span className="animate-bounce delay-100">●</span>
                        <span className="animate-bounce delay-200">●</span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Input Area */}
          <div className="sticky bottom-0 left-0 right-0 border-t border-white/10 bg-slate-950/80 p-4 sm:p-6 backdrop-blur-xl">
            {state.step === 4 ? (
              <div className="text-center space-y-3">
                <div className="rounded-xl border border-green-400/30 bg-green-500/10 px-4 py-3">
                  <p className="text-sm font-semibold text-green-200 mb-1">
                    🎉 Practice Complete!
                  </p>
                  <p className="text-xs text-green-300/70">
                    You've completed the pitch coaching flow. Ready to enter the ring?
                  </p>
                </div>
                <div className="flex gap-2 justify-center">
                  <Button
                    onClick={handleRestart}
                    className="bg-cyan-500 hover:bg-cyan-400 text-cyan-950"
                  >
                    <i className="fas fa-redo mr-2"></i>
                    Practice Another Category
                  </Button>
                  <Link href="/play">
                    <Button
                      className="bg-data3-light-blue hover:bg-data3-light-blue/80 text-data3-blue-black"
                    >
                      <i className="fas fa-trophy mr-2"></i>
                      Enter the Ring
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="flex gap-2 items-end">
                <Input
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={
                    state.step === 1
                      ? 'Describe the problem...'
                      : state.step === 2
                      ? 'Quantify the impact...'
                      : state.step === 3
                      ? "Type 'yes' or describe more..."
                      : 'Type your message...'
                  }
                  disabled={isTyping || isBooting}
                  className="flex-1 min-h-[56px] rounded-2xl border border-white/10 bg-slate-950/40 text-base text-white placeholder:text-slate-400 focus-visible:border-cyan-400/60"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!currentMessage.trim() || isTyping || isBooting}
                  className="h-12 min-w-[52px] rounded-xl bg-cyan-500 text-cyan-950 hover:bg-cyan-400"
                >
                  <i className="fas fa-paper-plane"></i>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Insights Sidebar - Aligned with In-Ring UI */}
        <div className="hidden lg:flex lg:flex-col w-80 gap-4">
          <div className="space-y-4 flex-1 overflow-y-auto">
            {/* Sprint Map Card */}
            <Card className="border-white/10 bg-slate-900/60 backdrop-blur-xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-white">Sprint map</CardTitle>
                <p className="text-xs text-slate-300/80">Practice run - four steps to mastery.</p>
              </CardHeader>
              <CardContent>
                <SprintStepper currentStep={state.step} completedSteps={state.completedSteps} />
              </CardContent>
            </Card>

            {/* Coach Shortcuts Card */}
            <Card className="border-white/10 bg-slate-900/60 backdrop-blur-xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-white">Coach shortcuts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-slate-200/90">
                <p className="text-xs text-slate-300/70">
                  Practice mode - refine your pitch approach before entering the ring.
                </p>
                <p>Shift + Enter for a new line</p>
              </CardContent>
            </Card>

            {/* Solution Snapshot Card */}
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
                    <span className="font-semibold text-cyan-300">{categoryMeta.name}</span>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PitchDojo() {
  return (
    <SprintProvider>
      <PitchDojoContent />
    </SprintProvider>
  );
}
