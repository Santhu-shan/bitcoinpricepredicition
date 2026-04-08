import { NavLink } from "react-router-dom";
import { Bitcoin, History, BrainCircuit, BookOpen, Menu, X, FileSpreadsheet, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const links = [
  { to: "/", label: "History", icon: History, desc: "Price Data" },
  { to: "/predictions", label: "Predictions", icon: BrainCircuit, desc: "ML Models" },
  { to: "/insights", label: "Insights", icon: Globe, desc: "Macro & News" },
  { to: "/upload", label: "CSV Upload", icon: FileSpreadsheet, desc: "Data Mining" },
  { to: "/methodology", label: "How It Works", icon: BookOpen, desc: "Documentation" },
];

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border glass">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <NavLink to="/" className="flex items-center gap-3 group">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 glow-gold group-hover:glow-gold-strong transition-all">
            <Bitcoin className="h-5 w-5 text-primary" />
            <div className="absolute inset-0 rounded-xl bg-primary/5 animate-pulse" />
          </div>
          <div>
            <h1 className="font-display text-sm font-bold tracking-tight sm:text-base">
              <span className="text-gradient-gold">BTC</span>{" "}
              <span className="text-foreground">Forecaster</span>
            </h1>
            <p className="hidden text-[10px] text-muted-foreground sm:block tracking-widest uppercase">
              AI-Powered Predictions
            </p>
          </div>
        </NavLink>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 sm:flex">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary/10 text-primary glow-gold"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )
              }
            >
              <link.icon className="h-4 w-4" />
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground sm:hidden"
        >
          {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {/* Mobile nav */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-border sm:hidden"
          >
            <div className="px-4 py-3 space-y-1">
              {links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === "/"}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )
                  }
                >
                  <link.icon className="h-4 w-4" />
                  <div>
                    <span className="block">{link.label}</span>
                    <span className="text-[10px] text-muted-foreground">{link.desc}</span>
                  </div>
                </NavLink>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;
