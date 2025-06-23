import { getTranslations } from "next-intl/server"

export default async function LoadingPage() {
  const t = await getTranslations()

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-background via-background/95 to-muted/20">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, hsl(var(--primary)) 0%, transparent 50%), 
                           radial-gradient(circle at 75% 75%, hsl(var(--primary)) 0%, transparent 50%)`,
          }}
        />
      </div>

      {/* Main Loading Container */}
      <div className="relative flex flex-col items-center justify-center p-8 rounded-2xl bg-card/80 backdrop-blur-sm border shadow-2xl max-w-md w-full mx-4">
        {/* Animated Logo/Icon */}
        <div className="relative mb-8">
          {/* Outer Ring */}
          <div
            className="absolute inset-0 w-20 h-20 rounded-full border-4 border-primary/20 animate-spin"
            style={{ animationDuration: "3s" }}
          />

          {/* Inner Ring */}
          <div
            className="absolute inset-2 w-16 h-16 rounded-full border-4 border-primary/40 animate-spin"
            style={{ animationDuration: "2s", animationDirection: "reverse" }}
          />

          {/* Center Icon */}
          <div className="relative w-20 h-20 flex items-center justify-center">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center animate-pulse">
              <svg className="w-5 h-5 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Loading Text */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-2 animate-fade-in">{t("Loading.Loading")}</h2>
          <p className="text-muted-foreground animate-fade-in-delay">Preparing your shopping experience...</p>
        </div>

        {/* Progress Bar */}
        <div className="w-full mb-6">
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full animate-loading-bar" />
          </div>
        </div>

        {/* Loading Steps */}
        <div className="flex flex-col space-y-2 text-sm text-muted-foreground w-full">
          <div className="flex items-center space-x-3 animate-step-1">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            <span>Loading products...</span>
          </div>
          <div className="flex items-center space-x-3 animate-step-2">
            <div className="w-2 h-2 bg-primary/60 rounded-full animate-pulse" style={{ animationDelay: "0.5s" }} />
            <span>Setting up cart...</span>
          </div>
          <div className="flex items-center space-x-3 animate-step-3">
            <div className="w-2 h-2 bg-primary/40 rounded-full animate-pulse" style={{ animationDelay: "1s" }} />
            <span>Finalizing...</span>
          </div>
        </div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary/30 rounded-full animate-float-1" />
      <div className="absolute top-1/3 right-1/4 w-3 h-3 bg-primary/20 rounded-full animate-float-2" />
      <div className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 bg-primary/25 rounded-full animate-float-3" />
    </div>
  )
}
