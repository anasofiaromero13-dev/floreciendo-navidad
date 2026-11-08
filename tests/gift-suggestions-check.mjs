import assert from 'node:assert/strict';
import {completeGiftIdeas} from '../src/gift-suggestions.mjs';
for (const saved of [undefined, null, [], {}, [{title:''}], [{title:'Figura de pony',url:'https://example.com'}]]) {
 const list=completeGiftIdeas({age:'10 años',likes:'Me gustan los ponis',size:'XS'},saved);
 assert.equal(list.length,3);
 assert.ok(list.every(i=>i.title.trim()));
}
const preserved=completeGiftIdeas({},[{title:'Uno',url:'https://example.com'},{title:'Dos'},{title:'Tres'}]);
assert.equal(preserved[0].url,'https://example.com');
assert.deepEqual(preserved.map(i=>i.title),['Uno','Dos','Tres']);
assert.match(completeGiftIdeas({age:'1 año'})[0].title,/Bloques grandes/);
assert.match(completeGiftIdeas({likes:'Harry Potter'})[0].title,/Harry Potter/);
console.log('Sugerencias verificadas: perfiles nuevos, datos vacíos y opciones guardadas.');
