import test from 'node:test';
import assert from 'node:assert/strict';
import { isStaff, planReminders } from './campaign.mjs';

test('internal access requires verified exact email domain', () => {
  const user = { email: 'Equipo@FloreciendoConAmor.org', email_confirmed_at: '2026-11-07' };
  assert.equal(isStaff(user), true);
  assert.equal(isStaff({ ...user, email_confirmed_at: null }), false);
  for (const email of ['x@floreciendoconamor.org.ejemplo.com', 'x@sub.floreciendoconamor.org', 'x@gmail.com'])
    assert.equal(isStaff({ ...user, email }), false);
});

test('reminders group only pending parts and suppress cancelled, delivered and previously sent', () => {
  const row = { campaignId: 'navidad-2026', active: true, userId: 'u1', verifiedEmail: 'p@example.com', id: 'p1', childName: 'Gael', part: 'toy' };
  const rows = [row, { ...row, id: 'p2', part: 'clothes' },
    { ...row, id: 'p3', donorDeliveredAt: '2026-11-24' },
    { ...row, id: 'p4', cancelledAt: '2026-11-24' },
    { ...row, id: 'p5', staffReceivedAt: '2026-11-24' }];
  const date = new Date('2026-11-25T14:00:00Z');
  const plans = planReminders(rows, new Set(), date);
  assert.equal(plans.length, 1);
  assert.equal(plans[0].parts.length, 2);
  assert.equal(planReminders(rows, new Set([plans[0].key]), date).length, 0);
  assert.equal(planReminders(rows, new Set(), new Date('2026-11-26T14:00:00Z')).length, 0);
  assert.equal(planReminders(rows, new Set(), new Date('2026-12-02T14:00:00Z'))[0].daysBefore, 7);
  assert.equal(planReminders(rows, new Set(), new Date('2026-11-25T02:00:00Z')).length, 0);
});
