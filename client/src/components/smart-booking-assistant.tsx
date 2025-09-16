import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  MessageCircle, 
  Bot, 
  Send, 
  MapPin, 
  Calendar, 
  Users, 
  Star,
  Clock,
  TrendingUp,
  Heart
} from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import type { ActivityType } from "@shared/schema";

interface SmartBookingAssistantProps {
  activities: ActivityType[];
  onRecommendActivity: (activity: ActivityType) => void;
  onQuickBook: (activity: ActivityType, date: string, people: number) => void;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestions?: string[];
}

export default function SmartBookingAssistant({ 
  activities, 
  onRecommendActivity, 
  onQuickBook 
}: SmartBookingAssistantProps) {
  const { t } = useLanguage();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'assistant',
      content: "🏜️ Welcome to MarrakechDunes! I'm your personal booking assistant. I can help you find the perfect Moroccan adventure based on your preferences. What type of experience are you looking for?",
      timestamp: new Date(),
      suggestions: [
        "Desert adventures",
        "Cultural tours", 
        "Atlas Mountains",
        "City experiences",
        "Show me all activities"
      ]
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: message,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsTyping(true);

    // Simulate AI processing
    setTimeout(() => {
      const response = generateAIResponse(message);
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response.content,
        timestamp: new Date(),
        suggestions: response.suggestions
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const generateAIResponse = (userMessage: string) => {
    const message = userMessage.toLowerCase();
    
    // Desert adventures
    if (message.includes('desert') || message.includes('sahara') || message.includes('camel')) {
      const desertActivities = activities.filter(a => 
        a.name.toLowerCase().includes('desert') || 
        a.name.toLowerCase().includes('sahara') ||
        a.category.toLowerCase().includes('desert')
      );
      
      if (desertActivities.length > 0) {
        return {
          content: `🐪 Perfect! I found ${desertActivities.length} amazing desert adventures for you:\n\n${desertActivities.map(a => `• ${a.name} - ${a.price} MAD (${a.duration})`).join('\n')}\n\nWhich one interests you most?`,
          suggestions: desertActivities.map(a => `Tell me about ${a.name}`)
        };
      }
    }

    // Cultural tours
    if (message.includes('cultural') || message.includes('culture') || message.includes('traditional')) {
      const culturalActivities = activities.filter(a => 
        a.category.toLowerCase().includes('cultural') ||
        a.name.toLowerCase().includes('medina') ||
        a.name.toLowerCase().includes('traditional')
      );
      
      return {
        content: `🏛️ Great choice! Here are our cultural experiences:\n\n${culturalActivities.map(a => `• ${a.name} - ${a.price} MAD`).join('\n')}\n\nThese tours will immerse you in authentic Moroccan culture!`,
        suggestions: culturalActivities.map(a => `Book ${a.name}`)
      };
    }

    // Atlas Mountains
    if (message.includes('atlas') || message.includes('mountain') || message.includes('hiking')) {
      const mountainActivities = activities.filter(a => 
        a.name.toLowerCase().includes('atlas') ||
        a.name.toLowerCase().includes('mountain') ||
        a.name.toLowerCase().includes('hiking')
      );
      
      return {
        content: `⛰️ The Atlas Mountains offer incredible adventures!\n\n${mountainActivities.map(a => `• ${a.name} - ${a.price} MAD`).join('\n')}\n\nPerfect for nature lovers and adventure seekers!`,
        suggestions: mountainActivities.map(a => `More details about ${a.name}`)
      };
    }

    // Budget queries
    if (message.includes('budget') || message.includes('cheap') || message.includes('affordable')) {
      const budgetActivities = activities
        .sort((a, b) => parseInt(a.price) - parseInt(b.price))
        .slice(0, 3);
      
      return {
        content: `💰 Here are our most affordable adventures:\n\n${budgetActivities.map(a => `• ${a.name} - ${a.price} MAD (${a.duration})`).join('\n')}\n\nGreat value for authentic Moroccan experiences!`,
        suggestions: budgetActivities.map(a => `Book ${a.name}`)
      };
    }

    // Group bookings
    if (message.includes('group') || message.includes('family') || message.includes('friends')) {
      return {
        content: `👥 Perfect! We love group bookings and offer special rates for groups of 4+ people. What size group are you planning for? I can recommend activities that work great for groups and show you our group discounts!`,
        suggestions: ["4-6 people", "7-10 people", "10+ people", "Show group discounts"]
      };
    }

    // Default response
    return {
      content: `🤔 I'd love to help you find the perfect adventure! Could you tell me more about:\n\n• What type of experience interests you?\n• How many people are in your group?\n• What's your preferred budget range?\n• Any specific locations you want to visit?`,
      suggestions: [
        "Show me all activities",
        "What's popular?",
        "Group discounts",
        "Budget options"
      ]
    };
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputMessage(suggestion);
    handleSendMessage(suggestion);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="bg-moroccan-blue text-white">
        <CardTitle className="flex items-center gap-2">
          <Bot className="w-5 h-5" />
          Smart Booking Assistant
          <Badge variant="secondary" className="bg-moroccan-gold text-white">
            AI Powered
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-0">
        {/* Chat Messages */}
        <div className="h-96 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-3 rounded-lg ${
                message.type === 'user' 
                  ? 'bg-moroccan-blue text-white' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                <div className="flex items-start gap-2">
                  {message.type === 'assistant' && <Bot className="w-4 h-4 mt-1 flex-shrink-0" />}
                  <div>
                    <p className="whitespace-pre-line">{message.content}</p>
                    {message.suggestions && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {message.suggestions.map((suggestion, index) => (
                          <Button
                            key={index}
                            size="sm"
                            variant="outline"
                            className="text-xs"
                            onClick={() => handleSuggestionClick(suggestion)}
                          >
                            {suggestion}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-100 p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4" />
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t p-4">
          <div className="flex gap-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask me about activities, prices, or recommendations..."
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(inputMessage)}
              className="flex-1"
            />
            <Button 
              onClick={() => handleSendMessage(inputMessage)}
              disabled={!inputMessage.trim() || isTyping}
              className="bg-moroccan-blue hover:bg-blue-700"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="mt-2 flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => handleSendMessage("Show me popular activities")}>
              <TrendingUp className="w-3 h-3 mr-1" />
              Popular
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleSendMessage("What's good for families?")}>
              <Users className="w-3 h-3 mr-1" />
              Family
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleSendMessage("Show budget options")}>
              💰 Budget
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleSendMessage("I need help choosing")}>
              <Heart className="w-3 h-3 mr-1" />
              Help Me Choose
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
