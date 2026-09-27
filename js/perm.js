/* Разрешения на микрофон и камеру.
   Системный запрос не должен появляться неожиданно: до него ученик видит,
   зачем нужен датчик и что запись никуда не уходит. А отказ — не тупик:
   объясняем, как вернуть доступ, и предлагаем опыт, которому датчик не нужен. */

window.A = window.A || {};

(function (A) {
  'use strict';

  var h = A.h;

  var WHY = {
    mic: 'Для этого опыта QaltaLab использует микрофон, чтобы измерить частоту звука. Запись никуда не отправляется — звук разбирается прямо на устройстве.',
    camera: 'Для этого опыта QaltaLab использует заднюю камеру и вспышку, чтобы по яркости пальца поймать удары пульса. Видео никуда не отправляется и не сохраняется.'
  };

  var ERR = {
    mic: {
      blocked: ['Микрофон заблокирован', 'Открой настройки сайта (значок замка слева от адреса) → Микрофон → Разрешить. Потом нажми «Попробовать снова».'],
      missing: ['Микрофон недоступен', 'На этом устройстве не нашёлся микрофон, или его сейчас занимает другое приложение.'],
      unsupported: ['Браузер не умеет слушать микрофон', 'Открой qaltalab.site в Chrome или Safari. Во встроенных браузерах мессенджеров микрофон часто отключён.']
    },
    camera: {
      blocked: ['Камера заблокирована', 'Открой настройки сайта (значок замка слева от адреса) → Камера → Разрешить. Потом нажми «Попробовать снова».'],
      missing: ['Камера недоступна', 'На этом устройстве не нашлась подходящая камера, или её сейчас занимает другое приложение.'],
      unsupported: ['Браузер не умеет работать с камерой', 'Открой qaltalab.site в Chrome или Safari. Во встроенных браузерах мессенджеров камера часто отключена.']
    }
  };

  // Опыты, которым не нужен ни один датчик, кроме экрана.
  var FALLBACK = ['timing', 'hick'];

  function kindOf(err) {
    var n = err && err.name;
    if (n === 'Unsupported') return 'unsupported';
    if (n === 'NotAllowedError' || n === 'SecurityError' || n === 'PermissionDeniedError') return 'blocked';
    return 'missing';
  }

  function note(sensor) {
    return h('div.perm', [
      h('div.perm__ic', [A.icon(sensor === 'camera' ? 'heart' : 'wave')]),
      h('div.perm__t', [WHY[sensor]])
    ]);
  }

  // Короткое честное предупреждение: образовательный опыт, не диагностика.
  function caveat(text) {
    return h('div.perm.perm--info', [
      h('div.perm__ic', [A.icon('quest')]),
      h('div.perm__t', [text])
    ]);
  }

  function errorBox() {
    var el = h('div.permerr', { role: 'alert' });
    el.hidden = true;
    var last = null;

    function paint() {
      A.u.clear(el);
      if (!last) { el.hidden = true; return; }
      var txt = ERR[last.sensor][last.kind];
      el.hidden = false;
      el.appendChild(h('b.permerr__h', [txt[0]]));
      el.appendChild(h('p.permerr__d', [txt[1]]));
      var row = h('div.permerr__row');
      if (last.kind !== 'unsupported') {
        row.appendChild(h('button.btn.btn--primary', { type: 'button', onclick: function () { var f = last.retry; hide(); f(); } }, ['Попробовать снова']));
      }
      el.appendChild(row);
      var alt = h('div.permerr__alt', [h('span', ['Пока можно пройти опыт без датчиков:'])]);
      FALLBACK.forEach(function (id) {
        var lab = A.lab.byId(id);
        if (lab) alt.appendChild(h('button.linkbtn', { type: 'button', onclick: function () { A.app.go('lab:' + id); } }, [lab.title]));
      });
      el.appendChild(alt);
    }

    function show(sensor, err, retry) {
      last = { sensor: sensor, kind: kindOf(err), retry: retry };
      paint();
    }
    function hide() { last = null; paint(); }

    return { el: el, show: show, hide: hide, translate: paint };
  }

  A.perm = { note: note, caveat: caveat, errorBox: errorBox };
})(window.A);
