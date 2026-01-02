# UI Components

All UI components are based on Shadcn/ui and located in `src/components/ui/`.

## Button

```tsx
import { Button } from '@/components/ui/button';

// Variants
<Button variant="default">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
<Button size="icon"><Icon /></Button>

// Loading state
<Button disabled>
  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
  Loading
</Button>

// As child (for links)
<Button asChild>
  <Link to="/dashboard">Dashboard</Link>
</Button>
```

## Input

```tsx
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

<div className="space-y-2">
  <Label htmlFor="email">Email</Label>
  <Input
    id="email"
    type="email"
    placeholder="you@example.com"
  />
</div>

// With error state
<Input className="border-destructive" />
```

## Card

```tsx
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';

<Card>
  <CardHeader>
    <CardTitle>Agent Settings</CardTitle>
    <CardDescription>Configure your agent parameters.</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
  <CardFooter>
    <Button>Save Changes</Button>
  </CardFooter>
</Card>
```

## Dialog

```tsx
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

<Dialog>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Confirm Action</DialogTitle>
      <DialogDescription>
        This action cannot be undone.
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button variant="outline">Cancel</Button>
      <Button>Continue</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

## Select

```tsx
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';

<Select>
  <SelectTrigger className="w-[200px]">
    <SelectValue placeholder="Select provider" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="openai">OpenAI</SelectItem>
    <SelectItem value="anthropic">Anthropic</SelectItem>
    <SelectItem value="google">Google</SelectItem>
  </SelectContent>
</Select>
```

## Toast

```tsx
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';

// Add Toaster to app root
function App() {
  return (
    <>
      {/* ... */}
      <Toaster />
    </>
  );
}

// Use in components
function MyComponent() {
  const { toast } = useToast();

  const handleClick = () => {
    toast({
      title: 'Success',
      description: 'Agent created successfully.',
    });
  };

  // Destructive toast
  toast({
    variant: 'destructive',
    title: 'Error',
    description: 'Failed to create agent.',
  });
}
```

## Badge

```tsx
import { Badge } from '@/components/ui/badge';

<Badge>Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="destructive">Error</Badge>
<Badge variant="outline">Outline</Badge>
```

## Avatar

```tsx
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

<Avatar>
  <AvatarImage src="/avatar.jpg" alt="User" />
  <AvatarFallback>JD</AvatarFallback>
</Avatar>
```

## Sheet (Mobile Sidebar)

```tsx
import {
  Sheet,
  SheetTrigger,
  SheetContent,
} from '@/components/ui/sheet';

<Sheet>
  <SheetTrigger asChild>
    <Button variant="ghost" size="icon">
      <Menu />
    </Button>
  </SheetTrigger>
  <SheetContent side="left">
    {/* Sidebar content */}
  </SheetContent>
</Sheet>
```

## Skeleton

```tsx
import { Skeleton } from '@/components/ui/skeleton';

// Loading card
<Card>
  <CardHeader>
    <Skeleton className="h-4 w-[250px]" />
    <Skeleton className="h-4 w-[200px]" />
  </CardHeader>
  <CardContent>
    <Skeleton className="h-[125px] w-full" />
  </CardContent>
</Card>
```
