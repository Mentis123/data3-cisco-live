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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Scroll to top when entering preview/edit steps
  useEffect(() => {
    if (step === "preview" || step === "edit") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [step]);

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
      // Look for JSON embedded in the response (may have text before/after)
      const jsonMatch = data.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const jsonStr = jsonMatch[0];
          const parsed = JSON.parse(jsonStr);
          console.log("Parsed JSON:", parsed);
          if (parsed.problem_summary && parsed.chosen_category) {
            console.log("Setting structured solution and moving to preview");
            setStructuredSolution(parsed);
            setStep("preview");
            toast({
              title: "Solution Ready!",
              description: "Review and edit your solution before submitting",
            });
          } else {
            console.log("JSON missing required fields:", parsed);
          }
        } catch (e) {
          // Not valid JSON or missing required fields, continue chat
          console.log("JSON parse attempt failed:", e);
        }
      } else {
        console.log("No JSON found in response");
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
      // Prevent duplicate submissions
      if (isSubmitting) {
        throw new Error("Already submitting, please wait...");
      }
      setIsSubmitting(true);
      
      const response = await apiRequest("POST", "/api/submit", {
        sessionToken,
        category: selectedCategory,
        solutionText: messages.map(m => `${m.role}: ${m.content}`).join("\n\n"),
        structuredFields: editedSolution || structuredSolution,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setIsSubmitting(false);
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
      setIsSubmitting(false);
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
      <div className="min-h-screen bg-background text-foreground py-4 sm:py-8 safe-area-padding">
        <div className="max-w-2xl mx-auto px-4">
          <Card className="glass-panel border-0">
            <CardHeader className="pb-4 sm:pb-6">
              <CardTitle className="text-2xl sm:text-3xl text-center">Let's Get Started</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6">
              {/* Registration Form */}
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
                    placeholder="As shown on your badge"
                    className="mobile-input"
                    data-testid="input-last-name"
                  />
                </div>
              </div>

              {/* Category Selection */}
              <div>
                <Label className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 block">Choose Your Solution Category</Label>
                <div className="space-y-2 sm:space-y-3">
                  {CATEGORIES.map((category) => (
                    <div
                      key={category.key}
                      className={`category-card touch-manipulation ${selectedCategory === category.key ? "selected" : ""}`}
                      onClick={() => setSelectedCategory(category.key)}
                      data-testid={`category-${category.key}`}
                    >
                      <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center flex-shrink-0">
                          <i className="fas fa-network-wired text-white text-base sm:text-lg"></i>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-base sm:text-lg leading-tight">{category.name}</h4>
                          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{category.description}</p>
                        </div>
                        <input
                          type="radio"
                          name="category"
                          value={category.key}
                          checked={selectedCategory === category.key}
                          onChange={() => setSelectedCategory(category.key)}
                          className="w-5 h-5 sm:w-6 sm:h-6 text-primary flex-shrink-0 mt-1 sm:mt-0"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleStartChat}
                disabled={!firstName.trim() || !lastName.trim() || !selectedCategory || startSessionMutation.isPending}
                className="w-full min-h-[52px] text-base sm:text-lg touch-manipulation"
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

    const observabilityText = `Employees are increasingly concerned about "being watched everywhere" due to the implementation of observability and monitoring tools across applications, networks, and endpoints. While the intention is to improve service reliability, security, and customer experience, staff perceive the tools as invasive surveillance. This erodes trust, creates resistance to adoption, and negatively impacts morale.

Key pain points include:

Lack of transparency on why data is being collected.

Perception that monitoring is about employee surveillance, not business performance.

Decline in employee engagement scores linked to "trust in IT" and "psychological safety."

Rising costs from downtime and performance blind spots due to partial tool adoption.

The solution is to implement a Full-Stack Observability (FSO) strategy using Cisco ThousandEyes, AppDynamics, and SecureX, supported by clear governance and transparent communications. The focus is on demonstrating that monitoring protects employees and customers by improving application performance, system reliability, and security — rather than monitoring individuals.

AppDynamics – Application Performance Monitoring (APM) to link user experience and application behaviour with business KPIs.

ThousandEyes – End-to-end visibility across internet, cloud, and SaaS services to detect and resolve issues proactively.

SecureX – Orchestration and governance, providing role-based access, anonymisation, and policy enforcement to build employee trust.

Cisco Intersight Workload Optimizer (IWO) – Ensures infrastructure optimisation for hybrid workloads.

Secure Network Analytics (Stealthwatch) – Complements observability with network behaviour insights.

Transparency Campaign: Publish a clear statement of purpose (e.g., "We monitor applications, not employees") with FAQs addressing staff concerns.

Engagement Workshops: Show employees how observability benefits them—fewer outages, faster fixes, reduced blame culture.

KPI Re-alignment: Tie observability metrics to business outcomes (uptime, MTTR, customer satisfaction) rather than personal productivity.

Feedback Loop: Regular staff surveys feeding into observability governance to maintain trust.

Employee Trust Score (Engagement Surveys): ~62% positive (down 10% YoY).

Mean Time to Detect (MTTD): ~90 minutes.

Mean Time to Resolve (MTTR): ~6.5 hours.

Downtime Cost: ~$50,000/hour for Tier-1 applications.

Dashboard Adoption: <40% of IT/Ops teams engage with current monitoring dashboards.

ITSM Tools: ServiceNow, Jira Service Management for automated incident creation.

Identity Platforms: Azure AD, Okta integrated with SecureX for RBAC and anonymisation.

Collaboration Tools: Microsoft Teams, Webex for in-channel alerting and response.

SIEM Platforms: Splunk, QRadar to extend observability telemetry into enterprise-wide security.

AppDynamics Health Rules: Threshold-based alerts on latency, errors, and transaction success.

ThousandEyes Alerts: Proactive notifications for SaaS and internet degradation.

SecureX Orchestration Runbooks:

Alert fires in AppDynamics/ThousandEyes.

SecureX correlates telemetry, opens ServiceNow ticket.

Automated remediation (e.g., restart service, scale cloud workload) triggered with one-click approval.

MTTD Reduction: From 90 minutes → <20 minutes.

MTTR Reduction: From 6.5 hours → <2 hours.

Employee Trust Score: From 62% → >75%.

Downtime Costs: Reduce unplanned downtime impact by ~30% YoY.

Phase 1 – Pilot (Months 1–3):

Deploy AppDynamics + ThousandEyes on one Tier-1 app.

Integrate with ServiceNow.

Launch transparency campaign with staff.

Phase 2 – Expansion (Months 4–6):

Extend to top 5 business-critical apps and hybrid workloads.

Enable SecureX orchestration for automated runbooks.

Collect KPI improvements and employee feedback.

Phase 3 – Scale (Months 7–12):

Roll out observability to entire app and SaaS landscape.

Integrate with SIEM for unified IT + Security monitoring.

Conduct quarterly KPI reviews to demonstrate business value.

By combining Cisco AppDynamics, ThousandEyes, and SecureX with transparent communications and governance, this proposal reframes observability as a protective shield rather than "surveillance." The approach reduces downtime, lowers operational costs, and restores employee trust — ensuring observability becomes a strategic business enabler, not a source of friction.`;

    const handleCopyTestText = () => {
      navigator.clipboard.writeText(testText);
      toast({
        title: "Copied to clipboard",
        description: "Test text has been copied for testing purposes",
      });
    };

    const handleCopyObservabilityText = () => {
      navigator.clipboard.writeText(observabilityText);
      toast({
        title: "Copied to clipboard",
        description: "Observability proposal copied for testing",
      });
    };

    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col safe-area-padding">
        <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col px-4 py-4 sm:py-8">
          <Card className="glass-panel border-0 overflow-hidden flex-1 flex flex-col">
            {/* Chat Header */}
            <div className="bg-gradient-to-r from-primary to-secondary p-4 sm:p-6 text-primary-foreground flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-robot text-base sm:text-lg"></i>
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg sm:text-xl font-bold truncate">Cisco Solution Coach</h3>
                    <p className="text-xs sm:text-sm opacity-90">Let's refine your solution together</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyObservabilityText}
                    className="text-primary-foreground hover:bg-white/20"
                    title="Copy observability proposal text"
                    data-testid="button-copy-observability"
                  >
                    <i className="fas fa-eye"></i>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyTestText}
                    className="text-primary-foreground hover:bg-white/20"
                    title="Copy collaboration proposal text"
                    data-testid="button-copy-test"
                  >
                    <i className="fas fa-copy"></i>
                  </Button>
                </div>
              </div>
            </div>

            {/* Chat Messages */}
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 sm:space-y-4 -webkit-overflow-scrolling-touch" data-testid="chat-messages">
              {messages.map((message, index) => (
                <div key={index} className="chat-message flex items-start gap-2 sm:gap-3">
                  {message.role === "assistant" ? (
                    <>
                      <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center flex-shrink-0">
                        <i className="fas fa-robot text-white text-xs sm:text-sm"></i>
                      </div>
                      <div className="glass-panel rounded-lg rounded-tl-none p-3 sm:p-4 max-w-[85%] sm:max-w-lg">
                        <div className="whitespace-pre-wrap text-sm sm:text-base">
                          {(() => {
                            // Check if content looks like JSON
                            if (message.content.trim().startsWith('{') && message.content.trim().endsWith('}')) {
                              try {
                                const parsed = JSON.parse(message.content);
                                // Return formatted view for structured solution
                                return (
                                  <div className="space-y-3">
                                    <p className="font-semibold">Here's your structured solution proposal:</p>
                                    {parsed.problem_summary && (
                                      <div className="border-l-2 border-primary pl-3">
                                        <p className="font-medium text-xs uppercase text-muted-foreground">Problem Summary</p>
                                        <p>{parsed.problem_summary}</p>
                                      </div>
                                    )}
                                    {parsed.chosen_category && (
                                      <div className="border-l-2 border-primary pl-3">
                                        <p className="font-medium text-xs uppercase text-muted-foreground">Category</p>
                                        <p>{parsed.chosen_category.replace(/_/g, ' ')}</p>
                                      </div>
                                    )}
                                    {parsed.cisco_products && (
                                      <div className="border-l-2 border-primary pl-3">
                                        <p className="font-medium text-xs uppercase text-muted-foreground">Cisco Products</p>
                                        <ul className="list-disc list-inside space-y-1">
                                          {parsed.cisco_products.map((product: string, idx: number) => (
                                            <li key={idx}>{product}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                    <p className="text-xs text-muted-foreground mt-3">
                                      This structured solution has been prepared for evaluation. Ready to submit when you are!
                                    </p>
                                  </div>
                                );
                              } catch (e) {
                                // If parse fails, show as regular text
                                return message.content;
                              }
                            }
                            // Regular message
                            return message.content;
                          })()}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-7 h-7 sm:w-8 sm:h-8 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
                        <i className="fas fa-user text-xs sm:text-sm"></i>
                      </div>
                      <div className="bg-primary/10 border border-primary/20 rounded-lg rounded-tl-none p-3 sm:p-4 max-w-[85%] sm:max-w-lg">
                        <p className="whitespace-pre-wrap text-sm sm:text-base">{message.content}</p>
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

            {/* Chat Input - Fixed at Bottom */}
            <div className="p-4 sm:p-6 border-t border-border flex-shrink-0 bg-background">
              <div className="flex gap-2 sm:gap-3">
                <Textarea
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Describe your business problem..."
                  className="flex-1 min-h-[48px] sm:min-h-12 resize-none mobile-textarea text-sm sm:text-base"
                  disabled={isTyping}
                  data-testid="input-chat-message"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!currentMessage.trim() || isTyping}
                  className="min-h-[48px] min-w-[48px] px-3 touch-manipulation"
                  data-testid="button-send-message"
                >
                  <i className="fas fa-paper-plane"></i>
                </Button>
              </div>
              <div className="mt-2 text-xs sm:text-sm text-muted-foreground">
                Messages: <span data-testid="text-message-count">{messageCount}</span>/6 • Be specific about Cisco products
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
      <div className="min-h-screen bg-background text-foreground py-4 sm:py-8 safe-area-padding">
        <div className="max-w-4xl mx-auto px-4">
          <Card className="glass-panel border-0">
            <CardHeader className="pb-4 sm:pb-6">
              <CardTitle className="text-xl sm:text-2xl">Review Your Solution</CardTitle>
              <p className="text-sm sm:text-base text-muted-foreground">Review your solution before submitting for scoring</p>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6">
              <div className="space-y-4">
                {/* Problem Summary */}
                <div className="glass-panel rounded-lg p-3 sm:p-4">
                  <Label className="font-bold mb-2 flex items-center text-sm sm:text-base">
                    <i className="fas fa-lightbulb text-primary mr-2 text-sm"></i>
                    Problem Summary
                  </Label>
                  <Textarea
                    value={solution.problem_summary}
                    onChange={(e) => setEditedSolution({...solution, problem_summary: e.target.value} as StructuredSolution)}
                    className="min-h-[80px] text-xs sm:text-sm mobile-textarea"
                    placeholder="Describe the business problem..."
                    data-testid="textarea-preview-problem"
                  />
                </div>
                
                {/* Cisco Products */}
                <div className="glass-panel rounded-lg p-3 sm:p-4">
                  <Label className="font-bold mb-2 flex items-center text-sm sm:text-base">
                    <i className="fas fa-network-wired text-primary mr-2 text-sm"></i>
                    Cisco Products (comma-separated)
                  </Label>
                  <Input
                    value={isArrayField(solution.cisco_products).join(", ")}
                    onChange={(e) => setEditedSolution({
                      ...solution, 
                      cisco_products: e.target.value.split(",").map(p => p.trim()).filter(p => p)
                    } as StructuredSolution)}
                    className="mobile-input text-xs sm:text-sm"
                    placeholder="e.g., Catalyst Center, SD-WAN, ThousandEyes"
                    data-testid="input-preview-products"
                  />
                </div>
                
                {/* Target KPIs */}
                <div className="glass-panel rounded-lg p-3 sm:p-4">
                  <Label className="font-bold mb-2 flex items-center text-sm sm:text-base">
                    <i className="fas fa-chart-line text-primary mr-2 text-sm"></i>
                    Target KPIs
                  </Label>
                  <div className="space-y-2">
                    {solution.target_state?.kpis?.map((kpi, idx) => (
                      <div key={idx} className="flex gap-2">
                        <Input
                          value={kpi.name}
                          onChange={(e) => {
                            const newKpis = [...solution.target_state.kpis];
                            newKpis[idx] = {...kpi, name: e.target.value};
                            setEditedSolution({...solution, target_state: {...solution.target_state, kpis: newKpis}} as StructuredSolution);
                          }}
                          placeholder="KPI name"
                          className="flex-1 mobile-input text-xs sm:text-sm"
                          data-testid={`input-preview-kpi-name-${idx}`}
                        />
                        <Input
                          value={kpi.target}
                          onChange={(e) => {
                            const newKpis = [...solution.target_state.kpis];
                            newKpis[idx] = {...kpi, target: e.target.value};
                            setEditedSolution({...solution, target_state: {...solution.target_state, kpis: newKpis}} as StructuredSolution);
                          }}
                          placeholder="Target"
                          className="w-24 sm:w-32 mobile-input text-xs sm:text-sm"
                          data-testid={`input-preview-kpi-target-${idx}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Integration Points */}
                <div className="glass-panel rounded-lg p-3 sm:p-4">
                  <Label className="font-bold mb-2 flex items-center text-sm sm:text-base">
                    <i className="fas fa-plug text-primary mr-2 text-sm"></i>
                    Integration Points (comma-separated)
                  </Label>
                  <Input
                    value={isArrayField(solution.integration_points).join(", ")}
                    onChange={(e) => setEditedSolution({
                      ...solution,
                      integration_points: e.target.value.split(",").map(p => p.trim()).filter(p => p)
                    } as StructuredSolution)}
                    className="mobile-input text-xs sm:text-sm"
                    placeholder="e.g., Microsoft 365, ServiceNow, Okta"
                    data-testid="input-preview-integrations"
                  />
                </div>

                {/* Rollout Plan */}
                {solution.rollout_plan && (
                  <div className="glass-panel rounded-lg p-3 sm:p-4">
                    <Label className="font-bold mb-2 flex items-center text-sm sm:text-base">
                      <i className="fas fa-tasks text-primary mr-2 text-sm"></i>
                      Rollout Plan (one per line)
                    </Label>
                    <Textarea
                      value={isArrayField(solution.rollout_plan).join("\n")}
                      onChange={(e) => setEditedSolution({
                        ...solution,
                        rollout_plan: e.target.value.split("\n").filter(s => s.trim())
                      } as StructuredSolution)}
                      className="min-h-[100px] text-xs sm:text-sm mobile-textarea"
                      placeholder="Enter rollout steps, one per line"
                      data-testid="textarea-preview-rollout"
                    />
                  </div>
                )}
              </div>

              <div className="flex space-x-4">
                <Button
                  onClick={() => !isSubmitting && submitSolutionMutation.mutate()}
                  disabled={submitSolutionMutation.isPending || isSubmitting}
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
