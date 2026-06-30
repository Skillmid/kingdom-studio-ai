import StudioLayout from "@/features/studio/components/StudioLayout";
import WelcomeCard from "@/features/studio/components/WelcomeCard";
import QuickActions from "@/features/studio/components/QuickActions";
import RecentProductions from "@/features/studio/components/RecentProductions";
import AIDirectorCard from "@/features/studio/components/AIDirectorCard";

export default function StudioPage() {
  return (
    <StudioLayout>

      <WelcomeCard />

      <QuickActions />

      <AIDirectorCard />

      <RecentProductions />

    </StudioLayout>
  );
}