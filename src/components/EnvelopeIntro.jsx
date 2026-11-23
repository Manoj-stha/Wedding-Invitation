import { useCallback, useEffect, useRef, useState } from "react";
import envelopeVideo from "../assets/envelopeOpen.mp4";
import envelopePoster from "../assets/envelope-poster.jpg";

/**
 * Full-screen, chrome-less envelope opening video.
 * It sits on top of the invitation and stays paused on its first frame
 * until the guest taps/clicks anywhere, then plays through once and
 * fades away to reveal the invitation.
 */
const EnvelopeIntro = ({ onFinish, onStart }) => {
  const videoRef = useRef(null);
  const timeoutRef = useRef(null);
  const hasFinishedRef = useRef(false);
  const [started, setStarted] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const finish = useCallback(() => {
    if (hasFinishedRef.current) return;
    hasFinishedRef.current = true;
    // A playing video can take over the mobile audio session; make sure the
    // song is still going when the invitation is revealed.
    onStart?.();
    setLeaving(true);
    timeoutRef.current = window.setTimeout(onFinish, 900);
  }, [onFinish, onStart]);

  const start = useCallback(() => {
    // This runs in a genuine click/keypress handler. Start the song here so
    // mobile browsers count it as a user gesture on the very first tap.
    onStart?.();

    const video = videoRef.current;

    if (started) {
      // If playback was interrupted (a phone call, tab switch, etc.),
      // another tap quietly resumes it instead of leaving it stuck.
      if (video?.paused && !hasFinishedRef.current) {
        video.play().catch(() => {});
      }
      return;
    }

    setStarted(true);

    if (!video) {
      finish();
      return;
    }

    const playback = video.play();
    if (playback?.catch) {
      // If a browser still refuses playback, reveal the invitation
      // rather than stranding the guest on the first frame.
      playback.catch(() => finish());
    }
  }, [started, finish, onStart]);

  // Keep the page behind the intro from scrolling while it is on screen.
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div
      className={`envelope-intro${started ? " is-playing" : ""}${
        leaving ? " is-leaving" : ""
      }`}
      role="button"
      tabIndex={0}
      aria-label="विवाहोत्सवको निमन्त्रणा खोल्नुहोस्"
      onClick={start}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          start();
        }
      }}
      onContextMenu={(event) => event.preventDefault()}
    >
      <video
        ref={videoRef}
        className="envelope-intro__video"
        src={envelopeVideo}
        poster={envelopePoster}
        preload="auto"
        playsInline
        muted
        disablePictureInPicture
        controlsList="nodownload noplaybackrate noremoteplayback"
        tabIndex={-1}
        aria-hidden="true"
        onEnded={finish}
        onError={finish}
      />

      {!started && <p className="envelope-intro__hint">खोल्न ट्याप गर्नुहोस्</p>}
    </div>
  );
};

export default EnvelopeIntro;
