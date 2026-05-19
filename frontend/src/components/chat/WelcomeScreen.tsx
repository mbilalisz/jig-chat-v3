import React from "react";
import { MessageCircle } from "lucide-react";

export const WelcomeScreen: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-white">
      <div className="flex flex-col items-center text-center max-w-sm">
        <div className="relative mb-8">
          <div className="w-24 h-24 bg-primary rounded-3xl rotate-12 flex items-center justify-center shadow-xl shadow-orange-100">
            <MessageCircle
              size={48}
              className="text-white -rotate-12"
              fill="white"
            />
          </div>
          <div className="absolute -bottom-2 -right-4 w-16 h-16 bg-primary-light rounded-2xl -rotate-12 flex items-center justify-center">
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"></div>
              <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce delay-75"></div>
              <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce delay-150"></div>
            </div>
          </div>
        </div>

        <h2 className="text-xl font-bold text-slate-800 mb-2">
          No conversation selected
        </h2>
        <p className="text-slate-400 text-sm leading-relaxed">
          You can view your conversation in the side bar
        </p>
      </div>
    </div>
  );
};
