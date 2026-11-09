function questionDate(value){return new Date(value).toLocaleString('es-CO',{timeZone:'America/Bogota',dateStyle:'medium',timeStyle:'short'})}
function sponsorQuestionSection(childId,rows,canAsk){
 const list=rows.filter(q=>q.child_id===childId);
 return `<section class="questions-panel" id="questions-${childId}" aria-label="Preguntas para la fundación"><h4>¿Una duda sobre la talla o sus gustos?</h4><p>Escríbenos aquí. Te responderemos en este mismo espacio.</p><p class="micro">No enviamos avisos por correo. Vuelve a Mi rincón para revisar tu respuesta.</p><button class="quiet" type="button" onclick="refreshQuestions('${childId}')">Actualizar respuestas ↻</button><div class="question-history">${list.length?list.map(q=>`<article class="question-item"><span class="badge">${q.answer?'Respondida':'Pendiente de respuesta'}</span><p class="micro">${esc(questionDate(q.created_at))}</p><strong>Tu pregunta</strong><p class="question-text">${esc(q.question)}</p>${q.answer?`<div class="question-answer"><strong>Floreciendo con Amor</strong><p class="question-text">${esc(q.answer)}</p><small>${esc(questionDate(q.answered_at))}</small></div>`:'<p class="micro">Ya recibimos tu pregunta. El equipo la revisará aquí.</p>'}</article>`).join(''):'<p class="micro">¿No sabes qué talla elegir o quieres conocer mejor sus gustos? Te ayudamos.</p>'}</div>${canAsk?`<form onsubmit="sendQuestion(event,'${childId}')"><label for="ask-${childId}">Tu pregunta<textarea id="ask-${childId}" name="question" rows="3" maxlength="1500" required placeholder="Por ejemplo: ¿la talla 12 es para camiseta y pantalón?"></textarea></label><button class="btn outline" type="submit">Enviar pregunta</button></form>`:''}<p class="micro" role="status" id="question-status-${childId}"></p></section>`;
}
async function refreshQuestions(childId){await showPortal();document.getElementById('questions-'+childId)?.scrollIntoView({block:'nearest'})}
async function sendQuestion(event,childId){
 event.preventDefault();const form=event.currentTarget,button=form.querySelector('button'),status=$('question-status-'+childId);
 const question=new FormData(form).get('question').trim();
 if(!question){status.textContent='Escribe tu pregunta para que podamos ayudarte.';return}
 button.disabled=true;status.textContent='Enviando…';
 try{await api('/rest/v1/sponsor_questions',{method:'POST',body:{child_id:childId,sponsor_id:user.id,question},headers:{Prefer:'return=representation'}});await refreshQuestions(childId);$('question-status-'+childId).textContent='¡Pregunta enviada! Puedes volver aquí para ver nuestra respuesta.'}
 catch(e){status.textContent='No pudimos enviar tu pregunta. '+e.message}
 finally{button.disabled=false}
}
function staffQuestionSection(rows,profiles){
 const pending=rows.filter(q=>!q.answer).length;
 const ordered=[...rows].sort((a,b)=>Number(!!a.answer)-Number(!!b.answer)||new Date(b.created_at)-new Date(a.created_at));
 return `<section class="questions-panel" id="staff-questions"><h3>Preguntas de los padrinos <span class="badge">${pending} por responder</span></h3><p class="micro">Responde aquí. El padrino verá tu mensaje en Mi rincón, sin correo.</p>${ordered.length?ordered.map(q=>{const p=people.find(p=>p.uuid===q.child_id),profile=profiles.find(p=>p.user_id===q.sponsor_id);return `<details class="staff-question" ${!q.answer?'open':''}><summary>${esc(p?.name||'Perfil')} · ${esc(profile?.full_name||'Padrino')} · ${q.answer?'Respondida':'Pendiente'}</summary><p class="micro">${esc(questionDate(q.created_at))}</p><p class="question-text">${esc(q.question)}</p><form onsubmit="answerQuestion(event,'${q.id}')"><label for="answer-${q.id}">Tu respuesta<textarea id="answer-${q.id}" name="answer" rows="3" maxlength="3000" required>${esc(q.answer||'')}</textarea></label><button class="btn" type="submit">${q.answer?'Guardar respuesta':'Enviar respuesta'}</button><p class="micro" role="status" id="answer-status-${q.id}"></p></form></details>`}).join(''):'<p>Por ahora no hay preguntas. Las nuevas aparecerán aquí.</p>'}</section>`;
}
async function answerQuestion(event,id){
 event.preventDefault();const form=event.currentTarget,button=form.querySelector('button'),status=$('answer-status-'+id),answer=new FormData(form).get('answer').trim();
 if(!answer){status.textContent='Escribe una respuesta antes de enviarla.';return}
 button.disabled=true;status.textContent='Guardando…';
 try{const updated=await api('/rest/v1/sponsor_questions?id=eq.'+id,{method:'PATCH',body:{answer,answered_at:new Date().toISOString(),answered_by:user.id},headers:{Prefer:'return=representation'}});if(!updated?.length)throw Error('No pudimos guardar esta respuesta. Actualiza e intenta de nuevo.');await showStaff();$('staff-questions')?.scrollIntoView({block:'start'});$('answer-status-'+id).textContent='Respuesta guardada. El padrino ya puede verla en Mi rincón.'}
 catch(e){status.textContent='No pudimos guardar la respuesta. '+e.message}
 finally{button.disabled=false}
}
