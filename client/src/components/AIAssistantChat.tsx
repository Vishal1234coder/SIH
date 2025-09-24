import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Bot, User, Send, X, Mic } from "lucide-react";

interface Message {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface AIAssistantChatProps {
  isOpen: boolean;
  onClose: () => void;
  patientName?: string;
}

export default function AIAssistantChat({ isOpen, onClose, patientName }: AIAssistantChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "assistant", 
      content: `Hello ${patientName || 'there'}! I'm your AI health assistant. I can help you with questions about your medications, side effects, or general health concerns. How can I assist you today?`,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // todo: remove mock functionality  
  const commonQuestions = [
    "When should I take my medicine?",
    "What are the side effects?",
    "I'm feeling dizzy, what should I do?",
    "Can I take this with food?",
    "I missed a dose, what now?"
  ];

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const simulateAIResponse = (userMessage: string) => {
    setIsTyping(true);
    
    setTimeout(() => {
      let response = "";
      const lowerMessage = userMessage.toLowerCase();
      
      if (lowerMessage.includes("side effect") || lowerMessage.includes("dizzy") || lowerMessage.includes("nausea")) {
        response = "I understand you're experiencing side effects. If you're feeling dizzy or nauseous, this could be related to your medication. Please sit down, drink some water, and avoid sudden movements. If symptoms persist or worsen, contact your doctor immediately. Would you like me to help you contact your healthcare provider?";
      } else if (lowerMessage.includes("when") || lowerMessage.includes("time")) {
        response = "Based on your prescription, you should take your medications at the scheduled times. For Metformin, take it after breakfast around 9 AM. For Lisinopril, take it in the morning around 7 AM on an empty stomach. Setting phone alarms can help you remember!";
      } else if (lowerMessage.includes("missed") || lowerMessage.includes("forgot")) {
        response = "If you missed a dose and it's been less than 2 hours, take it now. If it's almost time for your next dose, skip the missed one and continue with your regular schedule. Never double dose. I've noted this for your doctor's review.";
      } else if (lowerMessage.includes("food")) {
        response = "Some medications should be taken with food, others on an empty stomach. Metformin should be taken with food to reduce stomach upset. Lisinopril works best on an empty stomach. Check your medication labels or ask me about specific medicines!";
      } else {
        response = "I'm here to help with your medication questions. I can provide information about timing, side effects, and general guidance. However, for serious concerns or emergency situations, please contact your doctor or emergency services immediately. What specific question do you have about your medications?";
      }
      
      const newMessage: Message = {
        id: Date.now().toString(),
        type: "assistant",
        content: response,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, newMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const handleSendMessage = (messageText?: string) => {
    const text = messageText || inputValue.trim();
    if (!text) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user", 
      content: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    
    console.log("User asked:", text);
    simulateAIResponse(text);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl h-[600px] flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-full">
                <Bot className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>AI Health Assistant</CardTitle>
                <CardDescription>Get instant help with your medications</CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} data-testid="button-close-chat">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col gap-4">
          {/* Quick Questions */}
          <div className="flex flex-wrap gap-2">
            {commonQuestions.slice(0, 3).map((question, index) => (
              <Badge 
                key={index}
                variant="secondary" 
                className="cursor-pointer hover-elevate"
                onClick={() => handleSendMessage(question)}
                data-testid={`button-quick-question-${index}`}
              >
                {question}
              </Badge>
            ))}
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 pr-4" ref={scrollAreaRef}>
            <div className="space-y-4">
              {messages.map((message) => (
                <div 
                  key={message.id}
                  className={`flex gap-3 ${message.type === "user" ? "justify-end" : "justify-start"}`}
                >
                  {message.type === "assistant" && (
                    <div className="p-2 bg-primary/10 rounded-full h-fit">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  
                  <div className={`max-w-[80%] ${message.type === "user" ? "order-first" : ""}`}>
                    <div
                      className={`p-3 rounded-lg ${
                        message.type === "user"
                          ? "bg-primary text-primary-foreground ml-auto"
                          : "bg-muted"
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 px-1">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>

                  {message.type === "user" && (
                    <div className="p-2 bg-secondary rounded-full h-fit">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              ))}
              
              {isTyping && (
                <div className="flex gap-3">
                  <div className="p-2 bg-primary/10 rounded-full h-fit">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div className="bg-muted p-3 rounded-lg">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about your medications..."
                className="pr-10"
                data-testid="input-chat-message"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1 h-6 w-6"
                data-testid="button-voice-input"
              >
                <Mic className="h-3 w-3" />
              </Button>
            </div>
            <Button 
              onClick={() => handleSendMessage()}
              disabled={!inputValue.trim() || isTyping}
              data-testid="button-send-message"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            This AI assistant provides general information. For emergencies, contact your doctor or call emergency services.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}