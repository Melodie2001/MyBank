export default function LoadError() {
  return (
    <section role="alert" style={{ margin: 24, padding: 24, maxWidth: 560, borderRadius: 16, background: 'var(--color-white)', color: 'var(--color-text)' }}>
      <h2>Unable to load your data</h2>
      <p>Please check your connection and try again. Your data has not been deleted.</p>
      <button type="button" style={{ border: 0, borderRadius: 10, padding: '12px 20px', background: '#2563EB', color: 'white', fontWeight: 600, cursor: 'pointer' }} onClick={() => window.location.reload()}>Try again</button>
    </section>
  );
}
