'use client'
// Home3DScene.tsx
// Page one of the home page: the tower. Everything behind it (the canvas renderer, the
// film player, GSAP, the cinematic director) is fetched only here and only in the
// browser, so it never runs on the server and never weighs on any other page.

import dynamic from 'next/dynamic'

const SceneStage = dynamic(() => import('./scene/SceneStage'), {
  ssr: false,
  // the ink the tower fades up out of, until the scene's own loader takes over
  loading: () => <div className="fixed inset-0 bg-ink" aria-hidden />,
})

export function Home3DScene() {
  return <SceneStage />
}

export default Home3DScene
