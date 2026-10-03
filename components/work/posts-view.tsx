import { Fragment } from "react";
import { DitherRule } from "@/components/ui/dither";
import { TextLink } from "@/components/ui/text-link";
import type { PostView, YearGroup } from "@/lib/work/derive";

// The related X posts: year groups, newest first, like the Log. Each row is
// the day, the account, our own one-line summary and a link to the post.
export function PostsView({ groups }: { groups: YearGroup<PostView>[] }) {
  return (
    <div data-view="posts">
      {groups.map((group, index) => (
        <Fragment key={group.year}>
          {index > 0 ? <DitherRule className="mx-4 md:mx-10" /> : null}
          <section
            aria-labelledby={`posts-year-${group.year}`}
            className="grid gap-4 px-4 py-8 md:px-10 lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-7 lg:py-[30px]"
          >
            <div>
              <h2 id={`posts-year-${group.year}`} className="type-name lg:sticky lg:top-6">
                {group.year}
              </h2>
            </div>
            <ol className="flex flex-col gap-4">
              {group.items.map((post) => (
                <li
                  key={post.id}
                  id={`post-${post.id}`}
                  className="grid gap-x-6 gap-y-1 md:grid-cols-[7ch_12ch_minmax(0,1fr)_auto]"
                >
                  <span className="type-meta text-fg-muted">{post.day}</span>
                  <span className="type-meta text-fg-muted">{post.account}</span>
                  <p className="type-body text-fg-soft">{post.summary}</p>
                  <TextLink href={post.url} ariaLabel={`Post on X, ${post.day} ${post.year}, ${post.account}`} className="type-meta text-accent">
                    post
                  </TextLink>
                </li>
              ))}
            </ol>
          </section>
        </Fragment>
      ))}
    </div>
  );
}
