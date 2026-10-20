import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import type { FaqDoc } from '../data/vmData';

/**
 * Accordion where only one answer is open, so a long list stays scannable. The button is the whole
 * question row, which keeps it reachable by keyboard and by a thumb.
 */
export const FaqList: React.FC<{ items: FaqDoc[]; idPrefix?: string }> = ({ items, idPrefix = 'faq' }) => {
  const [open, setOpen] = useState<string | null>(items[0]?.id ?? null);

  return (
    <div className="stack" style={{ gap: 10 }}>
      {items.map((f) => {
        const isOpen = open === f.id;
        return (
          <div key={f.id} className={`faq-item ${isOpen ? 'is-open' : ''}`} data-reveal="up">
            <button
              type="button"
              className="faq-q"
              aria-expanded={isOpen}
              aria-controls={`${idPrefix}-${f.id}`}
              onClick={() => setOpen(isOpen ? null : f.id)}
            >
              <span>{f.q}</span>
              <Plus size={16} className="faq-mark" />
            </button>
            {isOpen ? (
              <p className="faq-a" id={`${idPrefix}-${f.id}`}>
                {f.a}
              </p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
};
