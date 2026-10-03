export function Empty({ children = "Nothing here yet." }: { children?: string }) {
  return (
    <p className="type-meta text-fg-muted">
      <span aria-hidden="true" className="font-sans">
        ○
      </span>{" "}
      {children}
    </p>
  );
}
