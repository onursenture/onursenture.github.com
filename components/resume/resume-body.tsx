import { Fragment, type ReactNode } from "react";
import { ItemLink } from "@/components/sections/item-link";
import { DitherRule } from "@/components/ui/dither";
import { OrgMark } from "@/components/ui/org-mark";
import { SectionRow } from "@/components/ui/section-row";
import { TextLink } from "@/components/ui/text-link";
import { encodeEmail } from "@/lib/resume/email";
import type { ResumeView } from "@/lib/resume/view";
import { EmailLink } from "./email-link";

// The /resume/ rows (Sprint 8 spec §3.1, mockup A): header, Summary,
// Experience, Projects, Skills, Education on the site grid, dither rules
// between them; an empty section is left out. Every action is a text link.
export function ResumeBody({ resume, bookable }: { resume: ResumeView; bookable: boolean }) {
  const contact: ReactNode[] = [
    resume.email ? <EmailLink key="email" code={encodeEmail(resume.email)} className="text-accent" /> : null,
    <ItemLink key="site" href="/" className="text-accent">
      onursenture.com
    </ItemLink>,
    resume.linkedin ? (
      <TextLink key="linkedin" href={resume.linkedin.url} className="text-accent">
        LinkedIn
      </TextLink>
    ) : null,
  ].filter(Boolean);

  const rows = [
    <SectionRow
      key="header"
      id="resume"
      labelAs="div"
      label={
        <ItemLink href="/" className="text-fg-muted">
          ← Home
        </ItemLink>
      }
      action={
        <span className="flex flex-col gap-1 lg:items-end">
          {/* A plain <a>: next/link would try a client navigation to a route handler. */}
          <a href="/resume.pdf" className="group inline text-accent">
            <span className="group-hover:underline group-hover:underline-offset-[0.2em]">Download PDF</span>
            <span aria-hidden="true">{" ↓"}</span>
          </a>
          {bookable ? (
            <TextLink href="/book/" className="text-accent">
              Book a call
            </TextLink>
          ) : null}
        </span>
      }
    >
      <h1 className="type-lead">
        {resume.name} <span className="text-fg-muted">{resume.role}.</span>
      </h1>
      <p className="mt-2 type-meta text-fg-muted">{resume.place} · remote / hybrid</p>
      <p className="mt-1 type-meta text-fg-muted">
        {contact.map((item, index) => (
          <Fragment key={index}>
            {index > 0 ? " · " : null}
            {item}
          </Fragment>
        ))}
      </p>
    </SectionRow>,
    resume.summary ? (
      <SectionRow key="summary" id="summary" label="Summary">
        <p className="type-body text-fg-soft">{resume.summary}</p>
      </SectionRow>
    ) : null,
    resume.roles.length > 0 ? (
      <SectionRow key="experience" id="experience" label="Experience">
        <ul className="flex flex-col gap-6 type-body">
          {resume.roles.map((role) => (
            <li key={role.org}>
              <div className="flex items-baseline justify-between gap-4">
                <span>
                  <OrgMark org={role.org} /> <span className="text-fg">{role.orgName}</span>{" "}
                  <span className="whitespace-nowrap text-fg-muted">· {role.role}</span>
                </span>
                <span className="shrink-0 type-meta text-fg-muted">{role.span}</span>
              </div>
              {role.bullets.length > 0 ? (
                <ul className="mt-2 flex list-disc flex-col gap-1 pl-4 text-fg-soft marker:text-fg-muted">
                  {role.bullets.map((bullet, index) => (
                    <li key={index}>{bullet}</li>
                  ))}
                </ul>
              ) : null}
              {role.products.length > 0 ? (
                <p className="mt-2 type-meta text-fg-muted">
                  {role.products.map((product, index) => (
                    <Fragment key={product.title}>
                      {index > 0 ? " · " : null}
                      {product.href ? (
                        <ItemLink href={product.href} className="text-accent">
                          {product.title}
                        </ItemLink>
                      ) : (
                        product.title
                      )}
                    </Fragment>
                  ))}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      </SectionRow>
    ) : null,
    resume.projects.length > 0 ? (
      <SectionRow key="projects" id="projects" label="Projects">
        <ul className="flex flex-col gap-2 type-body">
          {resume.projects.map((project) => (
            <li key={project.title}>
              {project.href ? (
                <TextLink href={project.href} className="text-accent">
                  {project.title}
                </TextLink>
              ) : (
                <span className="text-fg">{project.title}</span>
              )}{" "}
              <span className="text-fg-soft">— {project.line}</span>
            </li>
          ))}
        </ul>
      </SectionRow>
    ) : null,
    resume.skills.length > 0 ? (
      <SectionRow key="skills" id="skills" label="Skills">
        <dl className="grid grid-cols-[max-content_minmax(0,1fr)] gap-x-4 gap-y-1 type-body">
          {resume.skills.map((skill) => (
            <Fragment key={skill.group}>
              <dt className="text-fg-muted">{skill.group}</dt>
              <dd className="text-fg-soft">{skill.items}</dd>
            </Fragment>
          ))}
        </dl>
      </SectionRow>
    ) : null,
    resume.education.length > 0 ? (
      <SectionRow key="education" id="education" label="Education">
        <ul className="flex flex-col gap-1 type-body">
          {resume.education.map((entry) => (
            <li key={`${entry.degree}-${entry.school}`} className="flex items-baseline justify-between gap-4">
              <span className="text-fg-soft">
                {entry.degree}, {entry.school}
              </span>
              {entry.years ? <span className="shrink-0 type-meta text-fg-muted">{entry.years}</span> : null}
            </li>
          ))}
        </ul>
      </SectionRow>
    ) : null,
  ].filter(Boolean);

  return (
    <main className="pb-8">
      {rows.map((row, index) => (
        <Fragment key={index}>
          {index > 0 ? <DitherRule className="mx-4 md:mx-10" /> : null}
          {row}
        </Fragment>
      ))}
    </main>
  );
}
