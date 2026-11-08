import assert from 'node:assert/strict';
import {giftNeeds} from '../src/logistics.mjs';
const children = [{uuid:'a'},{uuid:'b'},{uuid:'c'}];
const rows = [
 {child_id:'a',gift_part:'clothes',staff_received_at:'2026-11-07'},
 {child_id:'a',gift_part:'toy',donor_status:'delivered'},
 {child_id:'b',gift_part:'clothes',cancelled_at:'2026-11-07'},
 {child_id:'b',gift_part:'toy',donor_status:'purchased'},
 {child_id:'c',gift_part:'clothes',distributed_at:'2026-12-12'},
 {child_id:'c',gift_part:'toy',staff_received_at:'2026-11-07'}
];
const result=giftNeeds(children,rows);
assert.equal(result.children,2);
assert.equal(result.unclaimedChildren,1);
assert.equal(result.clothes,1);
assert.equal(result.toy,2);
assert.equal(result.unclaimedClothes,1);
assert.equal(result.unclaimedToys,0);
assert.equal(result.entries[0].toy.received,false);
assert.equal(result.entries[1].clothes.unclaimed,true);
assert.equal(giftNeeds(children,[]).children,3);
assert.equal(giftNeeds([],[]).children,0);
console.log('Logística verificada: cancelaciones, entrega del padrino, recepción y regalos completos.');
