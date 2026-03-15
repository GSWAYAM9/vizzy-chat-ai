import { GenerationHistory } from '@/components/generation-history'

export const metadata = {
  title: 'Generation History | Vizzy',
  description: 'View all your AI-generated images and manage your creative history',
}

export default function HistoryPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <GenerationHistory />
      </div>
    </main>
  )
}
