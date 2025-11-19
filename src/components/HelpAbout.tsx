import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ExternalLink, BookOpen, LifeBuoy, Info } from 'lucide-react'

export function HelpAbout() {
  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold text-white">Help & About</h2>
        <p className="text-gray-400 max-w-2xl">
          Need assistance getting started with hashkitteh? Use this page to find documentation, troubleshooting tips, and learn more about the project.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-[#1F2937] border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <LifeBuoy className="h-5 w-5 text-primary" />
              Quick Start Checklist
            </CardTitle>
            <CardDescription className="text-gray-400">
              Make sure these steps are completed before running a task.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-gray-300 space-y-3">
            <ul className="list-disc list-inside space-y-2">
              <li>Open Settings and set the correct path to your <strong>hashcat</strong> binary.</li>
              <li>Gather hashes and paste them (one per line) or import a hash file.</li>
              <li>Choose the appropriate attack mode, wordlists, masks, or rules.</li>
              <li>Enable CPU-only mode if your system lacks GPU/OpenCL support.</li>
              <li>Use the Results view to export cracked passwords after execution.</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="bg-[#1F2937] border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <BookOpen className="h-5 w-5 text-primary" />
              Documentation & Resources
            </CardTitle>
            <CardDescription className="text-gray-400">
              Helpful places to learn more about hashkitteh and hashcat.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start text-sm"
              onClick={() => window.open('https://github.com/justinoboyle/hashkitteh/blob/main/README.md', '_blank')}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Project README (setup & commands)
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start text-sm"
              onClick={() => window.open('https://hashcat.net/wiki/', '_blank')}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Official Hashcat Wiki
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start text-sm"
              onClick={() => window.open('https://hashcat.net/faq/', '_blank')}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Hashcat FAQ / Troubleshooting
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-[#111827] border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Info className="h-5 w-5 text-primary" />
            About hashkitteh
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-300 space-y-3">
          <p>
            <strong>Creator:</strong> Justin Rock
          </p>
          <p>
            hashkitteh is a modern, cross-platform desktop interface for the hashcat password recovery engine. The goal is to provide a clean, approachable workflow for configuring attacks, monitoring progress, and exporting results — without sacrificing the power of the underlying CLI.
          </p>
          <div>
            <Button
              variant="ghost"
              className="p-0 text-primary hover:underline"
              onClick={() => window.open('https://www.red5labs.com', '_blank')}
            >
              Visit www.red5labs.com
            </Button>
          </div>
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} hashkitteh. All rights reserved.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

