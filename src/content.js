// Public project facts verified against TUSHANT-CSE repositories on 2026-11-16.
// No private contact data, credentials, visitor data, or third-party API calls.
export const projects = {
  payproof: {
    title: 'PayProof',
    category: 'BACKEND / FINTECH LEARNING TOOLKIT',
    tagline: 'A bank alert is evidence. A matched statement is confirmation.',
    image: '/images/payproof.webp',
    imageAlt: 'PayProof merchant dashboard using synthetic demonstration orders with credentials redacted',
    problem: 'Bank notifications can arrive late, repeat, or refer to the wrong order. Calling an alert a successful payment hides the difference between an observation and a reconciled transaction.',
    approach: 'PayProof models that difference explicitly. A payment becomes RECONCILED only after its reference and exact amount match an imported statement. Ambiguous alerts remain reviewable rather than silently becoming success.',
    features: [
      'Integer-paise amount matching and explicit payment lifecycle states.',
      'One live collection slot per account, with queued requests.',
      'A double-entry ledger recorded during reconciliation.',
      'A transactional outbox with signed HMAC-SHA256 webhooks and retries.'
    ],
    learning: 'The interesting engineering is in the failure paths: duplicate alerts, late evidence, account contention, and retrying delivery without inventing a successful settlement.',
    boundary: 'A teaching-grade reference implementation, not a payment gateway or a production payment service. The screenshot contains synthetic demo data. No real payment was made.',
    github: 'https://github.com/TUSHANT-CSE/payproof',
    demo: null
  },
  pulse: {
    title: 'Pulse',
    category: 'OBSERVABILITY / INTERACTIVE WEB EXPERIENCE',
    tagline: 'A clearer view of what is up, what is slow, and what changed.',
    image: '/images/pulse.webp',
    imageAlt: 'Pulse browser demo with an animated monitoring interface and explicitly simulated service data',
    problem: 'A green status badge alone cannot explain a slow service or a past outage. Monitoring needs useful context: sample history, latency, and an incident timeline.',
    approach: 'Pulse brings those signals into a 3D-animated console. The local application performs HTTP checks and keeps SQLite history. A separate browser-only demo explores the same interaction design using simulated signals.',
    features: [
      'HTTP monitoring with explicit check states in the local application.',
      'SQLite history, latency summaries, and incident timelines.',
      'A WebGL-led interface with monitor and public-status views.',
      'A public browser demo that clearly distinguishes simulated data from real checks.'
    ],
    learning: 'The interface should be expressive without pretending to know more than it does. Sampled checks are not proof of universal availability, and demo signals must stay labelled as demo signals.',
    boundary: 'The linked hosted experience is a browser-only demo. It uses synthetic monitoring data and does not run real uptime checks. Real monitoring requires the local application.',
    github: 'https://github.com/TUSHANT-CSE/pulse',
    demo: 'https://tushant-cse.github.io/pulse/'
  }
};
