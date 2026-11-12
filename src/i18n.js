/* Local, reviewed translations. No text or personal data is sent to a translation service. */
(function(){
 const dictionary=window.FLORECIENDO_EN||{};
 const normalize=s=>s.replace(/\s+/g,' ').trim();
 function english(source){
  const s=normalize(source);
  if(Object.prototype.hasOwnProperty.call(dictionary,s))return dictionary[s];
  let m;
  if(s.startsWith("Ver carta y foto: "))return "View letter and photo: "+s.slice(18);
  if(s.startsWith("Leer carta original: "))return "Read original letter: "+s.slice(21);
  if(s.startsWith("Foto de ")&&!s.startsWith("Foto de la carta original de "))return "Photo of "+s.slice(8);
  if((m=s.match(/^Quedan (\d+) días$/)))return `${m[1]} days left`;
  if(s==='Queda 1 día')return '1 day left';
  if((m=s.match(/^A (\d+) niños todavía les faltan regalos$/)))return `${m[1]} children still need gifts`;
  if(s==='A 1 niño todavía le faltan regalos')return '1 child still needs gifts';
  if((m=s.match(/^(\d+) años?$/)))return `${m[1]} ${m[1]==='1'?'year':'years'} old`;
  if((m=s.match(/^Talla: (.+)$/)))return 'Size: '+english(m[1]);
  if((m=s.match(/^Color: (.+)$/)))return 'Color: '+english(m[1]);
  if((m=s.match(/^talla (.+)$/)))return 'size '+english(m[1]);
  if((m=s.match(/^Mi avance para (Ropa|Juguete) de (.+)$/)))return `My progress for ${m[1]==='Ropa'?'clothing':'a toy'} for ${m[2]}`;
  if((m=s.match(/^No pudimos enviar tu pregunta\. (.+)$/)))return "We couldn't send your question. "+english(m[1]);
  if((m=s.match(/^(La carta de|Carta original de|Foto de la carta original de|Ver carta original de|Mi avance para) (.+)$/))){const prefix={'La carta de':'Letter from','Carta original de':'Original letter from','Foto de la carta original de':'Photo of the original letter from','Ver carta original de':'View the original letter from','Mi avance para':'My progress for'};return prefix[m[1]]+' '+m[2]}
  if((m=s.match(/^Un regalo para (.+)$/)))return 'A gift for '+m[1];
  if((m=s.match(/^Todavía podemos buscar otra forma de acompañar a (.+)\.$/)))return `We can still find another way to support ${m[1]}.`;
  if((m=s.match(/^Quiero liberar (ropa|juguete)$/)))return 'Release my '+(m[1]==='ropa'?'clothing gift':'toy gift');
  if((m=s.match(/^Me comprometo a entregar (.+) nuevos y etiquetados con el nombre de (.+) hasta el 9 de diciembre\.$/)))return `I commit to delivering new ${m[1].replace('ropa','clothing').replace('juguete','a toy').replace(' y ',' and ')}, labeled with ${m[2]}'s name, by December 9.`;
  if((m=s.match(/^Entrega: (.+)\. Etiqueta:$/)))return `Drop-off: ${m[1]}. Gift label:`;
  if((m=s.match(/^Partes liberadas: (.+)\.$/)))return 'Released gifts: '+m[1].replace('Ropa','Clothing').replace('Juguete','Toy')+'.';
  if((m=s.match(/^(\d+) niños con regalos por recibir en total$/)))return `${m[1]} children still awaiting gifts in total`;
  if((m=s.match(/^(\d+) regalos de ropa por recibir en total$/)))return `${m[1]} clothing gifts still to receive in total`;
  if((m=s.match(/^(\d+) juguetes por recibir en total$/)))return `${m[1]} toys still to receive in total`;
  if((m=s.match(/^(\d+) por responder$/)))return `${m[1]} awaiting a reply`;
  if((m=s.match(/^Preguntas por responder: (\d+) ↓$/)))return `Questions awaiting replies: ${m[1]} ↓`;
  if((m=s.match(/^Camiseta y pantalón cómodos(.*)$/)))return 'Comfortable shirt and pants'+m[1].replace('talla','size');
  if((m=s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4}), (.+)$/))){const months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];return `${months[Number(m[2])-1]} ${m[1]}, ${m[3]}, ${m[4].replace('a. m.','AM').replace('p. m.','PM')} (Bogotá)`}
  if(s.includes(' · '))return s.split(' · ').map(english).join(' · ');
  return source;
 }
 window.translateCopy=english;
 if(typeof document==='undefined')return;
 const texts=new WeakMap(),attributes=new WeakMap(),links=new WeakMap();
 let language='es';
 try{const requested=new URLSearchParams(location.search).get('lang');language=requested==='en'||requested==='es'?requested:localStorage.getItem('floreciendo-language')==='en'?'en':'es'}catch{}
 function excluded(element){return element?.closest('script,style,textarea,[data-no-translate],.question-text')}
 function text(node){
  if(!node.nodeValue.trim()||excluded(node.parentElement))return;
  let record=texts.get(node);
  if(!record||node.nodeValue!==record.last)record={source:node.nodeValue};
  const translated=language==='en'?english(record.source):record.source;
  const next=translated===record.source?record.source:record.source.match(/^\s*/)[0]+translated+record.source.match(/\s*$/)[0];
  record.last=next;texts.set(node,record);
  if(node.nodeValue!==next)node.nodeValue=next;
 }
 function attrs(element){
  if(excluded(element))return;
  const records=attributes.get(element)||{};
  for(const key of ['aria-label','alt','placeholder','title']){
   const current=element.getAttribute(key);if(current===null)continue;
   let record=records[key];if(!record||current!==record.last)record={source:current};
   const next=language==='en'?english(record.source):record.source;record.last=next;records[key]=record;
   if(current!==next)element.setAttribute(key,next);
  }
  attributes.set(element,records);
 }
 function apply(){
  document.documentElement.lang=language;
  const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let node;
  // Preserve option values even when the displayed label changes languages.
  document.querySelectorAll('option').forEach(option=>{if(!option.hasAttribute('value'))option.value=texts.get(option.firstChild)?.source||option.textContent});
  while((node=walker.nextNode()))text(node);
  document.querySelectorAll('[aria-label],[alt],[placeholder],[title]').forEach(attrs);
  document.querySelectorAll('a[href^="https://wa.me/"]').forEach(link=>{
   const current=link.getAttribute('href');let record=links.get(link);
   if(!record||current!==record.last)record={source:current};
   const url=new URL(record.source),message=url.searchParams.get('text');
   if(message&&language==='en')url.searchParams.set('text',english(message));
   const next=language==='en'?url.toString():record.source;
   record.last=next;links.set(link,record);if(current!==next)link.setAttribute('href',next);
  });
  document.querySelectorAll('[data-site-language]').forEach(selector=>selector.value=language);
  document.title=language==='en'?'A Christmas in bloom · Floreciendo con Amor':'Una Navidad para florecer · Floreciendo con Amor';
 }
 window.setSiteLanguage=value=>{
  language=value==='en'?'en':'es';try{localStorage.setItem('floreciendo-language',language);const url=new URL(location.href);url.searchParams.set('lang',language);history.replaceState(null,'',url)}catch{}
  apply();
 };
 document.querySelectorAll('[data-site-language]').forEach(selector=>selector.addEventListener('change',event=>window.setSiteLanguage(event.target.value)));
 apply();
 new MutationObserver(()=>apply()).observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['aria-label','alt','placeholder','title']});
})();
