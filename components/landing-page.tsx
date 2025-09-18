'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
  Code2, 
  Terminal, 
  Zap, 
  Globe, 
  Smartphone, 
  GitBranch,
  FileText,
  MessageSquare,
  ArrowRight,
  Github,
  Twitter
} from 'lucide-react';

export function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Code2 className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold">Claude Code UI</span>
        </div>
        <nav className="hidden md:flex items-center gap-6">
          <Link href="#features" className="text-muted-foreground hover:text-foreground">
            Features
          </Link>
          <Link href="#demo" className="text-muted-foreground hover:text-foreground">
            Demo
          </Link>
          <Link href="#docs" className="text-muted-foreground hover:text-foreground">
            Docs
          </Link>
          <Button asChild>
            <Link href="/auth/login">Get Started</Link>
          </Button>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container flex-1 px-4 py-16 md:py-24">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
            Modern Web Interface for{' '}
            <span className="gradient-text">Claude Code</span> &{' '}
            <span className="gradient-text">Cursor CLI</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground md:text-xl">
            Access Claude Code and Cursor CLI from anywhere with a beautiful, 
            responsive web interface. Built with Next.js, powered by v0, deployed on Vercel.
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" asChild>
              <Link href="/auth/login">
                Start Coding <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="#demo">
                View Demo
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container px-4 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-12">
            Everything you need for AI-powered development
          </h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={<MessageSquare className="h-8 w-8" />}
              title="Interactive Chat"
              description="Real-time communication with Claude and Cursor AI through a beautiful chat interface"
            />
            <FeatureCard
              icon={<Terminal className="h-8 w-8" />}
              title="Built-in Terminal"
              description="Access Claude Code and Cursor CLI directly through an integrated web terminal"
            />
            <FeatureCard
              icon={<FileText className="h-8 w-8" />}
              title="File Explorer"
              description="Browse, edit, and manage your project files with syntax highlighting and live preview"
            />
            <FeatureCard
              icon={<GitBranch className="h-8 w-8" />}
              title="Git Integration"
              description="Full Git workflow support with visual diff, branch management, and commit history"
            />
            <FeatureCard
              icon={<Smartphone className="h-8 w-8" />}
              title="Mobile Ready"
              description="Responsive design that works perfectly on desktop, tablet, and mobile devices"
            />
            <FeatureCard
              icon={<Zap className="h-8 w-8" />}
              title="Lightning Fast"
              description="Built with Next.js 15 and deployed on Vercel Edge Network for optimal performance"
            />
          </div>
        </div>
      </section>

      {/* Technology Stack */}
      <section className="container px-4 py-16 bg-muted/50">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold mb-8">Built with Modern Technology</h2>
          <div className="grid gap-6 md:grid-cols-4">
            <TechCard name="Next.js 15" description="React framework with App Router" />
            <TechCard name="Vercel" description="Deployment and hosting platform" />
            <TechCard name="v0" description="AI-powered component generation" />
            <TechCard name="TypeScript" description="Type-safe development" />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container px-4 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to enhance your AI development workflow?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join developers who are already using Claude Code UI to boost their productivity.
          </p>
          <Button size="lg" asChild>
            <Link href="/auth/login">
              Get Started for Free <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/50">
        <div className="container px-4 py-8">
          <div className="flex flex-col items-center gap-4 md:flex-row md:justify-between">
            <div className="flex items-center gap-2">
              <Code2 className="h-6 w-6 text-primary" />
              <span className="font-semibold">Claude Code UI</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="https://github.com" className="text-muted-foreground hover:text-foreground">
                <Github className="h-5 w-5" />
              </Link>
              <Link href="https://twitter.com" className="text-muted-foreground hover:text-foreground">
                <Twitter className="h-5 w-5" />
              </Link>
            </div>
          </div>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            © 2024 Claude Code UI. Built with ❤️ using Next.js and v0.
          </div>
        </div>
      </footer>
    </div>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="flex flex-col items-center text-center p-6 rounded-lg border bg-card">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}

interface TechCardProps {
  name: string;
  description: string;
}

function TechCard({ name, description }: TechCardProps) {
  return (
    <div className="p-4 rounded-lg border bg-card">
      <h3 className="font-semibold mb-1">{name}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}