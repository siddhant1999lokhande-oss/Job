import Link from 'next/link'
import { Zap, Users, BarChart2, ChevronRight } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Hero Section */}
      <div className="relative flex-1 flex flex-col items-center justify-center overflow-hidden turf-bg">
        {/* Gradient blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-80px] left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-[-60px] right-[-80px] w-[300px] h-[300px] bg-emerald-700/10 rounded-full blur-2xl" />
        </div>

        <div className="relative z-10 w-full max-w-md mx-auto px-6 py-16 flex flex-col items-center text-center gap-8">
          {/* Logo */}
          <div className="flex flex-col items-center gap-3">
            <span className="text-6xl" role="img" aria-label="football">⚽</span>
            <h1 className="text-4xl font-extrabold tracking-tight text-white">
              Turf<span className="text-emerald-400">Mate</span>
            </h1>
          </div>

          {/* Tagline */}
          <div className="flex flex-col gap-2">
            <p className="text-2xl font-bold text-white leading-tight">
              Stop managing chaos.
            </p>
            <p className="text-2xl font-bold text-emerald-400 leading-tight">
              Start playing football.
            </p>
            <p className="mt-2 text-gray-400 text-base leading-relaxed">
              Organise matches, track stats, manage players — all in one place.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="w-full flex flex-col gap-3">
            <Link
              href="/login"
              className="btn-primary w-full text-center py-4 text-base font-semibold"
            >
              Join a Match
            </Link>
            <Link
              href="/login"
              className="btn-outline w-full text-center py-4 text-base font-semibold"
            >
              I&apos;m an Organiser
            </Link>
          </div>

          {/* Social proof */}
          <p className="text-gray-500 text-sm">
            Join <span className="text-emerald-400 font-semibold">500+</span> players already using TurfMate
          </p>
        </div>
      </div>

      {/* Feature Highlights */}
      <div className="bg-gray-900 border-t border-gray-800">
        <div className="max-w-md mx-auto px-6 py-12">
          <h2 className="text-center text-lg font-bold text-gray-400 uppercase tracking-widest mb-8">
            Why TurfMate?
          </h2>
          <div className="flex flex-col gap-4">
            <FeatureCard
              icon={<Zap className="w-5 h-5 text-emerald-400" />}
              title="One-tap joining"
              desc="Find a match, confirm attendance, and track your slot — no back-and-forth on WhatsApp."
            />
            <FeatureCard
              icon={<Users className="w-5 h-5 text-emerald-400" />}
              title="Smart Teams"
              desc="Auto-balanced teams based on skill and position. Drag-and-drop team builder for organisers."
            />
            <FeatureCard
              icon={<BarChart2 className="w-5 h-5 text-emerald-400" />}
              title="Track Everything"
              desc="Goals, wins, attendance rate, reliability score — your full football history at a glance."
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-950 border-t border-gray-800 py-6 text-center">
        <p className="text-gray-600 text-xs">
          &copy; {new Date().getFullYear()} TurfMate. Built for players, by players.
        </p>
      </div>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode
  title: string
  desc: string
}) {
  return (
    <div className="card flex items-start gap-4 p-4">
      <div className="mt-0.5 w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-white text-sm">{title}</h3>
          <ChevronRight className="w-3 h-3 text-emerald-500" />
        </div>
        <p className="text-gray-400 text-xs mt-1 leading-relaxed">{desc}</p>
      </div>
    </div>
  )
}
