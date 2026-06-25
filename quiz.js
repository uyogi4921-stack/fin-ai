/* ═══════════════════════════════════════════════════════════
   FINVEST AI — quiz.js
   Duolingo-style gamified quiz: hearts, combo streak, progress
   bar, instant feedback with explanations, XP, sounds, results.
═══════════════════════════════════════════════════════════ */

'use strict';

var QZ = {
  on: false, qs: [], idx: 0, hearts: 5, combo: 0, bestCombo: 0,
  correct: 0, xp: 0, sel: -1, evaluated: false, lesson: null, placement: false, suspended: false
};
var QUIZ_LEN = 5;
var QUIZ_HEARTS = 3;
var PRAISE = ['Nice!', 'Boom!', 'Great!', 'On fire!', 'Sharp!', 'Smart!', 'Yes!', 'Crushing it!'];

// ─── SOUND (WebAudio, no assets) ─────────────────────────
var _ac = null;
function qSound(kind) {
  try {
    _ac = _ac || new (window.AudioContext || window.webkitAudioContext)();
    var seq = kind === 'good' ? [[660, 0], [880, 0.09]]
      : kind === 'win' ? [[660, 0], [880, 0.1], [1180, 0.2]]
      : [[200, 0]];
    seq.forEach(function (s) {
      var o = _ac.createOscillator(), g = _ac.createGain();
      o.type = kind === 'bad' ? 'sawtooth' : 'sine';
      o.frequency.value = s[0];
      o.connect(g); g.connect(_ac.destination);
      var t = _ac.currentTime + s[1];
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.12, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + (kind === 'bad' ? 0.25 : 0.16));
      o.start(t); o.stop(t + (kind === 'bad' ? 0.26 : 0.18));
    });
  } catch (e) {}
}

// ─── BUILD QUESTIONS ─────────────────────────────────────
function shuffle(a) {
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}

function buildQuestions(cat, n) {
  var pool = (window.QUIZ_BANK || []).filter(function (q) { return q.cat === cat; });
  if (pool.length < n) {
    var extra = (window.QUIZ_BANK || []).filter(function (q) { return q.cat !== cat; });
    pool = pool.concat(shuffle(extra));
  }
  pool = shuffle(pool.slice()).slice(0, n);
  return pool.map(normalizeQuestion);
}

// Normalise a bank entry into a runtime question, preserving the richer
// teaching fields (example, funFact, per-wrong-answer reasons) so the
// "Explain in detail" panel can use them.
function normalizeQuestion(q) {
  var base = { q: q.q, why: q.why || '', example: q.example || '', funFact: q.funFact || '', wrongWhy: q.wrongWhy || null };
  if (q.type === 'tf') {
    base.opts = [{ t: 'True', c: !!q.answer }, { t: 'False', c: !q.answer }];
    return base;
  }
  var opts = [{ t: q.correct, c: true }].concat(q.wrong.map(function (w) { return { t: w, c: false }; }));
  base.opts = shuffle(opts);
  return base;
}

// ─── OVERLAY (built once) ────────────────────────────────
function ensureQuizDom() {
  if (document.getElementById('quizOv')) return;
  var ov = document.createElement('div');
  ov.className = 'quiz-ov'; ov.id = 'quizOv';
  ov.innerHTML =
    '<div class="quiz-shell">'
    + '<div class="quiz-top"><button class="quiz-x" onclick="closeQuiz()">&#10005;</button>'
    + '<div class="quiz-bar"><div class="quiz-fill" id="qzFill"></div></div>'
    + '<div class="quiz-hearts" id="qzHearts"></div></div>'
    + '<div class="quiz-stage" id="qzStage"></div>'
    + '<div class="quiz-foot" id="qzFoot"></div>'
    // In-quiz explanation layer — slides over the shell WITHOUT tearing down
    // the quiz, so closing it returns the user to the exact same question.
    + '<div class="qz-explain-layer" id="qzExplainLayer">'
    + '<div class="qz-explain-card" id="qzExplainCard"></div></div>'
    + '</div>';
  document.body.appendChild(ov);
}

// ─── START / RENDER ──────────────────────────────────────
function startQuiz(lesson) {
  ensureQuizDom();
  QZ.lesson = lesson || null;
  QZ.qs = buildQuestions(lesson ? lesson.cat : 'basics', QUIZ_LEN);
  QZ.idx = 0; QZ.hearts = QUIZ_HEARTS; QZ.combo = 0; QZ.bestCombo = 0;
  QZ.correct = 0; QZ.xp = 0; QZ.sel = -1; QZ.evaluated = false; QZ.on = true; QZ.placement = false;
  if (typeof closeModal === 'function') closeModal(); // close lesson modal if open
  document.getElementById('quizOv').classList.add('on');
  document.body.style.overflow = 'hidden';
  renderQ();
}

