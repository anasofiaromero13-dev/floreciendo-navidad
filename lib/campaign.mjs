export const campaign = Object.freeze({
  id: 'navidad-2026', domain: 'floreciendoconamor.org',
  timezone: 'America/Bogota', deadline: '2026-12-09',
  reminderDates: { '2026-11-25': 14, '2026-12-02': 7 },
});

// Pass only a user fetched from the authentication provider on the server.
// Never trust a form field, browser role or editable user_metadata as proof.
export function isStaff(verifiedAuthUser) {
  if (!verifiedAuthUser?.email_confirmed_at) return false;
  const email = verifiedAuthUser.email?.trim().toLowerCase();
  if (!email || email.split('@').length !== 2) return false;
  return email.split('@')[1] === campaign.domain;
}

export function localDate(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: campaign.timezone, year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(now);
}

// Rows must come from the database, not from recipient-supplied state.
export function needsReminder(row) {
  return row.campaignId === campaign.id && row.active === true &&
    !row.cancelledAt && !row.donorDeliveredAt && !row.staffReceivedAt && !row.distributedAt;
}

// The persistent sender must claim the idempotency key in the database,
// reload pending parts before send, and retry failures without duplicating mail.
export function planReminders(rows, sentKeys = new Set(), now = new Date()) {
  const daysBefore = campaign.reminderDates[localDate(now)];
  if (!daysBefore) return [];
  const groups = new Map();
  for (const row of rows) {
    if (!needsReminder(row) || !row.userId || !row.verifiedEmail) continue;
    const key = `${campaign.id}:${row.userId}:${daysBefore}`;
    if (sentKeys.has(key)) continue;
    if (!groups.has(key)) groups.set(key, {
      key, userId: row.userId, to: row.verifiedEmail, daysBefore, parts: [],
    });
    groups.get(key).parts.push({ id: row.id, childName: row.childName, part: row.part });
  }
  return [...groups.values()];
}

export function reminderMessage(plan, portalUrl) {
  const urgent = plan.daysBefore === 7;
  return {
    subject: urgent
      ? 'Falta una semana: tu regalo tiene una ilusión esperando ♡'
      : 'En dos semanas compartiremos tu regalo de Navidad ♡',
    text: [
      urgent ? '¡Ya se acerca nuestra Navidad en comunidad!' : 'Gracias por ser parte de esta Navidad con Floreciendo con Amor.',
      `Faltan ${plan.daysBefore === 7 ? '7' : '14'} días para la fecha límite de entrega: el 9 de diciembre de 2026.`,
      'Estas son las partes de tu compromiso que siguen pendientes:',
      ...plan.parts.map(p => `• ${p.childName}: ${p.part === 'clothes' ? 'ropa' : 'juguete'}`),
      'Entrega los regalos nuevos y etiquetados con el nombre del niño en consulta la dirección de entrega en Mi rincón.',
      'Si necesitas acordar otro punto de entrega o buscar una alternativa, escríbenos: https://wa.me/573204532791',
      `Si ya entregaste tu regalo, actualiza su estado en Mi rincón: ${portalUrl}`,
      'Gracias por hacer que el amor siga floreciendo.',
      'Fundación Floreciendo con Amor',
    ].join('\n\n'),
  };
}
