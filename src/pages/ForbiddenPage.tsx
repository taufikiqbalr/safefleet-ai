import { Link } from 'react-router-dom';

export function ForbiddenPage() {
  return (
    <section className="panel forbidden-panel">
      <span className="eyebrow">403 · Role boundary</span>
      <h2>This route is not available for your current SafeFleet role.</h2>
      <p>
        The web application hides management areas that do not match the current operator role. Backend authorization remains authoritative for every API request.
      </p>
      <Link className="button button--primary" to="/">Return to overview</Link>
    </section>
  );
}