function renderHearts() {
  if (QZ.placement) { document.getElementById('qzHearts').innerHTML = '<span class="qz-place">&#129517; Placement</span>'; return; }
  var h = '';
  for (var i = 0; i < QUIZ_HEARTS; i++) h += '<span class="qz-heart' + (i < QZ.hearts ? '' : ' lost') + '">&#10084;</span>';
  document.getElementById('qzHearts').innerHTML = h;
}

function renderQ() {
  QZ.sel = -1; QZ.evaluated = false;
  closeExplain();
  var q = QZ.qs[QZ.idx];
  document.getElementById('qzFill').style.width = Math.round(QZ.idx / QZ.qs.length * 100) + '%';
  renderHearts();
  var combo = QZ.combo >= 2 ? '<div class="qz-combo">&#128293; ' + QZ.combo + ' in a row!</div>' : '';
  var stage = document.getElementById('qzStage');
  stage.className = 'quiz-stage';
  stage.innerHTML = combo
    + '<div class="qz-step">Question ' + (QZ.idx + 1) + ' of ' + QZ.qs.length + '</div>'
    + '<div class="qz-q">' + q.q + '</div>'
    + '<div class="qz-opts">' + q.opts.map(function (o, i) {
        return '<button class="qz-opt" data-i="' + i + '" onclick="quizSelect(' + i + ')">' + o.t + '</button>';
      }).join('') + '</div>';
  document.getElementById('qzFoot').innerHTML =
    '<div class="qz-fb" id="qzFb"></div>'
    + '<button class="qz-check" id="qzCheck" disabled onclick="quizCheck()">Check</button>';
}

function quizSelect(i) {
  if (QZ.evaluated) return;
  QZ.sel = i;
  document.querySelectorAll('.qz-opt').forEach(function (b) { b.classList.toggle('sel', +b.dataset.i === i); });
  document.getElementById('qzCheck').disabled = false;
}

function quizCheck() {
  if (!QZ.evaluated) {
    if (QZ.sel < 0) return;
    QZ.evaluated = true;
    var q = QZ.qs[QZ.idx];
    var ok = q.opts[QZ.sel].c;
    document.querySelectorAll('.qz-opt').forEach(function (b) {
      var oi = +b.dataset.i;
      b.disabled = true;
      if (q.opts[oi].c) b.classList.add('right');
      else if (oi === QZ.sel) b.classList.add('wrong');
    });
    var fb = document.getElementById('qzFb');
    var check = document.getElementById('qzCheck');
    if (ok) {
      QZ.correct++; QZ.combo++; QZ.bestCombo = Math.max(QZ.bestCombo, QZ.combo);
      var gain = 5 + Math.min(5, QZ.combo - 1);
      QZ.xp += gain;
      fb.className = 'qz-fb good on';
      var praise = QZ.combo >= 3 ? 'On fire!' : PRAISE[Math.floor(Math.random() * PRAISE.length)];
      fb.innerHTML = '<b>&#9989; ' + praise + '</b> +' + gain + ' XP' + (QZ.combo >= 2 ? ' · &#128293; x' + QZ.combo : '')
        + (q.why ? '<div class="qz-why">' + q.why + '</div>' : '');
      qSound(QZ.combo >= 3 ? 'win' : 'good');
    } else {
      QZ.combo = 0; QZ.hearts--;
      renderHearts();
      var correctTxt = q.opts.filter(function (o) { return o.c; })[0].t;
      fb.className = 'qz-fb bad on';
      fb.innerHTML = '<b>&#10060; Answer:</b> ' + correctTxt + (q.why ? '<div class="qz-why">' + q.why + '</div>' : '');
      qSound('bad');
      var stage = document.getElementById('qzStage');
      stage.classList.add('shake');
      setTimeout(function () { stage.classList.remove('shake'); }, 400);
    }
    fb.innerHTML += '<button class="qz-explain" onclick="quizExplain()">&#128172; Explain in detail</button>';
    check.textContent = (QZ.idx + 1 >= QZ.qs.length) ? 'Finish' : 'Continue';
    check.className = 'qz-check ' + (ok ? 'good' : 'bad');
    check.disabled = false;
  } else {
    if (QZ.hearts <= 0) { failQuiz(); return; }
    QZ.idx++;
    if (QZ.idx >= QZ.qs.length) finishQuiz();
    else renderQ();
  }
}

