export function Empty({ children = "Nothing here yet." }: { children?: string }) {
  return (
    <p className="type-mono-12 text-fg-muted">
      <span aria-hidden="true" className="font-sans">
        ○
      </span>{" "}
      {children}
    </p>
  );
}
