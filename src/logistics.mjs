export function giftNeeds(children, rows) {
  const active = rows.filter(r => !r.cancelled_at);
  const parts = ['clothes', 'toy'];
  const entries = children.map(child => {
    const gifts = Object.fromEntries(parts.map(part => {
      const claim = active.find(r => r.child_id === child.uuid && r.gift_part === part);
      const received = Boolean(claim && (claim.staff_received_at || claim.distributed_at));
      return [part, {claim, received, unclaimed: !claim}];
    }));
    return {child, ...gifts, missing: parts.some(p => !gifts[p].received), unclaimed: parts.some(p => gifts[p].unclaimed)};
  });
  return {
    entries,
    children: entries.filter(e => e.missing).length,
    unclaimedChildren: entries.filter(e => e.unclaimed).length,
    clothes: entries.filter(e => !e.clothes.received).length,
    toy: entries.filter(e => !e.toy.received).length,
    unclaimedClothes: entries.filter(e => e.clothes.unclaimed).length,
    unclaimedToys: entries.filter(e => e.toy.unclaimed).length
  };
}
