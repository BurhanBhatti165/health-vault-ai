import { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Send, Bot, User, Loader2, Sparkles } from "lucide-react";
import { chatAPI } from "@/api/chat";

const ChatBot = () => {
  const { user } = useSelector((state) => state.auth);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadChatHistory();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadChatHistory = async () => {
    try {
      setLoadingMessages(true);
      const response = await chatAPI.getChatMessages();
      if (response.success) {
        setMessages(response.data.messages);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
      toast.error('Failed to load chat history');
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || loading) return;

    const messageText = inputMessage.trim();
    setInputMessage("");
    setLoading(true);

    try {
      const response = await chatAPI.sendMessage({ message: messageText });
      
      if (response.success) {
        setMessages(prev => [
          ...prev,
          response.data.userMessage,
          response.data.aiMessage
        ]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      setInputMessage(messageText); // Restore message on error
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = (message) => {
    const isUser = message.sender === 'user';
    
    return (
      <div
        key={message._id}
        className={`flex gap-3 mb-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
      >
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser ? 'bg-primary' : 'bg-purple-500'
        }`}>
          {isUser ? (
            <User className="w-5 h-5 text-white" />
          ) : (
            <Bot className="w-5 h-5 text-white" />
          )}
        </div>
        
        <div className={`flex-1 ${isUser ? 'text-right' : 'text-left'}`}>
          <div className={`inline-block max-w-[80%] p-3 rounded-lg ${
            isUser
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-foreground'
          }`}>
            <p className="text-sm whitespace-pre-wrap">{message.message}</p>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {new Date(message.createdAt).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </p>
        </div>
      </div>
    );
  };

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="border-b">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <CardTitle>HealthVault AI Assistant</CardTitle>
            <CardDescription>
              Ask me about your appointments or general health questions
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        <ScrollArea className="flex-1 p-4">
          {loadingMessages ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Welcome to HealthVault AI!</h3>
              <p className="text-muted-foreground max-w-md">
                I'm your personal health assistant. Ask me to:
              </p>
              <ul className="text-sm text-muted-foreground mt-3 space-y-1 text-left">
                <li>• Summarize your previous appointments</li>
                <li>• Answer general health questions</li>
                <li>• Explain medical terms or documents</li>
                <li>• Provide health tips and recommendations</li>
              </ul>
            </div>
          ) : (
            <div>
              {messages.map(renderMessage)}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        <Separator />

        <form onSubmit={handleSendMessage} className="p-4">
          <div className="flex gap-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask me anything about your health or appointments..."
              disabled={loading}
              className="flex-1"
            />
            <Button 
              type="submit" 
              disabled={loading || !inputMessage.trim()}
              size="icon"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            I have access to your appointment history and can answer general health questions.
          </p>
        </form>
      </CardContent>
    </Card>
  );
};

export default ChatBot;
