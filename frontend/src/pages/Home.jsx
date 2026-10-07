import Seo from '../components/ui/Seo'
import Hero from '../components/home/Hero'
import PainMarquee from '../components/home/PainMarquee'
import Features from '../components/home/Features'
import HowItWorks from '../components/home/HowItWorks'
import ReportShowcase from '../components/home/ReportShowcase'
import Audience from '../components/home/Audience'
import Pricing from '../components/home/Pricing'
import Faq from '../components/home/Faq'
import FinalCta from '../components/home/FinalCta'
import { faqs } from '../data/home'

const jsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'SquadBoard',
    applicationCategory: 'ProductivityApplication',
    operatingSystem: 'Web',
    description: 'Group project task tracker for student teams with contribution reports for supervisors.',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  },
]

export default function Home() {
  return (
    <>
      <Seo
        title="SquadBoard — Group Project Task Tracker for Student Teams"
        description="Split tasks, set deadlines and track who did what. SquadBoard generates fair contribution reports for supervisors. Free for student teams up to 5."
        path="/"
        jsonLd={jsonLd}
      />
      <Hero />
      <PainMarquee />
      <Features />
      <HowItWorks />
      <ReportShowcase />
      <Audience />
      <Pricing />
      <Faq />
      <FinalCta />
    </>
  )
}
