export default function LoadError({ message }) {
  return <div role="alert" className="admin-error"><p>{message}</p>
    <button type="button" onClick={() => window.location.reload()}>Try again</button>
  </div>;
}
