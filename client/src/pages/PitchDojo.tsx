import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  const { state, dispatch } = useSprint();

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [isUserNearBottom, setIsUserNearBottom] = useState(true);

  // Scroll management
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
      setIsUserNearBottom(distanceFromBottom <= 120);
    };

    container.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, [selectedCategory, state.step]);

  useEffect(() => {
    if (!isUserNearBottom) return;

    const container = chatContainerRef.current;
    if (!container) return;

    container.scrollTo({
      top: container.scrollHeight,
      behavior: "smooth",
    });
  }, [state.messages, isTyping, isUserNearBottom]);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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

      // Update step if needed
      if (result.step !== state.step) {
        dispatch({ type: "SET_STEP", payload: result.step as 1 | 2 | 3 | 4 });
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
    <div className="flex min-h-screen min-h-[100dvh] flex-col bg-gradient-to-b from-data3-blue-black via-[#000025] to-data3-blue-black text-data3-white">
      {/* Header */}
      <div
        className="border-b-2 px-4 py-4 sm:px-6 flex items-center justify-between"
        style={{
          borderColor: UNIFIED_THEME.border,
          background: UNIFIED_THEME.background,
          boxShadow: UNIFIED_THEME.shadow,
        }}
      >
        <div className="flex items-center gap-4">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
            style={{ backgroundColor: categoryMeta.color + "30" }}
          >
            {categoryMeta.icon}
          </div>
          <div>
            <Badge className="mb-1 bg-data3-blue/30 text-data3-pale-blue border-data3-light-blue/50 text-xs">
              PITCH DOJO - PRACTICE MODE
            </Badge>
            <h2 className="text-lg font-semibold">{categoryMeta.name}</h2>
          </div>
        </div>
        <Button
          onClick={handleRestart}
          variant="ghost"
          size="sm"
          className="text-data3-white/80 hover:text-data3-white hover:bg-white/10"
        >
          <i className="fas fa-arrow-left mr-2"></i>
          Change Category
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Progress Stepper */}
          <div className="px-4 py-4 border-b border-white/10">
            <SprintStepper currentStep={state.step} completedSteps={state.completedSteps} />
          </div>

          {/* Messages */}
          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto px-4 py-6 space-y-4"
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
          <div className="border-t border-white/10 p-4">
            <div className="flex gap-2">
              <Input
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  state.step === 4
                    ? "Practice complete! Change category to try again."
                    : "Type your message..."
                }
                disabled={isTyping || state.step === 4 || isBooting}
                className="flex-1 bg-white/5 border-white/20 text-data3-white placeholder:text-data3-white/40"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!currentMessage.trim() || isTyping || state.step === 4 || isBooting}
                className="bg-data3-light-blue hover:bg-data3-light-blue/80 text-data3-blue-black"
              >
                Send
              </Button>
            </div>
            {state.step === 4 && (
              <div className="mt-4 text-center space-y-2">
                <p className="text-sm text-data3-white/80">
                  🎉 Great practice! You've completed the pitch coaching flow.
                </p>
                <Button
                  onClick={handleRestart}
                  className="bg-data3-light-blue hover:bg-data3-light-blue/80 text-data3-blue-black"
                >
                  Practice Another Category
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Insights Sidebar */}
        <div className="hidden lg:block w-80 border-l border-white/10 bg-white/[0.02] p-4 overflow-y-auto">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-data3-white">Your Progress</h3>

            {state.problem && (
              <Card className="border-white/10 bg-white/5">
                <CardContent className="p-4 space-y-2">
                  <h4 className="font-semibold text-sm text-data3-light-blue">Problem</h4>
                  <p className="text-xs text-data3-white/80">{state.problem.summary}</p>
                </CardContent>
              </Card>
            )}

            {state.impact && (
              <Card className="border-white/10 bg-white/5">
                <CardContent className="p-4 space-y-2">
                  <h4 className="font-semibold text-sm text-data3-light-blue">Impact</h4>
                  <p className="text-xs text-data3-white/80">{state.impact.summary}</p>
                  {state.impact.baseline && (
                    <div className="text-xs space-y-1 pt-2 border-t border-white/10">
                      <p>Weekly Hours: {state.impact.baseline.weekly_hours_lost}</p>
                      <p>Monthly Cost: ${state.impact.baseline.monthly_cost?.toLocaleString()}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {previewSubmission && (
              <Card className="border-white/10 bg-white/5">
                <CardContent className="p-4 space-y-2">
                  <h4 className="font-semibold text-sm text-data3-light-blue">Solution Preview</h4>
                  <p className="text-xs text-data3-white/80">{previewSubmission.solution_summary}</p>
                </CardContent>
              </Card>
            )}

            <Card className="border-yellow-500/30 bg-yellow-500/5">
              <CardContent className="p-4 space-y-2">
                <h4 className="font-semibold text-sm text-yellow-400">Practice Tips</h4>
                <ul className="text-xs text-data3-white/70 space-y-1 list-disc list-inside">
                  <li>Be specific about the problem</li>
                  <li>Quantify the business impact</li>
                  <li>Align solution with category</li>
                  <li>Focus on measurable outcomes</li>
                </ul>
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
