import PriceHeader from "@/components/PriceHeader";
import PriceChart from "@/components/PriceChart";
import ModelComparison from "@/components/ModelComparison";
import FuturePredictions from "@/components/FuturePredictions";
import VolumeChart from "@/components/VolumeChart";
import MethodologySection from "@/components/MethodologySection";

const Index = () => {
  return (
    <div className="min-h-screen bg-background bg-grid">
      <PriceHeader />
      <main className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6">
        {/* Main chart + sidebar */}
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <PriceChart />
          </div>
          <div className="space-y-5">
            <FuturePredictions />
          </div>
        </div>

        {/* Model comparison + volume */}
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ModelComparison />
          </div>
          <VolumeChart />
        </div>

        {/* Methodology */}
        <MethodologySection />

        {/* Footer */}
        <footer className="border-t border-border py-4 text-center text-xs text-muted-foreground">
          AI-Based Bitcoin Price Prediction — Machine Learning Course Project
        </footer>
      </main>
    </div>
  );
};

export default Index;
