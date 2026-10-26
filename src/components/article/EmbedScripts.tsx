'use client'

import { useEffect } from 'react'

interface EmbedScriptsProps {
  content: string
}

/**
 * Deteksi embed sosmed di content HTML dan load script yang dibutuhkan.
 * Support: Instagram, Twitter/X, TikTok, Facebook, YouTube (iframe sudah otomatis).
 */
export function EmbedScripts({ content }: EmbedScriptsProps) {
  useEffect(() => {
    if (!content) return

    // Instagram embed
    if (content.includes('instagram.com') || content.includes('instagr.am')) {
      loadScript('https://www.instagram.com/embed.js', 'instagram-embed-js', () => {
        if ((window as unknown as Record<string, unknown>).instgrm) {
          (window as unknown as Record<string, { Embeds: { process: () => void } }>).instgrm.Embeds.process()
        }
      })
    }

    // Twitter/X embed
    if (content.includes('twitter.com') || content.includes('x.com') || content.includes('twitter-tweet')) {
      loadScript('https://platform.twitter.com/widgets.js', 'twitter-widgets-js', () => {
        if ((window as unknown as Record<string, unknown>).twttr) {
          (window as unknown as Record<string, { widgets: { load: () => void } }>).twttr.widgets.load()
        }
      })
    }

    // Threads embed
    if (content.includes('threads.net')) {
      loadScript('https://www.threads.net/embed.js', 'threads-embed-js')
    }

    // TikTok embed
    if (content.includes('tiktok.com')) {
      loadScript('https://www.tiktok.com/embed.js', 'tiktok-embed-js')
    }

    // Facebook embed
    if (content.includes('facebook.com/plugins') || content.includes('fb-post') || content.includes('fb-video')) {
      loadScript('https://connect.facebook.net/id_ID/sdk.js#xfbml=1&version=v18.0', 'facebook-jssdk', () => {
        if ((window as unknown as Record<string, unknown>).FB) {
          (window as unknown as Record<string, { XFBML: { parse: () => void } }>).FB.XFBML.parse()
        }
      })
    }
  }, [content])

  return null
}

function loadScript(src: string, id: string, onLoad?: () => void) {
  if (document.getElementById(id)) {
    // Script sudah ada, cukup re-process
    onLoad?.()
    return
  }

  const script = document.createElement('script')
  script.id = id
  script.src = src
  script.async = true
  if (onLoad) script.onload = onLoad
  document.body.appendChild(script)
}
