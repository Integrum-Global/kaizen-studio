import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import {
  HelpCircle,
  BookOpen,
  MessageCircle,
  Keyboard,
  ExternalLink,
  Lightbulb,
  Video,
} from "lucide-react";

interface HelpLink {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  external?: boolean;
}

interface HelpButtonProps {
  className?: string;
  variant?: "floating" | "inline";
}

const helpLinks: HelpLink[] = [
  {
    title: "Documentation",
    description: "Complete guides and API reference",
    href: "/docs",
    icon: <BookOpen className="h-4 w-4" />,
  },
  {
    title: "Quick Start Guide",
    description: "Get started in 5 minutes",
    href: "/docs/quick-start",
    icon: <Lightbulb className="h-4 w-4" />,
  },
  {
    title: "Video Tutorials",
    description: "Learn by watching step-by-step videos",
    href: "/docs/tutorials",
    icon: <Video className="h-4 w-4" />,
  },
  {
    title: "Keyboard Shortcuts",
    description: "Work faster with keyboard shortcuts",
    href: "/docs/shortcuts",
    icon: <Keyboard className="h-4 w-4" />,
  },
  {
    title: "Contact Support",
    description: "Get help from our team",
    href: "mailto:support@kaizen.ai",
    icon: <MessageCircle className="h-4 w-4" />,
    external: true,
  },
  {
    title: "Community Forum",
    description: "Ask questions and share knowledge",
    href: "https://community.kaizen.ai",
    icon: <MessageCircle className="h-4 w-4" />,
    external: true,
  },
];

export function HelpButton({
  className,
  variant = "floating",
}: HelpButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const buttonClasses =
    variant === "floating"
      ? "fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
      : className;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant={variant === "floating" ? "default" : "outline"}
          size={variant === "floating" ? "icon" : "default"}
          className={buttonClasses}
        >
          <HelpCircle className="h-5 w-5" />
          {variant === "inline" && <span className="ml-2">Help</span>}
          <span className="sr-only">Open help panel</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Help & Resources</SheetTitle>
          <SheetDescription>
            Find answers, learn new features, and get support
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Quick Links */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Quick Links</h3>
            <div className="space-y-2">
              {helpLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target={link.external ? "_blank" : undefined}
                  rel={link.external ? "noopener noreferrer" : undefined}
                  className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent transition-colors group"
                >
                  <div className="mt-0.5 text-muted-foreground group-hover:text-foreground transition-colors">
                    {link.icon}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{link.title}</span>
                      {link.external && (
                        <ExternalLink className="h-3 w-3 text-muted-foreground" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {link.description}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </div>

          <Separator />

          {/* Additional Help */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Need More Help?</h3>
            <p className="text-sm text-muted-foreground">
              Our support team is available Monday-Friday, 9am-5pm EST. Average
              response time is under 2 hours.
            </p>
            <Button className="w-full" asChild>
              <a href="mailto:support@kaizen.ai">
                <MessageCircle className="h-4 w-4 mr-2" />
                Contact Support
              </a>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
