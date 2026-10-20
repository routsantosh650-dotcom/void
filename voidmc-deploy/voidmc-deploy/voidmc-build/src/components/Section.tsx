import React from 'react';

interface HeadProps {
  kicker: string;
  title: React.ReactNode;
  lead?: string;
  right?: React.ReactNode;
}

export const SectionHead: React.FC<HeadProps> = ({ kicker, title, lead, right }) => (
  <div className="section-head">
    <div className="head-row">
      <div>
        <p className="eyebrow">{kicker}</p>
        <h2 className="h2" data-split="1">
          {title}
        </h2>
      </div>
      {right}
    </div>
    {lead ? <p className="lead">{lead}</p> : null}
  </div>
);

export const CtaBand: React.FC<{
  title: string;
  body: string;
  primary: { label: string; href: string; external?: boolean };
  secondary?: { label: string; href: string; external?: boolean };
}> = ({ title, body, primary, secondary }) => (
  <div className="cta-band" data-reveal="up">
    <h2 className="h2" style={{ maxWidth: '22ch' }}>
      {title}
    </h2>
    <p className="lead" style={{ marginBottom: 22 }}>
      {body}
    </p>
    <div className="row">
      <a
        href={primary.href}
        className="btn btn-primary lg"
        {...(primary.external ? { target: '_blank', rel: 'noreferrer' } : {})}
      >
        {primary.label}
      </a>
      {secondary ? (
        <a
          href={secondary.href}
          className="btn btn-ghost lg"
          {...(secondary.external ? { target: '_blank', rel: 'noreferrer' } : {})}
        >
          {secondary.label}
        </a>
      ) : null}
    </div>
  </div>
);
