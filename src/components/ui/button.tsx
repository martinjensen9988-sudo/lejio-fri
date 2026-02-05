import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Primary - Electric Blue with glow
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/40 hover:-translate-y-0.5",
        
        // Destructive
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-lg shadow-destructive/20",
        
        // Outline - Glass effect
        outline: "border border-border bg-transparent hover:bg-muted/50 hover:border-primary/40 backdrop-blur-sm",
        
        // Secondary - Steel/Dark
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-lg",
        
        // Ghost
        ghost: "hover:bg-muted/50 hover:text-foreground",
        
        // Link
        link: "text-primary underline-offset-4 hover:underline",
        
        // Hero CTA - Gradient with metallic shine
        hero: "relative overflow-hidden bg-gradient-to-r from-primary via-primary to-primary/80 text-primary-foreground font-bold shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/50 hover:-translate-y-1 metallic-shine",
        
        // Accent - Copper/Bronze metallic
        warm: "bg-accent text-accent-foreground font-bold hover:bg-accent/90 shadow-lg shadow-accent/30 hover:shadow-xl hover:shadow-accent/40 hover:-translate-y-0.5",
        
        // Mint/Cyan - Futuristic success
        mint: "bg-mint text-mint-foreground font-bold hover:bg-mint/90 shadow-lg shadow-mint/30 hover:shadow-xl hover:shadow-mint/40 hover:-translate-y-0.5",
        
        // Lavender
        lavender: "bg-lavender text-lavender-foreground font-bold hover:bg-lavender/90 shadow-lg shadow-lavender/30",
        
        // Glass - Glassmorphism
        glass: "bg-card/60 border border-border/50 text-foreground hover:bg-card/80 hover:border-primary/30 backdrop-blur-xl",
        
        // Premium - Gradient border glow
        premium: "relative bg-card border border-border text-foreground hover:border-primary/50 glow-border hover:-translate-y-0.5",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-9 rounded-lg px-4 text-sm",
        lg: "h-12 rounded-xl px-8 text-base",
        xl: "h-14 rounded-2xl px-10 text-lg font-bold",
        icon: "h-10 w-10 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  variant?: string;
  size?: string;
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
