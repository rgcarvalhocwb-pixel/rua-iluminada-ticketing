import React from 'react';
import { cn } from '@/lib/utils';

// Base Animation Component
interface AnimationProps {
  children: React.ReactNode;
  animation?: 'fade-in' | 'scale-in' | 'slide-in-right' | 'slide-in-left' | 'slide-in-up' | 'enter';
  delay?: number;
  duration?: number;
  className?: string;
  trigger?: boolean;
}

export const AnimatedElement: React.FC<AnimationProps> = ({
  children,
  animation = 'fade-in',
  delay = 0,
  duration = 300,
  className,
  trigger = true
}) => {
  const baseClasses = "transition-all ease-out";
  const animationClass = trigger ? `animate-${animation}` : '';
  
  return (
    <div 
      className={cn(baseClasses, animationClass, className)}
      style={{
        animationDelay: `${delay}ms`,
        animationDuration: `${duration}ms`
      }}
    >
      {children}
    </div>
  );
};

// Staggered Animation Container
interface StaggeredAnimationProps {
  children: React.ReactNode[];
  animation?: 'fade-in' | 'scale-in' | 'slide-in-up';
  staggerDelay?: number;
  className?: string;
}

export const StaggeredAnimation: React.FC<StaggeredAnimationProps> = ({
  children,
  animation = 'fade-in',
  staggerDelay = 100,
  className
}) => {
  return (
    <div className={className}>
      {React.Children.map(children, (child, index) => (
        <AnimatedElement
          key={index}
          animation={animation}
          delay={index * staggerDelay}
        >
          {child}
        </AnimatedElement>
      ))}
    </div>
  );
};

// Page Transition Component
interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  className
}) => {
  return (
    <div className={cn("animate-fade-in", className)}>
      {children}
    </div>
  );
};

// Loading Animation Component
interface LoadingAnimationProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingAnimation: React.FC<LoadingAnimationProps> = ({
  size = 'md',
  className
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div className={cn(
        "animate-spin rounded-full border-2 border-primary border-t-transparent",
        sizeClasses[size]
      )} />
    </div>
  );
};

// Interactive Button with Animations
interface AnimatedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'default' | 'hover-scale' | 'hover-lift' | 'hover-glow';
  className?: string;
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  children,
  variant = 'default',
  className,
  ...props
}) => {
  const variantClasses = {
    default: 'transition-all duration-200',
    'hover-scale': 'transition-transform duration-200 hover:scale-105 active:scale-95',
    'hover-lift': 'transition-all duration-200 hover:-translate-y-1 hover:shadow-lg',
    'hover-glow': 'transition-all duration-200 hover:shadow-lg hover:shadow-primary/25'
  };

  return (
    <button
      className={cn(variantClasses[variant], className)}
      {...props}
    >
      {children}
    </button>
  );
};

// Card with Hover Animation
interface AnimatedCardProps {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: 'lift' | 'scale' | 'glow' | 'none';
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  className,
  hoverEffect = 'lift'
}) => {
  const hoverClasses = {
    lift: 'hover:-translate-y-2 hover:shadow-xl',
    scale: 'hover:scale-105',
    glow: 'hover:shadow-xl hover:shadow-primary/10',
    none: ''
  };

  return (
    <div className={cn(
      "transition-all duration-300 ease-out",
      hoverClasses[hoverEffect],
      className
    )}>
      {children}
    </div>
  );
};

// Text Animation Component
interface AnimatedTextProps {
  children: string;
  animation?: 'typewriter' | 'fade-in-words' | 'slide-in-chars';
  className?: string;
  delay?: number;
}

export const AnimatedText: React.FC<AnimatedTextProps> = ({
  children,
  animation = 'fade-in-words',
  className,
  delay = 100
}) => {
  if (animation === 'fade-in-words') {
    const words = children.split(' ');
    return (
      <span className={className}>
        {words.map((word, index) => (
          <span
            key={index}
            className="inline-block animate-fade-in opacity-0"
            style={{
              animationDelay: `${index * delay}ms`,
              animationFillMode: 'forwards'
            }}
          >
            {word}{index < words.length - 1 ? '\u00A0' : ''}
          </span>
        ))}
      </span>
    );
  }

  return <span className={cn("animate-fade-in", className)}>{children}</span>;
};

// Progress Animation Component
interface AnimatedProgressProps {
  value: number;
  max?: number;
  className?: string;
  showValue?: boolean;
}

export const AnimatedProgress: React.FC<AnimatedProgressProps> = ({
  value,
  max = 100,
  className,
  showValue = false
}) => {
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <div className={cn("relative", className)}>
      <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
        <div 
          className="h-full bg-primary transition-all duration-1000 ease-out rounded-full"
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showValue && (
        <span className="absolute right-0 top-3 text-xs text-muted-foreground">
          {Math.round(percentage)}%
        </span>
      )}
    </div>
  );
};

// Floating Action Button
interface FloatingActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  className?: string;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  children,
  position = 'bottom-right',
  className,
  ...props
}) => {
  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6'
  };

  return (
    <button
      className={cn(
        "fixed z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg",
        "transition-all duration-200 hover:scale-110 hover:shadow-xl",
        "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
        positionClasses[position],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};