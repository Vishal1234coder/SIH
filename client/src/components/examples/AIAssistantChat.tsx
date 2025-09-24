import { useState } from "react";
import { Button } from "@/components/ui/button";
import AIAssistantChat from '../AIAssistantChat';

export default function AIAssistantChatExample() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="p-4">
      <Button onClick={() => setIsOpen(true)}>
        Open AI Assistant
      </Button>
      <AIAssistantChat 
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        patientName="John Smith"
      />
    </div>
  );
}