import { useCallback, useEffect, useRef, useState } from 'react'
import './App.css'
import EnvelopeIntro from './components/EnvelopeIntro'
import cardBackground from './assets/innerCard.png'
import backgroundSong from './assets/background-song.mp3'

const App = () => {
  const [showIntro, setShowIntro] = useState(true)
  const [showScrollHint, setShowScrollHint] = useState(false)
  const scrollRef = useRef(null)
  const audioRef = useRef(null)
  const audioRequestedRef = useRef(false)

  const handleIntroFinish = useCallback(() => setShowIntro(false), [])

  // Must be called *inside* a real click / touch / key gesture. Mobile
  // browsers (iOS Safari in particular) reject audio.play() from a bare
  // pointerdown listener, which is why the first tap used to leave the intro
  // silent and only a second tap got the song going.
  const startAudio = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return

    audioRequestedRef.current = true
    if (!audio.paused) return

    const playback = audio.play()
    // Keep the promise handled so a rejected attempt doesn't surface as an
    // uncaught error. The next gesture will try again.
    if (playback && typeof playback.catch === 'function') {
      playback.catch(() => {})
    }
  }, [])

  // The intro calls startAudio from its own onClick/onKeyDown handler, so the
  // very first tap already unlocks the song. These listeners are a safety net
  // for later taps and for browsers that need touchend/click instead of
  // pointerdown.
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    // Some mobile browsers ignore preload="auto" until the element is touched.
    audio.load()

    const events = ['touchend', 'click', 'pointerdown', 'keydown']
    events.forEach((event) => {
      window.addEventListener(event, startAudio, {
        capture: true,
        passive: true,
      })
    })

    const resumeWhenVisible = () => {
      if (!document.hidden && audioRequestedRef.current) startAudio()
    }
    document.addEventListener('visibilitychange', resumeWhenVisible)

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, startAudio, true)
      })
      document.removeEventListener('visibilitychange', resumeWhenVisible)
    }
  }, [startAudio])

  // Show a soft fade at the bottom of the card only while more text is hidden.
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    const update = () => {
      const hasOverflow = el.scrollHeight > el.clientHeight + 1
      const atEnd = el.scrollTop + el.clientHeight >= el.scrollHeight - 2
      setShowScrollHint(hasOverflow && !atEnd)
    }

    update()

    const observer = new ResizeObserver(update)
    observer.observe(el)
    if (el.firstElementChild) observer.observe(el.firstElementChild)
    el.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    document.fonts?.ready.then(update).catch(() => {})

    return () => {
      observer.disconnect()
      el.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  return (
    <>
      <audio
        ref={audioRef}
        className="background-song"
        src={backgroundSong}
        loop
        preload="auto"
        aria-hidden="true"
      />

      <main
        className="site"
        style={{ '--card-background': `url(${cardBackground})` }}
      >
        <h1 className="sr-only">
          मनिषा र सुजनको विवाहोत्सवको निमन्त्रणा
        </h1>

        <article className="card">
          <div className="card__content">
            <p className="card__mantra">॥ श्री गणेशाय नमः ॥</p>

            <div
              className={`card__scroll-shell${showScrollHint ? ' has-more' : ''}`}
            >
              <div
                className="card__scroll"
                ref={scrollRef}
                tabIndex={0}
                aria-label="विवाहोत्सवको विवरण"
              >
                <div className="card__scroll-inner">
                  <section className="card__couple" aria-label="मनिषा र सुजन">
                    <p className="card__eyebrow">शुभविवाह</p>
                    <p className="card__name">मनिषा</p>
                    <p className="card__amp" aria-hidden="true">
                      र
                    </p>
                    <p className="card__name">सुजन</p>
                  </section>

                  <p className="card__blessing">
                    भगवान् श्री गणेश तथा ज्येष्ठजनहरूको आशीर्वादसहित, 
                    यस शुभ विवाह समारोहमा यहाँहरूको उपस्थितिका लागि हार्दिक निमन्त्रणा गर्दछौँ।
                  </p>

                  <div className="card__ornament" aria-hidden="true" />

                  <dl className="card__details">
                    <div className="card__row">
                      <div className="card__detail">
                        <dt>मिति</dt>
                        <dd>१६ मंसिर, २०८३</dd>
                      </div>
                      <div className="card__detail">
                        <dt>समय</dt>
                        <dd>११:०० &ndash; ३:०० बजे</dd>
                      </div>
                    </div>
                    
                    <div className="card__detail">
                      <dt>स्थान</dt>
                      <dd>धुलिखेल सामुदायिक सेवा भवन</dd>
                      
                    </div>
                    <div className="card__detail">
                      <dt>ठेगाना</dt>
                      <dd>इटहरी-४, सयापत्री टोल</dd>
                    </div>
                  </dl>

                  <div className="card__footer">
                    <p className="card__closing">
                      यहाँहरूको गरिमामय उपस्थिति र आशीर्वादले हाम्रो खुसीलाई पूर्णता प्रदान गर्नेछ।
                    </p>
                    
                  </div>
                </div>
              </div>
            </div>
          </div>
        </article>
      </main>

      {showIntro && (
        <EnvelopeIntro onFinish={handleIntroFinish} onStart={startAudio} />
      )}
    </>
  )
}

export default App
