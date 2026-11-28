/**
 * Fixed atmospheric backdrop for the whole app.
 *
 * Layers (bottom -> top): aurora blobs -> dot grid is painted by the app shell.
 * Every ambient animation here is transform/opacity only and is disabled by
 * both `prefers-reduced-motion` and the in-app `.reduced-motion` toggle
 * (see the matching rules in index.css).
 */
export default function AmbientBackground() {
  return (
    <div aria-hidden="true" className="aurora-field">
      <div className="aurora-blob aurora-blob--cobalt" />
      <div className="aurora-blob aurora-blob--iris" />
      <div className="aurora-blob aurora-blob--sun" />
    </div>
  )
}
