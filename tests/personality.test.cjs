'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),P=require('../personality-core.js');
test('Eighty distinct short lines rotate without immediate repetition between full decks',()=>{
  const all=Object.values(P.lines).flat();assert.equal(all.length,80);assert.equal(new Set(all).size,80);
  for(const [kind,pool] of Object.entries(P.lines)){
    const deck=P.createDeck(()=>.5),cycle=Array.from({length:pool.length},()=>deck.next(kind));
    assert.deepEqual(new Set(cycle),new Set(pool));assert.notEqual(deck.next(kind),cycle.at(-1));
    for(const line of pool)assert.ok(line.length<=140);
  }
});
test('Greeting, encouragement and movement have independent message decks',()=>{
  const deck=P.createDeck(()=>0),first=deck.next('greeting');
  assert.ok(P.lines.fly.includes(deck.next('fly')));assert.ok(P.lines.jump.includes(deck.next('jump')));
  assert.notEqual(deck.next('greeting'),first);assert.ok(P.lines.encourage.includes(deck.next('encourage')));
  assert.ok(P.lines.idle.includes(deck.next('unknown')));
});
