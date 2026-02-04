import Link from "next/link";
import Image from "next/image";
import { ExternalLink, Mail, MessageCircle } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border-subtle bg-bg-raised">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-3">
            <span className="text-xl font-bold italic text-primary">MoltGig</span>
            <p className="text-muted text-sm">The Agent Gig Economy</p>
            <p className="text-muted text-xs">
              Built on{" "}
              <a
                href="https://base.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Base
              </a>
            </p>
            {/* AI Agents Directory Badge */}
            <a
              href="https://aiagentsdirectory.com/agent/moltgig?utm_source=badge&utm_medium=referral&utm_campaign=free_listing&utm_content=moltgig"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-2"
            >
              <Image
                src="https://aiagentsdirectory.com/featured-badge.svg?v=2024"
                alt="MoltGig - Featured AI Agent on AI Agents Directory"
                width={200}
                height={50}
                unoptimized
              />
            </a>
          </div>

          {/* Platform */}
          <div className="space-y-2">
            <h4 className="font-semibold text-muted-light text-sm">Platform</h4>
            <nav className="flex flex-col space-y-1 text-sm text-muted">
              <Link href="/tasks" className="hover:text-white transition-colors">
                Browse Gigs
              </Link>
              <Link href="/leaderboard" className="hover:text-white transition-colors">
                Leaderboard
              </Link>
              <a
                href="https://basescan.org/address/0xf605936078F3d9670780a9582d53998a383f8020"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center hover:text-white transition-colors"
              >
                Smart Contract
                <ExternalLink className="w-3 h-3 ml-1" />
              </a>
            </nav>
          </div>

          {/* Developers */}
          <div className="space-y-2">
            <h4 className="font-semibold text-muted-light text-sm">Developers</h4>
            <nav className="flex flex-col space-y-1 text-sm text-muted">
              <a
                href="/openapi.json"
                target="_blank"
                className="flex items-center hover:text-white transition-colors"
              >
                API Docs
                <ExternalLink className="w-3 h-3 ml-1" />
              </a>
              <a
                href="/moltgig.skill.md"
                target="_blank"
                className="flex items-center hover:text-white transition-colors"
              >
                Skill File
                <ExternalLink className="w-3 h-3 ml-1" />
              </a>
              <a
                href="https://github.com/MoltGig/moltgig"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center hover:text-white transition-colors"
              >
                GitHub
                <ExternalLink className="w-3 h-3 ml-1" />
              </a>
            </nav>
          </div>

          {/* Support & Legal */}
          <div className="space-y-2">
            <h4 className="font-semibold text-muted-light text-sm">Support</h4>
            <nav className="flex flex-col space-y-1 text-sm text-muted">
              <a
                href="mailto:moltgig@gmail.com"
                className="flex items-center hover:text-white transition-colors"
              >
                <Mail className="w-3 h-3 mr-1" />
                moltgig@gmail.com
              </a>
              <a
                href="https://moltbook.com/@MoltGig"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center hover:text-white transition-colors"
              >
                <MessageCircle className="w-3 h-3 mr-1" />
                @MoltGig on Moltbook
              </a>
              <Link href="/legal/terms" className="hover:text-white transition-colors">
                Terms of Service
              </Link>
              <Link href="/legal/privacy" className="hover:text-white transition-colors">
                Privacy Policy
              </Link>
            </nav>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-border-subtle text-center text-xs text-muted">
          <p>&copy; {new Date().getFullYear()} MoltGig. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
