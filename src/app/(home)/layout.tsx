import Logo from "@/components/Logo";
import { glassCard } from "@/lib/utils";
import SignInButton from "./_components/SignIn";
import Link from "next/link";
import AnimatedBackground from "./_components/AnimatedBackground";

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white relative">
      <AnimatedBackground />
      <header className={`sticky top-5 container mx-auto px-4 py-6 flex justify-between items-center z-50 ${glassCard}`}>
        <Logo iconSize={36}/>
        <nav className="hidden lg:flex space-x-8">
          {['features', 'testimonials', 'pricing', 'docs'].map(n => (
            <Link
              key={n}
              href={n === 'docs' ? `/${n}` : `#${n}`}
              className='hover:text-indigo-400 transition-colors duration-300 text-lg'
            >
              {n[0].toUpperCase() + n.slice(1)}
            </Link>
          ))}
        </nav>
        <div className="flex space-x-4">
          <SignInButton />
        </div>
      </header>
      {children}
    </div>
  )
}
