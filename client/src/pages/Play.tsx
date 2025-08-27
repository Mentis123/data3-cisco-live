import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Category {
  key: string;
  name: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface StructuredSolution {
  problem_summary: string;
  chosen_category: string;
  cisco_products: string[];
  current_state: {
    baseline_kpis: Array<{ name: string; value: string }>;
    constraints: string[];
  };
  target_state: {
    kpis: Array<{ name: string; target: string }>;
    persona: string[];
  };
  integration_points: string[];
  security_considerations: string[];
  observability_plan: string[];
  rollout_plan: string[];
  risks: string[];
}

const CATEGORIES = [
  { key: "SECURE_CONNECTIVITY", name: "Zero Trust & Secure Connectivity", description: "SASE, SD-WAN, Network Segmentation (Catalyst Center, SD-WAN, Secure Client, Duo)" },
  { key: "HYBRID_DC", name: "Data Centre & Hybrid Cloud", description: "ACI/Nexus, UCS, HyperFabric infrastructure solutions" },
  { key: "COLLAB_CX", name: "Collaboration & Contact Centre", description: "Webex, Webex Contact Center, unified communications" },
  { key: "OBSERVABILITY", name: "Observability & Performance", description: "ThousandEyes, AppDynamics, Full-Stack Observability, resilience/SLOs" },
  { key: "EDGE_IOT", name: "Edge & IoT Solutions", description: "Meraki/Catalyst at branch/industrial edge, automation/telemetry" },
];

export default function Play() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [step, setStep] = useState<"registration" | "chat" | "preview">("registration");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [sessionToken, setSessionToken] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [messageCount, setMessageCount] = useState(0);
  const [structuredSolution, setStructuredSolution] = useState<StructuredSolution | null>(null);
  const [isTyping, setIsTyping] = useState(false);

  const startSessionMutation = useMutation({
    mutationFn: async ({ firstName, lastName }: { firstName: string; lastName: string }) => {
      const response = await apiRequest("POST", "/api/start", { firstName, lastName });
      return response.json();
    },
    onSuccess: (data) => {
      setSessionToken(data.sessionToken);
      setStep("chat");
      // Add initial assistant message
      const categoryName = CATEGORIES.find(c => c.key === selectedCategory)?.name || selectedCategory;
      setMessages([{
        role: "assistant",
        content: `Hi! I'm here to help you craft a winning solution. Let's start with your chosen category: **${categoryName}**\n\nCan you describe the business problem you want to solve in 1-2 sentences?`
      }]);
      setMessageCount(1);
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
    mutationFn: async ({ sessionToken, messages }: { sessionToken: string; messages: ChatMessage[] }) => {
      const response = await apiRequest("POST", "/api/chat", { sessionToken, messages });
      return response.json();
    },
    onSuccess: (data) => {
      setIsTyping(false);
      const assistantMessage: ChatMessage = { role: "assistant", content: data.content };
      setMessages(prev => [...prev, assistantMessage]);
      setMessageCount(prev => prev + 1);

      // Check if this is a structured JSON response
      try {
        const parsed = JSON.parse(data.content);
        if (parsed.problem_summary && parsed.chosen_category) {
          setStructuredSolution(parsed);
          setStep("preview");
        }
      } catch {
        // Not JSON, continue chat
      }
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
      const response = await apiRequest("POST", "/api/submit", {
        sessionToken,
        category: selectedCategory,
        solutionText: messages.map(m => `${m.role}: ${m.content}`).join("\n\n"),
        structuredFields: structuredSolution,
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Solution Submitted!",
        description: `Your score: ${data.finalScore}/50 (Rank #${data.rank}). Watch the leaderboard for live updates!`,
      });
      setTimeout(() => {
        setLocation("/leaderboard");
      }, 2000);
    },
    onError: (error) => {
      toast({
        title: "Submission Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleStartChat = () => {
    if (!firstName.trim() || !lastName.trim() || !selectedCategory) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields and select a category.",
        variant: "destructive",
      });
      return;
    }

    startSessionMutation.mutate({ firstName, lastName });
  };

  const handleSendMessage = () => {
    if (!currentMessage.trim() || isTyping) return;

    const userMessage: ChatMessage = { role: "user", content: currentMessage };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setCurrentMessage("");
    setIsTyping(true);

    chatMutation.mutate({ sessionToken, messages: [userMessage] });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (step === "registration") {
    return (
      <div className="min-h-screen bg-background text-foreground py-8">
        <div className="max-w-2xl mx-auto px-4">
          <Card className="glass-panel border-0">
            <CardHeader>
              <CardTitle className="text-3xl text-center">Let's Get Started</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Registration Form */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="As shown on your badge"
                    data-testid="input-first-name"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="As shown on your badge"
                    data-testid="input-last-name"
                  />
                </div>
              </div>

              {/* Category Selection */}
              <div>
                <Label className="text-xl font-bold mb-4 block">Choose Your Solution Category</Label>
                <div className="space-y-3">
                  {CATEGORIES.map((category) => (
                    <div
                      key={category.key}
                      className={`category-card ${selectedCategory === category.key ? "selected" : ""}`}
                      onClick={() => setSelectedCategory(category.key)}
                      data-testid={`category-${category.key}`}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                          <i className="fas fa-network-wired text-white text-lg"></i>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-lg">{category.name}</h4>
                          <p className="text-sm text-muted-foreground">{category.description}</p>
                        </div>
                        <input
                          type="radio"
                          name="category"
                          value={category.key}
                          checked={selectedCategory === category.key}
                          onChange={() => setSelectedCategory(category.key)}
                          className="w-5 h-5 text-primary"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleStartChat}
                disabled={!firstName.trim() || !lastName.trim() || !selectedCategory || startSessionMutation.isPending}
                className="w-full"
                data-testid="button-start-chat"
              >
                {startSessionMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Starting...
                  </>
                ) : (
                  <>
                    <i className="fas fa-comments mr-2"></i>
                    Start Solution Chat
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (step === "chat") {
    return (
      <div className="min-h-screen bg-background text-foreground py-8">
        <div className="max-w-4xl mx-auto px-4">
          <Card className="glass-panel border-0 overflow-hidden">
            {/* Chat Header */}
            <div className="bg-gradient-to-r from-primary to-secondary p-6 text-primary-foreground">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <i className="fas fa-robot text-lg"></i>
                </div>
                <div>
                  <h3 className="text-xl font-bold">Cisco Solution Coach</h3>
                  <p className="opacity-90">Let's refine your solution together</p>
                </div>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="h-96 overflow-y-auto p-6 space-y-4" data-testid="chat-messages">
              {messages.map((message, index) => (
                <div key={index} className="chat-message flex items-start space-x-3">
                  {message.role === "assistant" ? (
                    <>
                      <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center flex-shrink-0">
                        <i className="fas fa-robot text-white text-sm"></i>
                      </div>
                      <div className="glass-panel rounded-lg rounded-tl-none p-4 max-w-lg">
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
                        <i className="fas fa-user text-sm"></i>
                      </div>
                      <div className="bg-primary/10 border border-primary/20 rounded-lg rounded-tl-none p-4 max-w-lg">
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      </div>
                    </>
                  )}
                </div>
              ))}
              
              {isTyping && (
                <div className="chat-message flex items-start space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-robot text-white text-sm"></i>
                  </div>
                  <div className="glass-panel rounded-lg rounded-tl-none p-4">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: "0.2s" }}></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: "0.4s" }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div className="p-6 border-t border-border">
              <div className="flex space-x-3">
                <Textarea
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Describe your business problem..."
                  className="flex-1 min-h-12 resize-none"
                  disabled={isTyping}
                  data-testid="input-chat-message"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!currentMessage.trim() || isTyping}
                  data-testid="button-send-message"
                >
                  <i className="fas fa-paper-plane"></i>
                </Button>
              </div>
              <div className="mt-2 text-sm text-muted-foreground">
                Messages: <span data-testid="text-message-count">{messageCount}</span>/6 • Be specific about Cisco products and measurable outcomes
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (step === "preview" && structuredSolution) {
    return (
      <div className="min-h-screen bg-background text-foreground py-8">
        <div className="max-w-4xl mx-auto px-4">
          <Card className="glass-panel border-0">
            <CardHeader>
              <CardTitle className="text-2xl">Your Solution Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <Card className="glass-panel border-0">
                  <CardContent className="p-4">
                    <h4 className="font-bold mb-2">Problem Summary</h4>
                    <p className="text-sm text-muted-foreground">{structuredSolution.problem_summary}</p>
                  </CardContent>
                </Card>
                
                <Card className="glass-panel border-0">
                  <CardContent className="p-4">
                    <h4 className="font-bold mb-2">Cisco Products</h4>
                    <p className="text-sm text-muted-foreground">{structuredSolution.cisco_products.join(", ")}</p>
                  </CardContent>
                </Card>
                
                <Card className="glass-panel border-0">
                  <CardContent className="p-4">
                    <h4 className="font-bold mb-2">Target KPIs</h4>
                    <p className="text-sm text-muted-foreground">
                      {structuredSolution.target_state.kpis.map(kpi => `${kpi.name}: ${kpi.target}`).join(", ")}
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="glass-panel border-0">
                  <CardContent className="p-4">
                    <h4 className="font-bold mb-2">Integration Points</h4>
                    <p className="text-sm text-muted-foreground">{structuredSolution.integration_points.join(", ")}</p>
                  </CardContent>
                </Card>
              </div>

              <div className="flex space-x-4">
                <Button
                  onClick={() => submitSolutionMutation.mutate()}
                  disabled={submitSolutionMutation.isPending}
                  className="flex-1"
                  data-testid="button-submit-solution"
                >
                  {submitSolutionMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-check mr-2"></i>
                      Submit Solution
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setStep("chat")}
                  data-testid="button-edit-more"
                >
                  <i className="fas fa-edit mr-2"></i>
                  Edit More
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return null;
}
