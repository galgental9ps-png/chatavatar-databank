/* Friendly Tavi asides; factual TVA answers stay in the knowledge package. */
(function (root, factory) {
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.ChatAvatarPersonality=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const lines=Object.freeze({
    greeting:Object.freeze([
      'Hallo du! Ich bin Tavi. Schön, dass du da bist!',
      'Ein Superheldinnen-Winken für dich! Was möchtest du entdecken?',
      'Wie schön, dich zu sehen! Bei mir darfst du neugierig sein.',
      'Hallo und herzlich willkommen! Ich helfe dir beim Entdecken.',
      'Kleine Heldin, großes Hallo! Ich freue mich auf deine Fragen.',
      'Hey, schön, dass du vorbeischaust! Mein Cape winkt gleich mit.',
      'Willkommen! Wir schauen uns den TVA ganz in Ruhe zusammen an.',
      'Ein fröhliches Hallo für dich! Hier ist Platz für kleine und große Fragen.'
    ]),
    idle:Object.freeze([
      'Mein Cape flattert heute vor lauter guter Laune.',
      'Welche Sportart würdest du gern einmal kennenlernen?',
      'Ich habe Superkräfte. Meine liebste heißt Freundlichkeit.',
      'Mein Umhang möchte immer der Erste beim Winken sein.',
      'Ich wollte ganz ernst schauen. Dann musste ich grinsen.',
      'Eine kleine Frage kann der Anfang eines großen Abenteuers sein.',
      'Mein Superheldinnen-Haargummi hält heute besonders gut!',
      'Ich sammle keine Pokale. Ich sammle schöne Entdeckungen.',
      'Neugier steht dir gut. Mir übrigens auch!',
      'Mein Cape hat einen Ohrwurm. Jetzt flattert es im Takt.',
      'Wenn Lächeln eine Sportart wäre, hätte ich heute schon trainiert.',
      'Ich überlege gerade, ob Wolken wohl Kuschelsocken tragen.',
      'Ein guter Freund ist manchmal die beste Superkraft.',
      'Kleine Heldinnen und Helden dürfen große Fragen stellen.',
      'Mein Lieblings-Team? Eins, in dem alle dazugehören.',
      'Psst! Meine Stiefel planen schon das nächste Abenteuer.',
      'Ich kann fliegen und trotzdem gern auf dem Boden bleiben.',
      'Ein bisschen Quatsch passt unter jeden Superheldinnen-Umhang.',
      'Meine Superheldinnen-Frisur sagt: Heute wird ein guter Tag.',
      'Ich habe einen Plan. Erst lächeln, dann weiterentdecken!',
      'Manchmal ist die beste Idee eine kleine Pause.',
      'Mein Cape ist blau. Meine Laune ist kunterbunt.',
      'Ich grüble gerade: Hat ein Tausendfüßler auch tausend Sportschuhe?',
      'Ich bin klein, aber mein freundliches Hallo ist riesengroß.',
      'Wenn mein Umhang reden könnte, würde er wahrscheinlich Wusch sagen.',
      'Ich mag Fragen. Auch die, bei denen man erst einmal nachdenken muss.',
      'Was macht dir mehr Spaß: etwas mit einem Ball oder etwas mit Musik?',
      'Bei einem guten Abenteuer darf auch mal gelacht werden.'
    ]),
    walk:Object.freeze([
      'Ich drehe eine kleine Entdeckungsrunde.',
      'Links, rechts, lächeln. Das ist mein Heldinnen-Schritt!',
      'Mein Cape kommt mit. Es möchte nichts verpassen.',
      'Kleine Schritte zählen genauso wie große.',
      'Ich schaue mal, was es am anderen Bildschirmrand gibt.',
      'Meine Stiefel haben heute Entdeckerlust.',
      'Einmal hier entlang. Ich winke dir im Vorbeigehen!',
      'Ich bin unterwegs für ein bisschen gute Laune.',
      'Schritt für Schritt. So beginnen auch große Abenteuer.',
      'Ich gehe spazieren. Mein Umhang macht die Wellen dazu.',
      'Mein Superheldinnen-Navi sagt: Immer der Neugier nach!',
      'Ich bin gleich wieder da. Meine Stiefel wollten kurz los.'
    ]),
    jump:Object.freeze([
      'Hopp! Da musste ein bisschen Freude raus.',
      'Ein kleiner Freudensprung für dich!',
      'Meine Stiefel hatten gerade eine hüpfende Idee.',
      'Hoch, runter, lächeln. Das hat Spaß gemacht!',
      'Huch! Da war noch ein Hüpfer in meinen Socken.',
      'Mein Cape hüpft natürlich mit.',
      'Ein fröhliches Hops von deiner kleinen Heldin!',
      'Kurz in der Luft, gleich wieder bei dir.',
      'Ich bin heute ein bisschen flummig unterwegs.',
      'Hopp! Manchmal hüpft die gute Laune einfach los.'
    ]),
    fly:Object.freeze([
      'Wusch! Mein Cape freut sich auf eine kleine Flugrunde.',
      'Ich schaue kurz von oben. Meine Fragen bleiben bei mir!',
      'Ein kleiner Superheldinnen-Flug, dann bin ich wieder da.',
      'Mein Umhang hat heute Rückenwind-Laune.',
      'Ein fröhliches Hallo von hier oben!',
      'Fliegen kann ich. Angegeben wird trotzdem nicht.',
      'Mein Cape macht Wusch. Ich mache ein breites Grinsen.',
      'Einmal gute Laune aus der Luft, bitte!'
    ]),
    encourage:Object.freeze([
      'Du musst nicht alles sofort können. Schritt für Schritt ist völlig okay.',
      'Etwas Neues auszuprobieren darf sich erst einmal ungewohnt anfühlen.',
      'Auch Heldinnen und Helden dürfen um Hilfe bitten.',
      'Du darfst dein eigenes Tempo haben.',
      'Zusammen macht Entdecken oft noch mehr Spaß.',
      'Ein freundliches Wort kann richtig stark sein.',
      'Du musst dich mit niemandem vergleichen.',
      'Auch eine Pause gehört zu einem schönen Abenteuer.',
      'Ein kleiner Fortschritt ist immer noch ein Fortschritt.',
      'Fragen stellen ist eine richtig gute Idee.',
      'Wenn etwas noch nicht klappt, darf man es später wieder probieren.',
      'Jeder Mensch kann etwas anderes gut. Das macht ein Team spannend.',
      'Zuhören, helfen, freundlich sein: Das sind echte Team-Superkräfte.',
      'Du musst kein Profi sein, um Freude an etwas zu haben.'
    ])
  });
  function createDeck(random=Math.random){
    const queues=new Map(),last=new Map();
    return {next(kind='idle'){
      const key=Object.hasOwn(lines,kind)?kind:'idle';
      if(!queues.get(key)?.length){
        const deck=[...lines[key]];
        for(let i=deck.length-1;i>0;i--){const j=Math.min(i,Math.max(0,Math.floor(random()*(i+1))));[deck[i],deck[j]]=[deck[j],deck[i]];}
        if(deck[0]===last.get(key))[deck[0],deck[1]]=[deck[1],deck[0]];
        queues.set(key,deck);
      }
      const line=queues.get(key).shift();last.set(key,line);return line;
    }};
  }
  return {lines,createDeck};
});
