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
  { key: "SECURE_CONNECTIVITY", name: "Zero Trust, SASE, SD-WAN, Network Segmentation", description: "(e.g., Catalyst Center, SD-WAN, Secure Client, Duo)" },
  { key: "HYBRID_DC", name: "Data Centre & Hybrid Cloud", description: "(e.g., ACI/Nexus, UCS, HyperFabric)" },
  { key: "COLLAB_CX", name: "Collaboration & Contact Centre", description: "(e.g., Webex, Webex Contact Center)" },
  { key: "OBSERVABILITY", name: "ThousandEyes, AppDynamics, Full-Stack Observability", description: "resilience/SLOs" },
  { key: "EDGE_IOT", name: "Meraki/Catalyst at branch/industrial edge", description: "automation/telemetry" },
];

export default function Play() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [step, setStep] = useState<"registration" | "chat" | "preview" | "edit">("registration");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [sessionToken, setSessionToken] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [messageCount, setMessageCount] = useState(0);
  const [structuredSolution, setStructuredSolution] = useState<StructuredSolution | null>(null);
  const [editedSolution, setEditedSolution] = useState<StructuredSolution | null>(null);
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
        structuredFields: editedSolution || structuredSolution,
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Solution Submitted!",
        description: `Your score: ${data.finalScore}/50 (Rank #${data.rank}). Watch the leaderboard for live updates!`,
      });
      
      // If WebSocket blocked, poll /api/leaderboard every 2s for 10s
      let pollCount = 0;
      const pollInterval = setInterval(async () => {
        pollCount++;
        if (pollCount > 5) {
          clearInterval(pollInterval);
          setLocation("/leaderboard");
          return;
        }
        try {
          await apiRequest("GET", `/api/leaderboard?limit=10`);
        } catch (e) {
          // Continue polling
        }
      }, 2000);
      
      setTimeout(() => {
        clearInterval(pollInterval);
        setLocation("/leaderboard");
      }, 3000);
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
    const testText = `Our organisation recently shifted a large part of our workforce to hybrid models, with staff moving between corporate offices, home, and customer sites. Current VPN infrastructure struggles to handle the load, leading to inconsistent performance and frustration among end-users.

Pain points: Slow login/authentication times, dropped connections during video calls, and limited visibility into which users/applications consume bandwidth.

KPIs: Mean time to connect (currently averaging 90+ seconds), help desk tickets related to VPN (~30% of all IT tickets), and NPS scores for collaboration tools trending downward.

I think Cisco Secure Client (AnyConnect successor), Duo MFA integration, Umbrella DNS Security, and Webex embedded AI features could help. We need integration with Microsoft 365, Okta for identity federation, and ServiceNow for IT service workflows.

Security concerns: Ensuring conditional access policies apply consistently across remote, on-prem, and cloud users; monitoring shadow IT apps accessed from home devices; and reducing risk of credential theft in chat applications.

For observability, we'd like to use Cisco ThousandEyes for real-time visibility, implement AppDynamics to trace performance, deploy automation workflows in SecureX, and build dashboards that track key KPIs.`;

    const handleCopyTestText = () => {
      navigator.clipboard.writeText(testText);
      toast({
        title: "Copied to clipboard",
        description: "Test text has been copied for testing purposes",
      });
    };

    return (
      <div className="min-h-screen bg-background text-foreground py-8">
        <div className="max-w-4xl mx-auto px-4">
          <Card className="glass-panel border-0 overflow-hidden">
            {/* Chat Header */}
            <div className="bg-gradient-to-r from-primary to-secondary p-6 text-primary-foreground">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <i className="fas fa-robot text-lg"></i>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Cisco Solution Coach</h3>
                    <p className="opacity-90">Let's refine your solution together</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyTestText}
                  className="text-primary-foreground hover:bg-white/20"
                  title="Copy test text for testing purposes"
                  data-testid="button-copy-test"
                >
                  <i className="fas fa-copy"></i>
                </Button>
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
    const solution = editedSolution || structuredSolution;
    const isArrayField = (field: any) => Array.isArray(field) ? field : typeof field === 'string' ? [field] : [];
    
    return (
      <div className="min-h-screen bg-background text-foreground py-8">
        <div className="max-w-4xl mx-auto px-4">
          <Card className="glass-panel border-0">
            <CardHeader>
              <CardTitle className="text-2xl">Review Your Solution</CardTitle>
              <p className="text-muted-foreground">Review your solution before submitting for scoring</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                {/* Problem Summary */}
                <div className="glass-panel rounded-lg p-4">
                  <h4 className="font-bold mb-2 flex items-center">
                    <i className="fas fa-lightbulb text-primary mr-2"></i>
                    Problem Summary
                  </h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{solution.problem_summary}</p>
                </div>
                
                {/* Cisco Products */}
                <div className="glass-panel rounded-lg p-4">
                  <h4 className="font-bold mb-2 flex items-center">
                    <i className="fas fa-network-wired text-primary mr-2"></i>
                    Cisco Products
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {isArrayField(solution.cisco_products).map((product: string, idx: number) => (
                      <span key={idx} className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
                        {product}
                      </span>
                    ))}
                  </div>
                </div>
                
                {/* Target KPIs */}
                <div className="glass-panel rounded-lg p-4">
                  <h4 className="font-bold mb-2 flex items-center">
                    <i className="fas fa-chart-line text-primary mr-2"></i>
                    Target KPIs
                  </h4>
                  <div className="space-y-2">
                    {solution.target_state?.kpis?.map((kpi, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-muted/20 rounded px-3 py-2">
                        <span className="text-sm font-medium">{kpi.name}</span>
                        <span className="text-sm text-primary font-bold">{kpi.target}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Integration Points */}
                <div className="glass-panel rounded-lg p-4">
                  <h4 className="font-bold mb-2 flex items-center">
                    <i className="fas fa-plug text-primary mr-2"></i>
                    Integration Points
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {isArrayField(solution.integration_points).map((point: string, idx: number) => (
                      <span key={idx} className="bg-muted text-muted-foreground px-3 py-1 rounded-lg text-sm">
                        {point}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Rollout Plan */}
                {solution.rollout_plan && (
                  <div className="glass-panel rounded-lg p-4">
                    <h4 className="font-bold mb-2 flex items-center">
                      <i className="fas fa-tasks text-primary mr-2"></i>
                      Rollout Plan
                    </h4>
                    <ol className="list-decimal list-inside space-y-1">
                      {isArrayField(solution.rollout_plan).map((step: string, idx: number) => (
                        <li key={idx} className="text-sm text-muted-foreground">{step}</li>
                      ))}
                    </ol>
                  </div>
                )}
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
                      Submit for Scoring
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditedSolution(solution);
                    setStep("edit");
                  }}
                  data-testid="button-edit-solution"
                >
                  <i className="fas fa-edit mr-2"></i>
                  Edit Solution
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (step === "edit" && (editedSolution || structuredSolution)) {
    const solution = editedSolution || structuredSolution;
    if (!solution) return null;
    const isArrayField = (field: any) => Array.isArray(field) ? field : typeof field === 'string' ? [field] : [];
    
    return (
      <div className="min-h-screen bg-background text-foreground py-8">
        <div className="max-w-4xl mx-auto px-4">
          <Card className="glass-panel border-0">
            <CardHeader>
              <CardTitle className="text-2xl">Edit Your Solution</CardTitle>
              <p className="text-muted-foreground">Fine-tune your solution details</p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Problem Summary */}
              <div>
                <Label htmlFor="problem-summary" className="text-lg font-semibold flex items-center mb-2">
                  <i className="fas fa-lightbulb text-primary mr-2"></i>
                  Problem Summary
                </Label>
                <Textarea
                  id="problem-summary"
                  value={solution.problem_summary}
                  onChange={(e) => setEditedSolution({...solution, problem_summary: e.target.value} as StructuredSolution)}
                  className="min-h-24"
                  placeholder="Describe the business problem you're solving..."
                  data-testid="textarea-problem-summary"
                />
              </div>

              {/* Cisco Products */}
              <div>
                <Label htmlFor="cisco-products" className="text-lg font-semibold flex items-center mb-2">
                  <i className="fas fa-network-wired text-primary mr-2"></i>
                  Cisco Products (comma-separated)
                </Label>
                <Input
                  id="cisco-products"
                  value={isArrayField(solution.cisco_products).join(", ")}
                  onChange={(e) => setEditedSolution({
                    ...solution, 
                    cisco_products: e.target.value.split(",").map(p => p.trim()).filter(p => p)
                  } as StructuredSolution)}
                  placeholder="e.g., Catalyst Center, SD-WAN, ThousandEyes"
                  data-testid="input-cisco-products"
                />
              </div>

              {/* Target KPIs */}
              <div>
                <Label className="text-lg font-semibold flex items-center mb-2">
                  <i className="fas fa-chart-line text-primary mr-2"></i>
                  Target KPIs
                </Label>
                <div className="space-y-2">
                  {solution.target_state?.kpis?.map((kpi, idx) => (
                    <div key={idx} className="flex space-x-2">
                      <Input
                        value={kpi.name}
                        onChange={(e) => {
                          const newKpis = [...solution.target_state.kpis];
                          newKpis[idx] = {...kpi, name: e.target.value};
                          setEditedSolution({...solution, target_state: {...solution.target_state, kpis: newKpis}} as StructuredSolution);
                        }}
                        placeholder="KPI name"
                        className="flex-1"
                        data-testid={`input-kpi-name-${idx}`}
                      />
                      <Input
                        value={kpi.target}
                        onChange={(e) => {
                          const newKpis = [...solution.target_state.kpis];
                          newKpis[idx] = {...kpi, target: e.target.value};
                          setEditedSolution({...solution, target_state: {...solution.target_state, kpis: newKpis}} as StructuredSolution);
                        }}
                        placeholder="Target value"
                        className="flex-1"
                        data-testid={`input-kpi-target-${idx}`}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const newKpis = solution.target_state.kpis.filter((_, i) => i !== idx);
                          setEditedSolution({...solution, target_state: {...solution.target_state, kpis: newKpis}} as StructuredSolution);
                        }}
                        data-testid={`button-remove-kpi-${idx}`}
                      >
                        <i className="fas fa-times text-destructive"></i>
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newKpis = [...(solution.target_state?.kpis || []), {name: "", target: ""}];
                      setEditedSolution({...solution, target_state: {...solution.target_state, kpis: newKpis}} as StructuredSolution);
                    }}
                    data-testid="button-add-kpi"
                  >
                    <i className="fas fa-plus mr-2"></i>
                    Add KPI
                  </Button>
                </div>
              </div>

              {/* Integration Points */}
              <div>
                <Label htmlFor="integration-points" className="text-lg font-semibold flex items-center mb-2">
                  <i className="fas fa-plug text-primary mr-2"></i>
                  Integration Points (comma-separated)
                </Label>
                <Input
                  id="integration-points"
                  value={isArrayField(solution.integration_points).join(", ")}
                  onChange={(e) => setEditedSolution({
                    ...solution, 
                    integration_points: e.target.value.split(",").map(p => p.trim()).filter(p => p)
                  } as StructuredSolution)}
                  placeholder="e.g., Active Directory, ServiceNow, Splunk"
                  data-testid="input-integration-points"
                />
              </div>

              {/* Rollout Plan */}
              <div>
                <Label htmlFor="rollout-plan" className="text-lg font-semibold flex items-center mb-2">
                  <i className="fas fa-tasks text-primary mr-2"></i>
                  Rollout Plan (comma-separated steps)
                </Label>
                <Textarea
                  id="rollout-plan"
                  value={isArrayField(solution.rollout_plan).join(", ")}
                  onChange={(e) => setEditedSolution({
                    ...solution,
                    rollout_plan: e.target.value.split(",").map(p => p.trim()).filter(p => p)
                  } as StructuredSolution)}
                  className="min-h-20"
                  placeholder="e.g., Pilot phase with 10 users, Expand to department, Full rollout"
                  data-testid="textarea-rollout-plan"
                />
              </div>

              <div className="flex space-x-4">
                <Button
                  onClick={() => setStep("preview")}
                  className="flex-1"
                  data-testid="button-save-changes"
                >
                  <i className="fas fa-save mr-2"></i>
                  Save & Review
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    // Return to chat with AI
                    setEditedSolution(null);
                    setStep("chat");
                    setStructuredSolution(null);
                  }}
                  data-testid="button-back-to-chat"
                >
                  <i className="fas fa-comments mr-2"></i>
                  Back to Chat
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