// ─── PLACEMENT TEST (onboarding) ─────────────────────────
function buildPlacement() {
  var bank = window.QUIZ_BANK || [];
  var pickFrom = function (cats, n) {
    return shuffle(bank.filter(function (q) { return cats.indexOf(q.cat) !== -1; }).slice()).slice(0, n);
  };
  var chosen = [].concat(pickFrom(['basics'], 2), pickFrom(['stocks', 'risk'], 2), pickFrom(['strategy', 'advanced'], 2));
  return chosen.map(normalizeQuestion);
}

function startPlacement() {
  ensureQuizDom();
  QZ.lesson = null; QZ.placement = true; QZ.qs = buildPlacement();
  QZ.idx = 0; QZ.hearts = 99; QZ.combo = 0; QZ.bestCombo = 0;
  QZ.correct = 0; QZ.xp = 0; QZ.sel = -1; QZ.evaluated = false; QZ.on = true;
  document.getElementById('quizOv').classList.add('on');
  document.body.style.overflow = 'hidden';
  renderQ();
}

function finishPlacement() {
  var n = QZ.qs.length;
  var level = QZ.correct >= 5 ? 'Advanced' : QZ.correct >= 3 ? 'Intermediate' : 'Beginner';
  var label = level === 'Advanced' ? 'Expert' : level;
  if (window.userProfile) { userProfile.placement = level; Store.set('profile', userProfile); }
  if (typeof renderLessons === 'function') renderLessons();
  qSound('win');
  document.getElementById('qzFill').style.width = '100%';
  document.getElementById('qzHearts').innerHTML = '';
  document.getElementById('qzStage').className = 'quiz-stage';
  document.getElementById('qzStage').innerHTML =
    '<div class="qz-result"><div class="qz-result-ic">&#129517;</div>'
    + '<div class="qz-result-t">You’re ' + label + '!</div>'
    + '<div class="qz-result-sub">Scored ' + QZ.correct + '/' + n + '. We unlocked the <b>' + label + '</b> track for you — you can still explore everything.</div></div>';
  document.getElementById('qzFoot').innerHTML =
    '<button class="qz-check good" onclick="closeQuiz();navTo(\'learn\',document.querySelector(\'.tn-link[data-page=learn]\'))">Start learning &#8594;</button>';
}

function finishQuiz() {
  if (QZ.placement) { finishPlacement(); return; }
  document.getElementById('qzFill').style.width = '100%';
  var total = QZ.qs.length;
  var pct = Math.round(QZ.correct / total * 100);
  var perfect = QZ.correct === total;
  var bonus = perfect ? 15 : 0;
  var lessonXp = 0;

  // Complete the lesson + award XP
  if (QZ.lesson && typeof completedL !== 'undefined' && !completedL.has(QZ.lesson.id)) {
    completedL.add(QZ.lesson.id);
    Store.set('completedLessons', Array.from(completedL));
    lessonXp = QZ.lesson.xp || 0;
  }
  var totalXpGain = QZ.xp + bonus + lessonXp;
  if (typeof addXP === 'function') addXP(totalXpGain, '');
  if (typeof renderLessons === 'function') renderLessons();
  qSound('win');

  var emoji = perfect ? '&#127942;' : pct >= 60 ? '&#127881;' : '&#128170;';
  var msg = perfect ? 'Flawless!' : pct >= 60 ? 'Well done!' : 'Keep practicing!';
  document.getElementById('qzStage').className = 'quiz-stage';
  document.getElementById('qzStage').innerHTML =
    '<div class="qz-result">'
    + '<div class="qz-result-ic">' + emoji + '</div>'
    + '<div class="qz-result-t">' + msg + '</div>'
    + '<div class="qz-result-stats">'
    + '<div class="qz-rs"><div class="qz-rs-v">' + QZ.correct + '/' + total + '</div><div class="qz-rs-l">Correct</div></div>'
    + '<div class="qz-rs"><div class="qz-rs-v">' + pct + '%</div><div class="qz-rs-l">Accuracy</div></div>'
    + '<div class="qz-rs"><div class="qz-rs-v">&#128293; ' + QZ.bestCombo + '</div><div class="qz-rs-l">Best combo</div></div>'
    + '</div>'
    + '<div class="qz-result-xp">+' + totalXpGain + ' XP earned</div>'
    + '</div>';
  document.getElementById('qzHearts').innerHTML = '';
  document.getElementById('qzFoot').innerHTML = '<button class="qz-check good" onclick="closeQuiz()">Continue</button>';
}

