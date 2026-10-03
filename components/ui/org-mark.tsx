import { ORGS, type OrgId } from "@/content/orgs";

// A 16px inline mark before an organisation's name: its logo, or a monogram
// tile when there is none. Decorative: the name always follows in text.
export function OrgMark({ org }: { org: OrgId }) {
  const { logo, monogram } = ORGS[org];
  if (logo) {
    // eslint-disable-next-line @next/next/no-img-element -- tiny local PNG
    return <img src={logo} alt="" aria-hidden="true" width={16} height={16} className="inline-block size-4 rounded-[4px] align-[-3px]" />;
  }
  return (
    <span
      aria-hidden="true"
      className="inline-grid size-4 place-items-center rounded-[4px] bg-fg align-[-3px] text-[9px] leading-none font-medium text-bg"
    >
      {monogram}
    </span>
  );
}
