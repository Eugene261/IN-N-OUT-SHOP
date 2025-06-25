import { useState, forwardRef } from "react";

// Button component from previous implementation
const buttonVariants = (options) => {
  const { variant = "default", size = "default", glow = false, className = "" } = options || {};
  
  const baseClasses = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden border-0 after:absolute after:inset-0 after:bg-gradient-to-r after:opacity-0 after:transition-opacity after:duration-300 hover:after:opacity-20 active:scale-95";
  
  const variantClasses = {
    default: "bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-lg hover:shadow-blue-500/30 backdrop-blur-sm",
    destructive: "bg-gradient-to-r from-red-600 to-pink-600 text-white shadow-lg hover:shadow-red-500/30",
    outline: "border-2 border-blue-500/30 bg-white/80 text-gray-800 shadow-sm backdrop-blur-md hover:border-blue-500/50 hover:bg-white/50 dark:border-blue-400/30 dark:bg-black/30 dark:text-white dark:hover:border-blue-400/50",
    secondary: "bg-gradient-to-r from-slate-700 to-slate-800 text-white shadow-lg hover:shadow-slate-700/30",
    ghost: "text-gray-800 hover:bg-gray-100/50 hover:text-gray-900 backdrop-blur-sm dark:text-white dark:hover:bg-gray-800/50",
    link: "text-blue-600 underline-offset-4 hover:underline dark:text-blue-400",
    cyber: "bg-black text-green-400 border-2 border-green-400 shadow-lg shadow-green-400/20 hover:bg-green-950",
    neon: "bg-purple-950 text-fuchsia-300 border border-fuchsia-500 shadow-lg shadow-fuchsia-500/30 hover:shadow-fuchsia-500/50"
  };
  
  const sizeClasses = {
    default: "h-10 px-6 py-2",
    sm: "h-8 rounded-md px-4 text-xs",
    lg: "h-12 rounded-md px-8 text-base",
    icon: "h-10 w-10 rounded-full"
  };
  
  const glowClass = glow ? "shadow-lg before:absolute before:inset-0 before:rounded-md before:bg-gradient-to-r before:opacity-0 before:blur-xl hover:before:opacity-70" : "";
  
  let glowColorClass = "";
  if (glow) {
    if (variant === "default") glowColorClass = "before:from-blue-600 before:to-violet-600";
    else if (variant === "destructive") glowColorClass = "before:from-red-600 before:to-pink-600";
    else if (variant === "cyber") glowColorClass = "before:from-green-400 before:to-green-600";
    else if (variant === "neon") glowColorClass = "before:from-fuchsia-500 before:to-purple-500";
  }
  
  return `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${glowClass} ${glowColorClass} ${className}`;
};

const Button = forwardRef(({ children, variant, size, glow, className, ...props }, ref) => {
  return (
    <button 
      ref={ref}
      className={buttonVariants({ variant, size, glow, className })}
      {...props}
    >
      {children}
    </button>
  );
});

Button.displayName = "Button";

function ButtonPreview() {
  const [darkMode, setDarkMode] = useState(false);
  
  return (
    <div className={`p-8 min-h-screen flex flex-col ${darkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"}`}>
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Futuristic Button Preview</h1>
        <button 
          onClick={() => setDarkMode(!darkMode)} 
          className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-700"
        >
          Toggle {darkMode ? "Light" : "Dark"} Mode
        </button>
      </div>
      
      <div className="grid gap-8">
        <section>
          <h2 className="text-xl font-semibold mb-4">Standard Variants</h2>
          <div className="flex flex-wrap gap-4">
            <Button variant="default">Default</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link</Button>
          </div>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-4">Futuristic Variants</h2>
          <div className="flex flex-wrap gap-4">
            <Button variant="cyber">Cyberpunk</Button>
            <Button variant="neon">Neon</Button>
          </div>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-4">With Glow Effect</h2>
          <div className="flex flex-wrap gap-4">
            <Button variant="default" glow={true}>Default Glow</Button>
            <Button variant="destructive" glow={true}>Destructive Glow</Button>
            <Button variant="cyber" glow={true}>Cyber Glow</Button>
            <Button variant="neon" glow={true}>Neon Glow</Button>
          </div>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-4">Different Sizes</h2>
          <div className="flex flex-wrap gap-4 items-center">
            <Button variant="default" size="sm">Small</Button>
            <Button variant="default">Default</Button>
            <Button variant="default" size="lg">Large</Button>
          </div>
        </section>
      </div>
    </div>
  );
}

export default ButtonPreview;
export { Button, buttonVariants };