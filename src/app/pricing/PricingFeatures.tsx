import { ScrollReveal } from '@/components/landing/ScrollReveal';
import { FeatureIcon } from './PricingIcons';

interface PricingFeaturesProps {
  features: { icon: string; title: string; desc: string }[];
}

export function PricingFeatures({ features }: PricingFeaturesProps) {
  return (
    <section className="px-4 sm:px-6 pb-32">
      <div className="max-w-5xl mx-auto">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, i) => (
            <ScrollReveal key={feature.title} direction="up" delay={i * 80}>
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-center h-full">
                <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center mx-auto mb-4 text-indigo-400">
                  <FeatureIcon type={feature.icon} />
                </div>
                <h3 className="text-base font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{feature.desc}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
