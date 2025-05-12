import React from 'react';
import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';

function AuthLayout() {
  return (
    <div className='flex min-h-screen w-full overflow-hidden'>
      {/* Left sided - Animated Background */}
      <motion.div 
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="hidden lg:flex flex-col items-center justify-center relative bg-black w-1/2 overflow-hidden"
      >
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary/60 to-black z-0 opacity-80"></div>
        
        {/* Animated grid lines */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#232323_1px,transparent_1px),linear-gradient(to_bottom,#232323_1px,transparent_1px)] bg-[size:40px_40px] opacity-20"></div>
        
        {/* Animated circles */}
        <div className="absolute left-1/2 top-1/4 w-60 h-60 bg-primary/30 rounded-full filter blur-3xl opacity-60 animate-pulse"></div>
        <div className="absolute right-1/4 bottom-1/3 w-48 h-48 bg-primary/20 rounded-full filter blur-2xl opacity-50 animate-pulse delay-700"></div>
        
        {/* Animated Shopping Carts - Now with vertical motion */}
        <motion.div
          className="absolute top-0 left-24 text-white/60"
          animate={{ 
            y: ["-100%", "150%"],
            x: [0, -10, 0, 10, 0],
          }}
          transition={{ 
            y: { duration: 15, repeat: Infinity, ease: "linear" },
            x: { duration: 2, repeat: Infinity, ease: "easeInOut" }
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="8" cy="21" r="1"></circle>
            <circle cx="19" cy="21" r="1"></circle>
            <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"></path>
          </svg>
        </motion.div>
        
        {/* Shopping cart with items - Vertical movement */}
        <motion.div
          className="absolute top-0 right-16 flex items-center text-white/80"
          animate={{ 
            y: ["-100%", "150%"],
            x: [0, -5, 0, 5, 0],
          }}
          transition={{ 
            y: { duration: 22, repeat: Infinity, ease: "linear", delay: 2 },
            x: { duration: 2.2, repeat: Infinity, ease: "easeInOut" }
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="8" cy="21" r="1"></circle>
            <circle cx="19" cy="21" r="1"></circle>
            <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"></path>
          </svg>
          <motion.div 
            className="ml-1 mb-4 bg-white/10 w-6 h-6 rounded-full"
            animate={{ y: [0, -2, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
          />
          <motion.div 
            className="ml-1 mb-3 bg-white/20 w-4 h-4 rounded-full"
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 1.3, repeat: Infinity, delay: 0.5 }}
          />
        </motion.div>
        
        {/* Smartphone - Diagonal/arc movement */}
        <motion.div
          className="absolute top-0 left-1/3 text-white/70"
          animate={{ 
            y: ["-100%", "150%"],
            x: [0, 80, 0, -80, 0],
            rotate: [0, 5, 0, -5, 0]
          }}
          transition={{ 
            y: { duration: 16, repeat: Infinity, ease: "linear", delay: 6 },
            x: { duration: 8, repeat: Infinity, ease: "easeInOut" },
            rotate: { duration: 3, repeat: Infinity, ease: "easeInOut" }
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
            <line x1="12" y1="18" x2="12.01" y2="18"></line>
          </svg>
        </motion.div>
        
        {/* Shoe - Curved vertical path */}
        <motion.div
          className="absolute top-0 left-2/3 text-white/80"
          animate={{ 
            y: ["-100%", "150%"],
            x: [0, 40, 60, 40, 0, -40, -60, -40, 0],
            rotate: [0, -10, 0]
          }}
          transition={{ 
            y: { duration: 20, repeat: Infinity, ease: "linear", delay: 4 },
            x: { duration: 10, repeat: Infinity, ease: "easeInOut" },
            rotate: { duration: 2.5, repeat: Infinity, ease: "easeInOut" }
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7.5 15.5C7.9 13.6 6 12 6 12L9.5 9.5L21.5 15C21.5 15 22 16 20.5 16C19 16 15.5 15.5 13 15.5C10.5 15.5 8.85 15.28 8 15.5C6.5 15.9 7.5 15.5 7.5 15.5Z"></path>
            <path d="M4.566 10.698l1.612-3.725c.225-.5.642-.7 1.146-.565 1.42.346 4.764 1.177 7.93 1.97 2.336.582 4.152.975 4.152.975l.612 1.077s-4.896 3.035-9.95.334c-5.054-2.7-5.502-3.024-5.502-3.024v2.958z" fill="currentColor"></path>
          </svg>
        </motion.div>
        
        {/* T-shirt - Zigzag vertical path */}
        <motion.div
          className="absolute top-0 right-1/4 text-white/60"
          animate={{ 
            y: ["-100%", "150%"],
            x: [0, 50, -50, 30, -30, 0],
            rotate: [0, 5, 0, -5, 0]
          }}
          transition={{ 
            y: { duration: 17, repeat: Infinity, ease: "linear", delay: 8 },
            x: { duration: 8.5, repeat: Infinity, ease: "easeInOut" },
            rotate: { duration: 3.5, repeat: Infinity, ease: "easeInOut" }
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-11 w-11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.47a1 1 0 00.99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.84l.58-3.47a2 2 0 00-1.34-2.23z"></path>
          </svg>
        </motion.div>
        
        {/* Headphones - Circular path */}
        <motion.div
          className="absolute top-0 right-2/3 text-white/75"
          animate={{ 
            y: ["-100%", "150%"],
            x: [0, 60, 0, -60, 0],
            rotate: [0, -8, 0, 8, 0]
          }}
          transition={{ 
            y: { duration: 19, repeat: Infinity, ease: "linear", delay: 3 },
            x: { duration: 9.5, repeat: Infinity, ease: "easeInOut" },
            rotate: { duration: 3, repeat: Infinity, ease: "easeInOut" }
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-9 w-9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 18v-6a9 9 0 0 1 18 0v6"></path>
            <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path>
          </svg>
        </motion.div>
        
        {/* Laptop - Vertical with subtle side movement */}
        <motion.div
          className="absolute top-0 left-1/4 text-white/70"
          animate={{ 
            y: ["-100%", "150%"],
            x: [0, 20, 40, 20, 0, -20, -40, -20, 0],
            rotate: [0, 3, 0, -3, 0]
          }}
          transition={{ 
            y: { duration: 21, repeat: Infinity, ease: "linear", delay: 7 },
            x: { duration: 10.5, repeat: Infinity, ease: "easeInOut" },
            rotate: { duration: 2.5, repeat: Infinity, ease: "easeInOut" }
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-11 w-11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
            <line x1="2" y1="20" x2="22" y2="20"></line>
          </svg>
        </motion.div>
        
        {/* Watch - Looping pattern */}
        <motion.div
          className="absolute top-0 right-1/3 text-white/85"
          animate={{ 
            y: ["-100%", "150%"],
            x: [0, -30, -60, -30, 0, 30, 60, 30, 0],
            rotate: [0, 10, 0, -10, 0]
          }}
          transition={{ 
            y: { duration: 18, repeat: Infinity, ease: "linear", delay: 5 },
            x: { duration: 9, repeat: Infinity, ease: "easeInOut" },
            rotate: { duration: 4, repeat: Infinity, ease: "easeInOut" }
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="7"></circle>
            <polyline points="12 9 12 12 13.5 13.5"></polyline>
            <path d="M16.51 17.35l-.35 3.83a2 2 0 0 1-2 1.82H9.83a2 2 0 0 1-2-1.82l-.35-3.83m.01-10.7l.35-3.83A2 2 0 0 1 9.83 1h4.35a2 2 0 0 1 2 1.82l.35 3.83"></path>
          </svg>
        </motion.div>
        
        {/* Content */}
        <motion.div 
          className="max-w-md space-y-8 text-center relative z-10 px-8"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ 
              repeat: Infinity, 
              repeatType: "reverse", 
              duration: 4 
            }}
          >
            <div className="w-24 h-24 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg border border-white/20">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-primary-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="8" cy="21" r="1"></circle>
                <circle cx="19" cy="21" r="1"></circle>
                <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"></path>
              </svg>
            </div>
          </motion.div>
          
          <h1 className='text-5xl font-black tracking-tighter bg-gradient-to-r from-white to-white/70 text-transparent bg-clip-text'>
            Welcome to <br/>
            <span className="bg-gradient-to-r from-primary-foreground via-primary-foreground/90 to-primary-foreground/70 text-transparent bg-clip-text inline-block mt-2">
              IN-N-OUT Store
            </span>
          </h1>
          
          <p className="text-lg text-white/80 leading-relaxed font-light max-w-sm mx-auto">
            Your gateway to premium products with a seamless shopping experience designed for the future.
          </p>
          
          <div className="pt-6">
            <div className="flex justify-center space-x-4">
              {[1, 2, 3].map((i) => (
                <motion.div 
                  key={i}
                  className="w-2 h-2 rounded-full bg-white/70"
                  animate={{ 
                    scale: [1, 1.5, 1],
                    opacity: [0.5, 1, 0.5]
                  }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity,
                    delay: i * 0.3
                  }}
                />
              ))}
            </div>
          </div>
        </motion.div>
        
        {/* Bottom info */}
        <div className="absolute bottom-8 left-0 right-0 text-center text-white/60 text-sm font-light">
          2025 IN-N-OUT Store Premium Experience
        </div>
      </motion.div>

      {/* Right sided - Content */}
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
        className="flex flex-1 items-center justify-center relative overflow-hidden"
      >
        {/* Modern gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-100"></div>
        
        {/* Decorative grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        
        {/* Animated background elements */}
        <div className="absolute top-10 right-10 w-72 h-72 bg-blue-50 rounded-full filter blur-3xl opacity-60 animate-pulse"></div>
        <div className="absolute bottom-10 left-10 w-80 h-80 bg-indigo-50 rounded-full filter blur-3xl opacity-50 animate-pulse delay-1000"></div>
        <motion.div 
          className="absolute top-1/4 right-1/4 w-6 h-6 rounded-full bg-indigo-200 opacity-70"
          animate={{ 
            y: [0, -20, 0],
            scale: [1, 1.2, 1],
            opacity: [0.7, 0.9, 0.7]
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-1/3 left-1/3 w-4 h-4 rounded-full bg-blue-300 opacity-60"
          animate={{ 
            y: [0, 15, 0],
            scale: [1, 1.1, 1],
            opacity: [0.6, 0.8, 0.6]
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
        
        {/* Decorative shapes */}
        <motion.div 
          className="absolute top-20 left-1/4 w-12 h-12 border-2 border-gray-200 rounded-lg opacity-40"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
        <motion.div 
          className="absolute bottom-32 right-1/4 w-16 h-16 border-2 border-gray-200 rounded-full opacity-30"
          animate={{ rotate: -360 }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        />
        
        {/* Content card with glass effect */}
        <div className="w-full max-w-md relative z-10 px-6 py-8 sm:px-10">
          <motion.div
            className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-gray-100 p-8 overflow-hidden"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            {/* Brand indicator at top */}
            <div className="absolute -top-10 -right-10 w-20 h-20 bg-black rounded-full flex items-end justify-start p-2 opacity-10"></div>
            
            {/* Content */}
            <Outlet/>
            
            {/* Security badge */}
            <motion.div 
              className="mt-8 flex items-center justify-center text-xs text-gray-500 gap-1.5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              <span>Secure Authentication</span>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

export default AuthLayout;