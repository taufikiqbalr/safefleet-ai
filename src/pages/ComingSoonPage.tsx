type ComingSoonPageProps = {
  phase: string;
  title: string;
};

export function ComingSoonPage({ phase, title }: ComingSoonPageProps) {
  return (
    <div className="content-stack">
      <section className="empty-state panel">
        <div className="empty-state-mark">{phase}</div>
        <span className="eyebrow">Phase boundary</span>
        <h2>{title}</h2>
        <p>
          This route is reserved for {phase}. The navigation exists now so later phases can be integrated without restructuring the operator shell.
        </p>
        <p className="empty-state-note">No mock operational data is rendered here during W0.</p>
      </section>
    </div>
  );
}