function failQuiz() {
  document.getElementById('qzStage').className = 'quiz-stage';
  document.getElementById('qzStage').innerHTML =
    '<div class="qz-result">'
    + '<div class="qz-result-ic">&#128148;</div>'
    + '<div class="qz-result-t">Out of hearts!</div>'
    + '<div class="qz-result-sub">You got ' + QZ.correct + ' right. Review the lesson and try again.</div>'
    + '</div>';
  document.getElementById('qzHearts').innerHTML = '';
  document.getElementById('qzFoot').innerHTML =
    '<button class="qz-check" onclick="closeQuiz()">Back</button>'
    + '<button class="qz-check good" onclick="startQuiz(QZ.lesson)">Try again</button>';
}

// Show a detailed explanation IN PLACE, layered over the quiz. The quiz state
// is never touched, so closing the explanation returns the user to the exact
// same question with the same progress, hearts and combo intact.
function quizExplain() {
  var q = QZ.qs[QZ.idx];
  if (!q) return;
  var correct = q.opts.filter(function (o) { return o.c; })[0];
  var wrongs = q.opts.filter(function (o) { return !o.c; });

  var html = '<div class="qz-ex-head">&#128161; Explanation</div>'
    + '<div class="qz-ex-q">' + q.q + '</div>'
    + '<div class="qz-ex-correct"><span class="qz-ex-tick">&#10003;</span> <b>' + correct.t + '</b></div>'
    + (q.why ? '<div class="qz-ex-why">' + q.why + '</div>' : '');

  // Why each other option is wrong
  if (wrongs.length) {
    html += '<div class="qz-ex-sub">Why the other options are wrong</div>';
    html += wrongs.map(function (o) {
      var reason = (q.wrongWhy && q.wrongWhy[o.t]) ? q.wrongWhy[o.t] : 'This doesn’t match the definition above — re-read the correct answer to see the difference.';
      return '<div class="qz-ex-wrong"><span class="qz-ex-cross">&#10007;</span> <b>' + o.t + '</b> — ' + reason + '</div>';
    }).join('');
  }

  if (q.example) html += '<div class="qz-ex-box qz-ex-eg"><b>&#128202; Example:</b> ' + q.example + '</div>';
  if (q.funFact) html += '<div class="qz-ex-box qz-ex-fact"><b>&#129504; Did you know?</b> ' + q.funFact + '</div>';

  html += '<div class="qz-ex-actions">'
    + '<button class="qz-ex-fin" onclick="quizAskFin()">Ask Fin for more &#8594;</button>'
    + '<button class="qz-ex-back" onclick="closeExplain()">Back to question</button>'
    + '</div>';

  document.getElementById('qzExplainCard').innerHTML = html;
  document.getElementById('qzExplainLayer').classList.add('on');
}

// Hide the explanation layer — the quiz beneath is exactly as the user left it.
function closeExplain() {
  var layer = document.getElementById('qzExplainLayer');
  if (layer) layer.classList.remove('on');
}

// Optional deeper dive via Fin. The quiz stays open underneath; the explanation
// layer is simply hidden, so the user can return to it / the question after.
function quizAskFin() {
  var q = QZ.qs[QZ.idx];
  if (!q) return;
  var correct = q.opts.filter(function (o) { return o.c; })[0].t;
  closeExplain();
  // Suspend (not close) the quiz so Fin is visible above it; closeAI() restores
  // the quiz exactly where it was, so the user never loses their place.
  QZ.suspended = true;
  var ov = document.getElementById('quizOv');
  if (ov) ov.classList.remove('on');
  if (typeof openAI === 'function') {
    openAI();
    setTimeout(function () {
      if (typeof qs === 'function') qs('Explain this in detail with an example: "' + q.q + '" The correct answer is "' + correct + '". Why is that right and the others wrong?');
    }, 280);
  }
}

// Called by closeAI() — if the quiz was suspended to consult Fin, bring it back.
function resumeQuizIfSuspended() {
  if (!QZ.suspended) return false;
  QZ.suspended = false;
  var ov = document.getElementById('quizOv');
  if (ov) ov.classList.add('on');
  document.body.style.overflow = 'hidden';
  return true;
}

function closeQuiz() {
  QZ.on = false; QZ.suspended = false;
  closeExplain();
  var ov = document.getElementById('quizOv');
  if (ov) ov.classList.remove('on');
  document.body.style.overflow = '';
}
