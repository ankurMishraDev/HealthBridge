import Faq from "@/components/Faq"
import Content from "@/components/Content"
import Footer from "@/components/Footer"
import HeroSection from "@/components/HeroSection"

interface LandingProps {
  onBeginJourney: () => void
}

export default function Landing({ onBeginJourney }: LandingProps) {
    return (
    <div className="flex min-h-screen flex-col">
      <HeroSection onBeginJourney={onBeginJourney} />
      <Content />
      <Faq />
      <Footer />
    </div>
    )
}