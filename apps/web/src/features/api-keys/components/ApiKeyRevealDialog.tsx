import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Alert,
  AlertDescription,
} from "@/components/ui";
import { Copy, Check, AlertTriangle } from "lucide-react";

interface ApiKeyRevealDialogProps {
  apiKeyName: string;
  fullKey: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ApiKeyRevealDialog({
  apiKeyName,
  fullKey,
  open,
  onOpenChange,
}: ApiKeyRevealDialogProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>API Key Created Successfully</DialogTitle>
          <DialogDescription>
            Save your API key now. You will not be able to see it again.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="ml-2">
              Make sure to copy your API key now. You will not be able to see it
              again!
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <label className="text-sm font-medium">API Key Name</label>
            <div className="p-3 bg-muted rounded-md">
              <p className="font-mono text-sm">{apiKeyName}</p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">API Key</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 p-3 bg-muted rounded-md">
                <p className="font-mono text-sm break-all">{fullKey}</p>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopy}
                className="shrink-0"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <Alert>
            <AlertDescription>
              Store this key securely. Anyone with this key can access your API
              with the permissions you have granted.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            I have saved my API key
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
