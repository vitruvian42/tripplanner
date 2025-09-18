import { Bot, Lightbulb, Share2, Wallet } from 'lucide-react';

export function LandingFeatures() {
  const features = [
    {
      icon: <Lightbulb className="w-8 h-8 text-primary" />,
      title: 'AI Itinerary Planner',
      description: 'Get a complete, personalized itinerary in minutes. Our AI handles the details so you can focus on the fun.',
    },
    {
      icon: <Share2 className="w-8 h-8 text-primary" />,
      title: 'Collaborate Seamlessly',
      description: 'Plan trips with friends and family. Decide on activities together in real-time and keep everyone in sync.',
    },
    {
      icon: <Wallet className="w-8 h-8 text-primary" />,
      title: 'Smart Expense Tracking',
      description: 'Manage trip budgets effortlessly. Track spending, split costs, and see where your money is going.',
    },
    {
      icon: <Bot className="w-8 h-8 text-primary" />,
      title: 'Personal Trip Assistant',
      description: 'Your AI guide on the go. Get timely reminders, traffic updates, and spontaneous recommendations.',
    },
  ];

  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-background">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold font-headline tracking-tighter sm:text-4xl">Plan Less, Experience More</h2>
            <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Wanderplan combines powerful AI with intuitive tools to make travel planning simple, collaborative, and fun.
            </p>
          </div>
        </div>
        <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:max-w-none lg:grid-cols-4 mt-12">
          {features.map((feature) => (
            <div key={feature.title} className="grid gap-4 text-center items-center justify-items-center">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
                {feature.icon}
              </div>
              <div className='space-y-2'>
                <h3 className="text-xl font-bold font-headline">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
