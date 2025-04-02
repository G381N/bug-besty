export default function EnumerationSpinner() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background z-50">
      <div className="relative flex flex-col items-center">
        {/* Main scanning circle */}
        <div className="relative w-48 h-48">
          {/* Scanning line animation */}
          <div className="absolute inset-0 overflow-hidden rounded-full">
            <div className="h-full w-full bg-gradient-to-b from-primary/0 via-primary to-primary/0 animate-scanning"></div>
          </div>

          {/* Outer ring with rotating segments */}
          <div className="absolute inset-0 border-4 border-primary rounded-full">
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-[spin_3s_linear_infinite]"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-l-primary animate-[spin_2s_linear_infinite]"></div>
          </div>

          {/* Radar sweep effect */}
          <div className="absolute inset-0 origin-center">
            <div className="h-full w-1/2 origin-right bg-gradient-to-r from-primary/40 to-transparent animate-radar"></div>
          </div>

          {/* Center dot with pulse */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              <div className="w-4 h-4 bg-primary rounded-full"></div>
              <div className="absolute inset-0 bg-primary rounded-full animate-ping"></div>
            </div>
          </div>

          {/* Orbiting dots */}
          <div className="absolute inset-0 animate-[spin_4s_linear_infinite]">
            <div className="absolute top-0 left-1/2 w-3 h-3 -ml-1.5 bg-primary rounded-full"></div>
          </div>
          <div className="absolute inset-0 animate-[spin_6s_linear_infinite]">
            <div className="absolute top-0 left-1/2 w-2 h-2 -ml-1 bg-accent rounded-full"></div>
          </div>
        </div>

        {/* Text content */}
        <div className="mt-8 text-center">
          <h3 className="text-xl font-medium text-primary mb-2">
            Scanning Target Domain
          </h3>
          <div className="flex items-center justify-center space-x-2 text-foreground/70">
            <span className="w-2 h-2 bg-primary rounded-full animate-[ping_1s_infinite]"></span>
            <span className="w-2 h-2 bg-primary rounded-full animate-[ping_1s_infinite_0.2s]"></span>
            <span className="w-2 h-2 bg-primary rounded-full animate-[ping_1s_infinite_0.4s]"></span>
          </div>
        </div>
      </div>
    </div>
  );
} 