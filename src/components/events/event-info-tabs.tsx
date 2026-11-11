"use client";

import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";

import styles from "@/components/editorial/editorial.module.css";

type EventInfoTabsProps = {
  tickets: ReactNode;
  details: ReactNode;
};

const tabs = [
  { id: "tickets", label: "Billets" },
  { id: "details", label: "Détails" },
] as const;

type TabId = (typeof tabs)[number]["id"];

export function EventInfoTabs({ tickets, details }: EventInfoTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>("tickets");
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const currentIndex = tabs.findIndex((tab) => tab.id === activeTab);
    let nextIndex: number | null = null;

    if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % tabs.length;
    if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = tabs.length - 1;

    if (nextIndex === null) return;
    event.preventDefault();
    const nextTab = tabs[nextIndex];
    if (!nextTab) return;
    setActiveTab(nextTab.id);
    tabRefs.current[nextIndex]?.focus();
  }

  return (
    <section className={styles.eventTabs} aria-label="Informations sur l’événement">
      <div className={styles.eventTabList} role="tablist" aria-label="Billets et détails">
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            ref={(node) => {
              tabRefs.current[index] = node;
            }}
            id={`event-tab-${tab.id}`}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`event-panel-${tab.id}`}
            tabIndex={activeTab === tab.id ? 0 : -1}
            className={styles.eventTab}
            onClick={() => setActiveTab(tab.id)}
            onKeyDown={handleKeyDown}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div
        id="event-panel-tickets"
        role="tabpanel"
        aria-labelledby="event-tab-tickets"
        tabIndex={0}
        hidden={activeTab !== "tickets"}
        className={styles.eventTabPanel}
      >
        {tickets}
      </div>

      <div
        id="event-panel-details"
        role="tabpanel"
        aria-labelledby="event-tab-details"
        tabIndex={0}
        hidden={activeTab !== "details"}
        className={styles.eventTabPanel}
      >
        {details}
      </div>
    </section>
  );
}
