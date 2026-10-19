import type { ReactNode } from "react";
import styles from "./FeatureGrid.module.css";

export type FeatureGridItem = {
  title: string;
  content?: ReactNode;
  marker?: string;
};

/** Shared, content-sized cells for capabilities and benefits, not navigation. */
export default function FeatureGrid({
  items,
  tone = "light",
  headingLevel = 3,
  ordered = false,
}: {
  items: FeatureGridItem[];
  tone?: "light" | "warm" | "dark";
  headingLevel?: 2 | 3;
  ordered?: boolean;
}) {
  if (!items.length) return null;

  const Heading = headingLevel === 2 ? "h2" : "h3";
  const List = ordered ? "ol" : "ul";

  return (
    <div className={`${styles.frame} ${styles[tone]}`}>
      <List
        className={styles.grid}
        role="list"
        data-columns={items.length === 1 ? 1 : items.length === 2 || items.length === 4 ? 2 : 3}
        data-remainder={items.length % 3}
      >
        {items.map((item, index) => (
          <li className={styles.cell} key={`${item.title}-${index}`}>
            {item.marker ? <span className={styles.marker} aria-hidden="true">{item.marker}</span> : null}
            <Heading className={styles.title}>{item.title}</Heading>
            {item.content ? <div className={styles.copy}>{item.content}</div> : null}
          </li>
        ))}
      </List>
    </div>
  );
}
