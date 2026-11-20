import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { ProjectCarousel } from '@/components/projects/ProjectCarousel'
import { PROJECTS, projectBySlug } from '@/data/projects'

type Params = { params: Promise<{ slug: string }> }

// one page per project, built ahead of time
export const dynamicParams = false
export function generateStaticParams() {
  return PROJECTS.map((p) => ({ slug: p.id }))
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const project = projectBySlug((await params).slug)
  return project ? { title: project.name, description: project.blurb } : {}
}

export default async function ProjectPage({ params }: Params) {
  const { slug } = await params
  const index = PROJECTS.findIndex((p) => p.id === slug)
  if (index < 0) notFound()

  return (
    <>
      <SiteHeader />
      <main>
        {/* opens on this project, with every project in the track to swipe through */}
        <ProjectCarousel
          projects={PROJECTS}
          initial={index}
          underNav
          syncAddress
          titleAs="h1"
          eyebrow={
            <Link href="/projects" className="transition hover:text-ink">
              ← All projects
            </Link>
          }
          title={
            <>
              From first pour to <em className="text-bronze">final light.</em>
            </>
          }
          intro="Every building, from bare structure to the day it opens."
        />
      </main>
    </>
  )
}
