"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BRAND, BRAND_TAG, DEMO_HREF, LOGIN_HREF, NAV_LINKS } from "./config";
import { track } from "./analytics";
import ui from "./landing.module.css";
import styles from "./navbar.module.css";

export function Navbar() {
  const [open, setOpen] = useState(false);

  // Escape cierra el menú del celular.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const onDemo = () => {
    track("clic agendar demo", { lugar: "menú" });
    setOpen(false);
  };

  return (
    <header className={styles.nav}>
      <nav aria-label="Principal" className={`${ui.container} ${styles.inner}`}>
        <Link href="/" className={styles.brand}>
          <span className={styles.brandName}>{BRAND}</span>
          <span className={styles.brandTag}>{BRAND_TAG}</span>
        </Link>

        <ul className={styles.links}>
          {NAV_LINKS.map((l) => (
            <li key={l.href}>
              <a href={l.href} className={styles.link}>
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <Link href={LOGIN_HREF} className={`${styles.link} ${styles.login}`}>
          Entrar
        </Link>

        <a href={DEMO_HREF} onClick={onDemo} className={`${ui.btn} ${ui.btnAmber} ${ui.pulse} ${styles.demo}`}>
          Agendar demo
        </a>

        <button
          type="button"
          className={styles.menuButton}
          aria-expanded={open}
          aria-controls="menu-movil"
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          onClick={() => setOpen((v) => !v)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </nav>

      <div id="menu-movil" className={styles.menu} hidden={!open}>
        <ul className={ui.container}>
          {NAV_LINKS.map((l) => (
            <li key={l.href}>
              <a href={l.href} className={styles.link} onClick={() => setOpen(false)}>
                {l.label}
              </a>
            </li>
          ))}
          <li>
            <Link href={LOGIN_HREF} className={styles.link}>
              Entrar
            </Link>
          </li>
          <li>
            <a href={DEMO_HREF} onClick={onDemo} className={`${ui.btn} ${ui.btnAmber} ${styles.menuDemo}`}>
              Agendar demo
            </a>
          </li>
        </ul>
      </div>
    </header>
  );
}
