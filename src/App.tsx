import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { HashRouter, Route, Routes, useLocation } from "react-router-dom"
import { lazy, Suspense, useEffect } from "react"
import { BackgroundDecor } from "@/components/BackgroundDecor"
import { Footer } from "@/components/Footer"
import { TopBar } from "@/components/TopBar"
import { TooltipProvider } from "@/components/ui/tooltip"
import SchoolPerformance from "@/pages/SchoolPerformance"
import { FiltersProvider } from "@/providers/FiltersProvider"
import { ThemeProvider } from "@/providers/ThemeProvider"

// Code-split: the Dashboard (and Recharts) load only when visited
const Dashboard = lazy(() => import("@/pages/Dashboard"))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 2, refetchOnWindowFocus: false },
  },
})

const TITLES: Record<string, string> = {
  "/": "School Performance · A-Level Results",
  "/dashboard": "Dashboard · A-Level Results",
}

function AnimatedRoutes() {
  const location = useLocation()
  useEffect(() => {
    document.title = TITLES[location.pathname] ?? "A-Level Results"
    window.scrollTo({ top: 0 })
  }, [location.pathname])

  return (
    <main key={location.pathname} className="mx-auto w-full max-w-[1400px] flex-1 animate-fade px-3 pb-12 sm:px-6">
      <Suspense fallback={null}>
        <Routes location={location}>
          <Route path="/" element={<SchoolPerformance />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="*" element={<SchoolPerformance />} />
        </Routes>
      </Suspense>
    </main>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <FiltersProvider>
          <TooltipProvider delayDuration={150}>
            <HashRouter>
              <div className="flex min-h-screen flex-col">
                <BackgroundDecor />
                <TopBar />
                <AnimatedRoutes />
                <Footer />
              </div>
            </HashRouter>
          </TooltipProvider>
        </FiltersProvider>
      </QueryClientProvider>
    </ThemeProvider>
  )
}
