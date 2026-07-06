import StudioLayout from "@/features/studio/components/StudioLayout";
import WelcomeCard from "@/features/studio/components/WelcomeCard";
import QuickActions from "@/features/studio/components/QuickActions";
import AIDirectorCard from "@/features/studio/components/AIDirectorCard";

import ProductionList from "@/features/productions/components/ProductionList";

export default function StudioPage() {
  return (
    <StudioLayout>

      <WelcomeCard />

      <QuickActions />

      <AIDirectorCard />

      <ProductionList />

    </StudioLayout>
  );
}