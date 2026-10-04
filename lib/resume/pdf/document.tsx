import path from "node:path";
import { Document, Font, Link, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import type { ReactNode } from "react";
import type { ResumeView } from "@/lib/resume/view";
import { site } from "@/lib/site";

// The resume on paper (Sprint 8 spec §3.2, paper A): the web page's label |
// content rows on A4, Plex Mono text, the name in Plex Sans, hairline rules,
// black ink, the accent only on links. The fonts are vendored (OFL) and read
// from disk; next.config.ts traces them into the PDF routes.

const FONTS = path.join(process.cwd(), "lib/resume/pdf/fonts");
Font.register({
  family: "Plex Mono",
  fonts: [{ src: path.join(FONTS, "IBMPlexMono-Regular.woff") }, { src: path.join(FONTS, "IBMPlexMono-Medium.woff"), fontWeight: 500 }],
});
Font.register({ family: "Plex Sans", fonts: [{ src: path.join(FONTS, "IBMPlexSans-SemiBold.woff"), fontWeight: 600 }] });
// Never hyphenate: words stay whole.
Font.registerHyphenationCallback((word) => [word]);

// The light Work tokens (app/globals.css); the rule is a step darker than
// --color-line so it survives printing.
const INK = "#1F1F22";
const MUTED = "#6E6E73";
const SOFT = "#52525A";
const RULE = "#CFCFC9";
const ACCENT = "#2F55F5";

const styles = StyleSheet.create({
  page: { paddingVertical: 40, paddingHorizontal: 40, fontFamily: "Plex Mono", fontSize: 8.5, lineHeight: 1.45, color: INK },
  header: { flexDirection: "row", justifyContent: "space-between", gap: 16 },
  name: { fontFamily: "Plex Sans", fontWeight: 600, fontSize: 18, lineHeight: 1.2, marginBottom: 2 },
  muted: { color: MUTED },
  soft: { color: SOFT },
  link: { color: ACCENT, textDecoration: "none" },
  contact: { alignItems: "flex-end" },
  rule: { borderTopWidth: 0.5, borderTopColor: RULE, marginVertical: 10 },
  row: { flexDirection: "row", gap: 12 },
  label: { width: 70, color: MUTED },
  content: { flex: 1 },
  line: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  role: { marginBottom: 8 },
  bullet: { flexDirection: "row", marginTop: 2 },
  dash: { width: 10, color: MUTED },
  grow: { flex: 1 },
});

// A product title never wraps mid-name ("Maç / Kaçta"): its spaces become
// non-breaking, so the line breaks only between titles.
export const keepWhole = (title: string) => title.replace(/ /g, "\u00a0");

const absolute = (href: string) => (href.startsWith("/") ? `${site.url}${href}` : href);
const bare = (url: string) => url.replace(/^https:\/\/(www\.)?/, "").replace(/\/$/, "");

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <View style={styles.rule} />
      <View style={styles.row}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.content}>{children}</View>
      </View>
    </>
  );
}

export function ResumeDocument({ resume }: { resume: ResumeView }) {
  return (
    <Document title={`${resume.name} — Resume`} author={resume.name} subject="Resume" language="en">
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.name}>{resume.name}</Text>
            <Text style={styles.muted}>
              {resume.role} · {resume.place} · remote / hybrid
            </Text>
          </View>
          <View style={styles.contact}>
            {resume.email ? (
              <Link src={`mailto:${resume.email}`} style={styles.link}>
                {resume.email}
              </Link>
            ) : null}
            <Link src={site.url} style={styles.link}>
              {bare(site.url)}
            </Link>
            {resume.linkedin ? (
              <Link src={resume.linkedin.url} style={styles.link}>
                {bare(resume.linkedin.url)}
              </Link>
            ) : null}
          </View>
        </View>

        {resume.summary ? (
          <Row label="Summary">
            <Text style={styles.soft}>{resume.summary}</Text>
          </Row>
        ) : null}

        {resume.roles.length > 0 ? (
          <Row label="Experience">
            {resume.roles.map((role, roleIndex) => (
              // A role never splits across pages.
              <View key={`${role.org}-${roleIndex}`} style={styles.role} wrap={false}>
                <View style={styles.line}>
                  <Text>
                    {role.orgName} <Text style={styles.muted}>· {role.role}</Text>
                  </Text>
                  <Text style={styles.muted}>{role.span}</Text>
                </View>
                {role.bullets.map((bullet, index) => (
                  <View key={index} style={styles.bullet}>
                    <Text style={styles.dash}>–</Text>
                    <Text style={[styles.soft, styles.grow]}>{bullet}</Text>
                  </View>
                ))}
                {role.products.length > 0 ? (
                  <Text style={[styles.muted, { marginTop: 2 }]}>
                    {role.products.map((product, index) => (
                      <Text key={`${product.title}-${index}`}>
                        {index > 0 ? " · " : ""}
                        {product.href ? (
                          <Link src={absolute(product.href)} style={styles.link}>
                            {keepWhole(product.title)}
                          </Link>
                        ) : (
                          keepWhole(product.title)
                        )}
                      </Text>
                    ))}
                  </Text>
                ) : null}
              </View>
            ))}
          </Row>
        ) : null}

        {resume.projects.length > 0 ? (
          <Row label="Projects">
            {resume.projects.map((project, index) => (
              <Text key={`${project.title}-${index}`} style={{ marginBottom: 2 }}>
                {project.href ? (
                  <Link src={absolute(project.href)} style={styles.link}>
                    {project.title}
                  </Link>
                ) : (
                  project.title
                )}
                <Text style={styles.soft}> — {project.line}</Text>
              </Text>
            ))}
          </Row>
        ) : null}

        {resume.skills.length > 0 ? (
          <Row label="Skills">
            {resume.skills.map((skill, index) => (
              <Text key={`${skill.group}-${index}`}>
                <Text style={styles.muted}>{skill.group} </Text>
                <Text style={styles.soft}>{skill.items}</Text>
              </Text>
            ))}
          </Row>
        ) : null}

        {resume.education.length > 0 ? (
          <Row label="Education">
            {resume.education.map((entry, index) => (
              <View key={`${entry.degree}-${entry.school}-${index}`} style={styles.line}>
                <Text style={styles.soft}>
                  {entry.degree}, {entry.school}
                </Text>
                {entry.years ? <Text style={styles.muted}>{entry.years}</Text> : null}
              </View>
            ))}
          </Row>
        ) : null}
      </Page>
    </Document>
  );
}

export async function renderResumePdf(resume: ResumeView): Promise<Buffer> {
  return renderToBuffer(<ResumeDocument resume={resume} />);
}
