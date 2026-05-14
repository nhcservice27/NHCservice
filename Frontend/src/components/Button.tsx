import { Button as ShadcnButton } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-medium transition-smooth disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-foreground text-background shadow-soft hover:opacity-90",
        wellness: "bg-wellness-green text-white shadow-soft hover:bg-wellness-green/90",
        hero: "bg-foreground text-background shadow-premium hover:scale-105 hover:bg-foreground/90 transition-premium px-10 py-5 text-lg",
        secondary: "bg-secondary text-secondary-foreground shadow-soft hover:bg-secondary/80",
        outline: "border-2 border-foreground/10 text-foreground bg-white hover:bg-foreground hover:text-background shadow-soft",
        ghost: "hover:bg-primary/20 text-foreground",
        cta: "bg-primary text-primary-foreground shadow-premium hover:scale-105 hover:bg-primary/90 transition-premium px-12 py-6 text-xl",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-full px-3",
        lg: "h-12 rounded-full px-8",
        xl: "h-16 rounded-full px-12 text-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps extends VariantProps<typeof buttonVariants> {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}

export function Button({ 
  variant, 
  size, 
  className, 
  children, 
  ...props 
}: ButtonProps) {
  return (
    <ShadcnButton
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {children}
    </ShadcnButton>
  );
}