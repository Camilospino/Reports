"use client";

import { WHATSAPP_HREF } from "./config";
import { track } from "./analytics";
import styles from "./whatsapp.module.css";

export function WhatsappLink({ className, lugar, children }: { className?: string; lugar: string; children: React.ReactNode }) {
  return (
    <a
      href={WHATSAPP_HREF}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={() => track("clic WhatsApp", { lugar })}
    >
      {children}
    </a>
  );
}

// Botón flotante, abajo a la derecha, en todas las páginas públicas.
export function WhatsappButton() {
  return (
    <WhatsappLink className={styles.float} lugar="botón flotante">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.5l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.1 5.1 0 0 0 1.1 2.7 11.6 11.6 0 0 0 4.4 3.9c1.6.7 2.3.8 3.1.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z" />
      </svg>
      <span className={styles.label}>Escríbenos por WhatsApp</span>
    </WhatsappLink>
  );
}
