/* scene.js - the pinned "one cup, five chapters" scene on the Our Story page (desktop).
   One cup assembles as you scroll: leaf -> fire and water -> pearls -> ice, milk, lid, shake -> the finished drink.
   The existing chapter artwork becomes the emblem in the corner of the stage; the existing copy writes itself in beside it.
   It uses GSAP (core only) to author one timeline. story.js owns the scroll loop and calls update(); nothing here listens to scroll.
   If GSAP is missing, story.js never mounts this and the page keeps the stacked-cards layout. */
(() => {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const CUP = 'M155 170H325L308 392C307 401 300 408 291 408H189C180 408 173 401 172 392Z';
  const WAVE = (() => { let d = 'M-30 0Q0 -7 30 0'; for (let x = 90; x <= 1110; x += 60) d += 'T' + x + ' 0'; return d + 'V320H-30Z'; })();   // wide, so it can drift sideways without ever showing an edge
  const FLAME = 'M0 0C-20-6-26-28-12-46C-10-34-4-30-2-24C2-38 10-46 8-62C28-44 30-8 0 0Z';
  const N = 5;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const outCubic = t => 1 - Math.pow(1 - t, 3);

  /* short facts shown as pop-up chips; every line comes from the chapter copy already on the page */
  const CHIPS = [
    [['Picked by hand at dawn', 3, 36, 'l'], ['Rolled by palm, fired slowly', 3, 62, 'r']],
    [['Slow, steady simmer', 3, 66, 'r'], ['Tended by eye and by ear', 3, 38, 'r']],
    [['Rolled and shaped by hand', 3.5, 40, 'l'], ['Pearls cooked in-house', 3.5, 66, 'r']],
    [['Singapore, 1980s', 3, 50, 'r'], ['Shaken to order', 3.5, 64, 'l']],
    [['A fresh pot every hour', 3.5, 34, 'l'], ['No pearl waits past two hours', 3.5, 50, 'r'], ['Real leaves, fresh milk', 3.5, 70, 'l']]
  ];
  const TINTS = [
    'linear-gradient(160deg,#F4F6DD 0%,#E6EBC4 100%)',
    'linear-gradient(160deg,#FFEBD0 0%,#F6D3A4 100%)',
    'linear-gradient(160deg,#F7E6CF 0%,#EBCBA3 100%)',
    'linear-gradient(160deg,#FBE9DA 0%,#EFD0B6 100%)',
    'radial-gradient(80% 70% at 50% 62%,#4A2A14 0%,#24140A 62%,#150A04 100%)'
  ];

  const svgMarkup = () => `
<svg class="sc-svg" viewBox="-30 -24 540 540" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
<defs>
 <clipPath id="scClip"><path d="${CUP}"/></clipPath>
 <clipPath id="scFallClip"><rect x="-40" y="-60" width="560" height="468"/></clipPath>
 <linearGradient id="scTea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E3AE72" stop-opacity=".92"/><stop offset="1" stop-color="#B8732F" stop-opacity=".95"/></linearGradient>
 <linearGradient id="scWater" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F4FAFC" stop-opacity=".62"/><stop offset="1" stop-color="#CFE3EA" stop-opacity=".78"/></linearGradient>
 <linearGradient id="scWStream" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#F6FBFD" stop-opacity=".95"/><stop offset="1" stop-color="#C9DEE7" stop-opacity=".95"/></linearGradient>
 <linearGradient id="scMilkTea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#EFD2AB"/><stop offset="1" stop-color="#C98D55"/></linearGradient>
 <linearGradient id="scCream" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFF8EA"/><stop offset="1" stop-color="#F3DDBB"/></linearGradient>
 <linearGradient id="scSteel" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#EEF2F6"/><stop offset="1" stop-color="#9AA7B5"/></linearGradient>
 <linearGradient id="scWood" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#B98A5A"/><stop offset="1" stop-color="#7A4F2B"/></linearGradient>
 <linearGradient id="scSugar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C98A4E"/><stop offset=".5" stop-color="#A9622B"/><stop offset="1" stop-color="#7A4219"/></linearGradient>
 <linearGradient id="scJar" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FFFFFF" stop-opacity=".92"/><stop offset=".55" stop-color="#F3E9DB" stop-opacity=".8"/><stop offset="1" stop-color="#DCCBB2" stop-opacity=".9"/></linearGradient>
 <linearGradient id="scPool" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8A4A22"/><stop offset="1" stop-color="#3B1B09"/></linearGradient>
 <linearGradient id="scJug" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#E8D8BF"/></linearGradient>
 <linearGradient id="scMStream" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#EBD9BC"/><stop offset=".3" stop-color="#FFFEFA"/><stop offset=".62" stop-color="#FFF8EA"/><stop offset="1" stop-color="#E6D0AB"/></linearGradient>
 <linearGradient id="scMJet" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FBEFD9" stop-opacity=".55"/><stop offset=".35" stop-color="#FFFFFF" stop-opacity=".98"/><stop offset=".7" stop-color="#FFF8EA" stop-opacity=".95"/><stop offset="1" stop-color="#F7E6C8" stop-opacity=".5"/></linearGradient>
 <radialGradient id="scMB" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#FFFFFF" stop-opacity=".96"/><stop offset=".42" stop-color="#FFF8EA" stop-opacity=".8"/><stop offset=".78" stop-color="#F7E4C4" stop-opacity=".34"/><stop offset="1" stop-color="#F0D6AE" stop-opacity="0"/></radialGradient>
 <!-- milk is not a drawn blob: noise bends the soft edges into wisps, and the noise slowly shifts so the cloud billows and curls -->
 <filter id="scMilkF" filterUnits="userSpaceOnUse" x="100" y="-40" width="280" height="260" color-interpolation-filters="sRGB">
  <feTurbulence class="sc-mturb" type="fractalNoise" baseFrequency=".016 .026" numOctaves="3" seed="11" result="n"/>
  <feDisplacementMap class="sc-mdisp" in="SourceGraphic" in2="n" scale="10" xChannelSelector="R" yChannelSelector="G" result="d"/>
  <feGaussianBlur in="d" stdDeviation="1.5"/>
 </filter>
 <linearGradient id="scStream" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#E9B97E"/><stop offset="1" stop-color="#C98943"/></linearGradient>
 <linearGradient id="scGlass" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".5" stop-color="#fff" stop-opacity=".12"/><stop offset="1" stop-color="#fff" stop-opacity=".34"/></linearGradient>
 <radialGradient id="scPearl" cx="36%" cy="30%" r="78%"><stop offset="0" stop-color="#6A4630"/><stop offset=".55" stop-color="#2A1810"/><stop offset="1" stop-color="#120804"/></radialGradient>
 <radialGradient id="scHalo" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#FFB454" stop-opacity=".85"/><stop offset=".6" stop-color="#FF9A3C" stop-opacity=".22"/><stop offset="1" stop-color="#FF9A3C" stop-opacity="0"/></radialGradient>
 <linearGradient id="scLfA" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#AFCB6B"/><stop offset="1" stop-color="#58852F"/></linearGradient>
 <linearGradient id="scLfB" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#93B554"/><stop offset="1" stop-color="#3F6B27"/></linearGradient>
 <linearGradient id="scBud" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#DCEB9C"/><stop offset="1" stop-color="#82A84A"/></linearGradient>
 <linearGradient id="scIron" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6B574A"/><stop offset="1" stop-color="#241A13"/></linearGradient>
 <linearGradient id="scFlO" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#D9481A"/><stop offset=".55" stop-color="#F58A22"/><stop offset="1" stop-color="#FFC247"/></linearGradient>
 <linearGradient id="scFlI" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#FFA926"/><stop offset="1" stop-color="#FFF1BC"/></linearGradient>
</defs>
<g class="sc-cam">
<circle class="sc-halo" cx="240" cy="290" r="210" fill="url(#scHalo)"/>
<g class="sc-orbit"><ellipse cx="240" cy="290" rx="196" ry="62" fill="none" stroke="#FFD9A0" stroke-opacity=".35" stroke-width="1.6" stroke-dasharray="3 9" stroke-linecap="round" transform="rotate(-14 240 290)"/>
 <circle cx="436" cy="290" r="6" fill="#FFD9A0" transform="rotate(-14 240 290)"/><circle cx="44" cy="290" r="4.2" fill="#FFB454" transform="rotate(-14 240 290)"/></g>
<ellipse class="sc-shadow" cx="240" cy="426" rx="100" ry="10" fill="#1C140D" opacity=".2"/>

<g class="sc-stream"><rect x="266" y="152" width="9" height="262" rx="4.5" fill="url(#scWStream)"/></g>
<g class="sc-mstream"><path d="M220 152C216.5 181 208.5 211 205 246L217.5 246C220.5 211 228 183 234 152Z" fill="url(#scMStream)" stroke="#CDB48C" stroke-opacity=".7" stroke-width=".9"/><path d="M225 157C221 183 214.5 210 211.4 240" fill="none" stroke="#fff" stroke-opacity=".95" stroke-width="1.8" stroke-linecap="round"/><path d="M230 160C227 183 221.5 205 218.5 226" fill="none" stroke="#E2C99F" stroke-opacity=".55" stroke-width="1.2" stroke-linecap="round"/></g>

<g class="sc-wob"><g class="sc-cupg">
 <path d="${CUP}" fill="url(#scGlass)"/>
 <g clip-path="url(#scClip)">
  <g class="sc-dry">
   <g class="sc-sugpile">
    <path d="M160 412L170 391C190 383 212 374 240 372C268 374 290 383 310 391L322 412Z" fill="url(#scSugar)"/>
    <path d="M178 390C200 382 218 376 240 374C262 376 280 382 302 390" fill="none" stroke="#E9B676" stroke-opacity=".7" stroke-width="2.6" stroke-linecap="round"/>
    <g fill="#E2A762" fill-opacity=".9"><circle cx="200" cy="391" r="2.2"/><circle cx="224" cy="383" r="2"/><circle cx="252" cy="381" r="2.3"/><circle cx="278" cy="389" r="2"/><circle cx="238" cy="395" r="2.2"/><circle cx="214" cy="401" r="2"/><circle cx="266" cy="400" r="2.2"/></g>
    <g fill="#6E3A14" fill-opacity=".75"><circle cx="190" cy="397" r="2"/><circle cx="212" cy="388" r="1.8"/><circle cx="244" cy="388" r="2"/><circle cx="262" cy="392" r="1.9"/><circle cx="290" cy="397" r="2"/><circle cx="228" cy="402" r="1.9"/><circle cx="250" cy="404" r="2"/></g>
   </g>
   <g transform="translate(192 392)"><g transform="rotate(105)"><g class="sc-dl"><path d="M0 0C-38 4-66-22-62-64C-22-66 10-36 0 0Z" fill="#7B6A3A"/><path d="M0 0C-14-22-36-44-60-62" stroke="#4F4322" stroke-width="2.4" stroke-linecap="round" fill="none" opacity=".7"/></g></g></g>
   <g transform="translate(288 392)"><g transform="rotate(260)"><g class="sc-dl"><path d="M0 0C38 4 66-22 62-64C22-66-10-36 0 0Z" fill="#6F5F33"/><path d="M0 0C14-22 36-44 60-62" stroke="#4F4322" stroke-width="2.4" stroke-linecap="round" fill="none" opacity=".7"/></g></g></g>
   <g transform="translate(240 396)"><g transform="rotate(20)"><g class="sc-dl"><path d="M0 2C-14-22-12-58 0-90C12-58 14-22 0 2Z" fill="#85763F"/><path d="M0 -2C-1-28-1-58 0-82" stroke="#4F4322" stroke-width="1.8" stroke-linecap="round" fill="none" opacity=".7"/></g></g></g>
  </g>
  <g class="sc-slosh"><g class="sc-liq"><path class="sc-liqW" d="${WAVE}" fill="url(#scWater)"/><path class="sc-liqA" d="${WAVE}" fill="url(#scTea)" opacity="0"/><path class="sc-liqB" d="${WAVE}" fill="url(#scMilkTea)" opacity="0"/>
   <g class="sc-milk" opacity="0">
    <g filter="url(#scMilkF)">
     <ellipse class="sc-msurf" cx="212" cy="2" rx="40" ry="5.5" fill="url(#scMB)"/>
     <path class="sc-mjet" d="M205 -3C203 28 209 56 206 92C204 124 212 146 209 172L222 172C225 146 218 124 221 92C224 56 219 28 219 -3Z" fill="url(#scMJet)"/>
     <g class="sc-mbs">
      <circle class="sc-mb" cx="213" cy="14" r="22" fill="url(#scMB)" data-o="0" data-dx="-6" data-dy="-2" data-s="1.5" data-f=".55"/>
      <circle class="sc-mb" cx="208" cy="42" r="27" fill="url(#scMB)" data-o="1" data-dx="-14" data-dy="4" data-s="1.45" data-f=".6"/>
      <circle class="sc-mb" cx="216" cy="74" r="31" fill="url(#scMB)" data-o="2" data-dx="12" data-dy="8" data-s="1.4" data-f=".62"/>
      <circle class="sc-mb" cx="207" cy="106" r="34" fill="url(#scMB)" data-o="3" data-dx="-12" data-dy="6" data-s="1.35" data-f=".66"/>
      <circle class="sc-mb" cx="218" cy="136" r="36" fill="url(#scMB)" data-o="4" data-dx="18" data-dy="4" data-s="1.3" data-f=".7"/>
      <circle class="sc-mb" cx="212" cy="160" r="34" fill="url(#scMB)" data-o="5" data-dx="-10" data-dy="2" data-s="1.3" data-f=".72"/>
      <circle class="sc-mb" cx="180" cy="92" r="26" fill="url(#scMB)" data-o="6" data-dx="-12" data-dy="12" data-s="1.5" data-f=".5"/>
      <circle class="sc-mb" cx="250" cy="104" r="28" fill="url(#scMB)" data-o="7" data-dx="22" data-dy="10" data-s="1.5" data-f=".5"/>
      <circle class="sc-mb" cx="186" cy="146" r="26" fill="url(#scMB)" data-o="8" data-dx="-8" data-dy="6" data-s="1.45" data-f=".55"/>
      <circle class="sc-mb" cx="248" cy="148" r="28" fill="url(#scMB)" data-o="9" data-dx="18" data-dy="4" data-s="1.45" data-f=".55"/>
      <circle class="sc-mb" cx="240" cy="40" r="22" fill="url(#scMB)" data-o="10" data-dx="22" data-dy="8" data-s="1.5" data-f=".45"/>
      <circle class="sc-mb" cx="184" cy="48" r="22" fill="url(#scMB)" data-o="11" data-dx="-14" data-dy="6" data-s="1.5" data-f=".45"/>
      <circle class="sc-mb" cx="262" cy="84" r="26" fill="url(#scMB)" data-o="12" data-dx="18" data-dy="12" data-s="1.45" data-f=".42"/>
      <circle class="sc-mb" cx="268" cy="128" r="26" fill="url(#scMB)" data-o="13" data-dx="16" data-dy="8" data-s="1.4" data-f=".42"/>
     </g>
     <g fill="none" stroke="#FFF9EE" stroke-width="9" stroke-linecap="round"><path class="sc-mw" d="M212 8C158 38 166 102 212 114"/><path class="sc-mw" d="M214 12C270 44 264 112 222 130"/><path class="sc-mw" d="M208 62C166 86 174 134 206 152"/></g>
    </g>
   </g>
   <path d="M150 1Q172 -5 194 1T238 1T282 1T326 1" fill="none" stroke="#fff" stroke-opacity=".42" stroke-width="3" stroke-linecap="round"/>
   <g fill="#fff" fill-opacity=".5"><circle cx="186" cy="14" r="2.6"/><circle cx="284" cy="20" r="3.2"/><circle cx="214" cy="30" r="1.9"/><circle cx="304" cy="40" r="2.2"/></g>
  </g></g>
  <g class="sc-syrup" opacity="0"><path class="sc-pool" d="M130 382Q170 373 210 382T290 382T350 382V450H130Z" fill="url(#scPool)"/><path d="M150 382Q180 376 210 382T270 382" fill="none" stroke="#C98A4E" stroke-opacity=".55" stroke-width="2.4" stroke-linecap="round" class="sc-poolg"/></g>
  <path class="sc-glint" d="M120 150L168 150L146 430L98 430Z" fill="#fff" opacity="0"/>
 </g>
  <g class="sc-pearls">
   <g class="sc-pl" data-x="203" data-y="389"><circle r="12" fill="url(#scPearl)"/><ellipse cx="-4" cy="-5" rx="3.6" ry="2.2" fill="#fff" fill-opacity=".55"/></g>
   <g class="sc-pl" data-x="227" data-y="390"><circle r="12" fill="url(#scPearl)"/><ellipse cx="-4" cy="-5" rx="3.6" ry="2.2" fill="#fff" fill-opacity=".55"/></g>
   <g class="sc-pl" data-x="251" data-y="389"><circle r="12" fill="url(#scPearl)"/><ellipse cx="-4" cy="-5" rx="3.6" ry="2.2" fill="#fff" fill-opacity=".55"/></g>
   <g class="sc-pl" data-x="275" data-y="390"><circle r="12" fill="url(#scPearl)"/><ellipse cx="-4" cy="-5" rx="3.6" ry="2.2" fill="#fff" fill-opacity=".55"/></g>
   <g class="sc-pl" data-x="215" data-y="368"><circle r="12" fill="url(#scPearl)"/><ellipse cx="-4" cy="-5" rx="3.6" ry="2.2" fill="#fff" fill-opacity=".55"/></g>
   <g class="sc-pl" data-x="239" data-y="369"><circle r="12" fill="url(#scPearl)"/><ellipse cx="-4" cy="-5" rx="3.6" ry="2.2" fill="#fff" fill-opacity=".55"/></g>
   <g class="sc-pl" data-x="263" data-y="368"><circle r="12" fill="url(#scPearl)"/><ellipse cx="-4" cy="-5" rx="3.6" ry="2.2" fill="#fff" fill-opacity=".55"/></g>
   <g class="sc-pl" data-x="227" data-y="347"><circle r="12" fill="url(#scPearl)"/><ellipse cx="-4" cy="-5" rx="3.6" ry="2.2" fill="#fff" fill-opacity=".55"/></g>
   <g class="sc-pl" data-x="251" data-y="348"><circle r="12" fill="url(#scPearl)"/><ellipse cx="-4" cy="-5" rx="3.6" ry="2.2" fill="#fff" fill-opacity=".55"/></g>
  </g>
  <g class="sc-splash"></g>
  <g class="sc-sugar"><circle class="sc-gr" r="2.4" fill="#B8732F" data-x="204" data-y="384" data-o="0" data-b="0"/><circle class="sc-gr" r="3" fill="#9A5A26" data-x="241" data-y="397" data-o="1" data-b="0"/><circle class="sc-gr" r="2.1" fill="#C98A4E" data-x="204" data-y="396" data-o="2" data-b="1"/><circle class="sc-gr" r="3.4" fill="#7E4318" data-x="241" data-y="395" data-o="3" data-b="0"/><circle class="sc-gr" r="2.7" fill="#D9A05A" data-x="204" data-y="394" data-o="4" data-b="0"/><circle class="sc-gr" r="2.4" fill="#B8732F" data-x="241" data-y="393" data-o="5" data-b="0"/><circle class="sc-gr" r="3" fill="#9A5A26" data-x="204" data-y="392" data-o="6" data-b="0"/><circle class="sc-gr" r="2.1" fill="#C98A4E" data-x="241" data-y="391" data-o="7" data-b="1"/><circle class="sc-gr" r="3.4" fill="#7E4318" data-x="204" data-y="390" data-o="8" data-b="0"/><circle class="sc-gr" r="2.7" fill="#D9A05A" data-x="241" data-y="389" data-o="9" data-b="0"/><circle class="sc-gr" r="2.4" fill="#B8732F" data-x="204" data-y="388" data-o="10" data-b="0"/><circle class="sc-gr" r="3" fill="#9A5A26" data-x="241" data-y="387" data-o="11" data-b="0"/><circle class="sc-gr" r="2.1" fill="#C98A4E" data-x="204" data-y="386" data-o="12" data-b="1"/><circle class="sc-gr" r="3.4" fill="#7E4318" data-x="241" data-y="385" data-o="13" data-b="0"/><circle class="sc-gr" r="2.7" fill="#D9A05A" data-x="204" data-y="384" data-o="14" data-b="0"/><circle class="sc-gr" r="2.4" fill="#B8732F" data-x="241" data-y="397" data-o="15" data-b="0"/><circle class="sc-gr" r="3" fill="#9A5A26" data-x="204" data-y="396" data-o="16" data-b="0"/><circle class="sc-gr" r="2.1" fill="#C98A4E" data-x="241" data-y="395" data-o="17" data-b="1"/><circle class="sc-gr" r="3.4" fill="#7E4318" data-x="204" data-y="394" data-o="18" data-b="0"/><circle class="sc-gr" r="2.7" fill="#D9A05A" data-x="241" data-y="393" data-o="19" data-b="0"/><circle class="sc-gr" r="2.4" fill="#B8732F" data-x="204" data-y="392" data-o="20" data-b="0"/><circle class="sc-gr" r="3" fill="#9A5A26" data-x="241" data-y="391" data-o="21" data-b="0"/><circle class="sc-gr" r="2.1" fill="#C98A4E" data-x="204" data-y="390" data-o="22" data-b="1"/><circle class="sc-gr" r="3.4" fill="#7E4318" data-x="241" data-y="389" data-o="23" data-b="0"/><circle class="sc-gr" r="2.7" fill="#D9A05A" data-x="204" data-y="388" data-o="24" data-b="0"/><circle class="sc-gr" r="2.4" fill="#B8732F" data-x="241" data-y="387" data-o="25" data-b="0"/><circle class="sc-gr" r="3" fill="#9A5A26" data-x="204" data-y="386" data-o="26" data-b="0"/><circle class="sc-gr" r="2.1" fill="#C98A4E" data-x="241" data-y="385" data-o="27" data-b="1"/><circle class="sc-gr" r="3.4" fill="#7E4318" data-x="204" data-y="384" data-o="28" data-b="0"/><circle class="sc-gr" r="2.7" fill="#D9A05A" data-x="241" data-y="397" data-o="29" data-b="0"/></g>
  <g class="sc-ice">
   <g class="sc-ic" data-x="198" data-y="246" data-r="-14"><rect x="-18" y="-18" width="36" height="36" rx="7" fill="#fff" fill-opacity=".42" stroke="#fff" stroke-opacity=".9" stroke-width="2"/><path d="M-10 -9L-2 -12" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".8"/></g>
   <g class="sc-ic" data-x="278" data-y="238" data-r="16"><rect x="-18" y="-18" width="36" height="36" rx="7" fill="#fff" fill-opacity=".42" stroke="#fff" stroke-opacity=".9" stroke-width="2"/><path d="M-10 -9L-2 -12" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".8"/></g>
   <g class="sc-ic" data-x="238" data-y="272" data-r="6"><rect x="-18" y="-18" width="36" height="36" rx="7" fill="#fff" fill-opacity=".42" stroke="#fff" stroke-opacity=".9" stroke-width="2"/><path d="M-10 -9L-2 -12" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".8"/></g>
  </g>
 <g class="sc-straw">
  <path d="M270 54L238 330" stroke="#3B2012" stroke-opacity=".74" stroke-width="13" stroke-linecap="round" fill="none"/>
  <path d="M264.6 60L233.6 328" stroke="#fff" stroke-opacity=".28" stroke-width="3" stroke-linecap="round" fill="none"/>
  <path d="M267.6 76L263.8 106" stroke="#D9923B" stroke-width="13" stroke-linecap="round" fill="none"/>
  <g class="sc-sp"><circle cx="241.2" cy="302.4" r="5.2" fill="url(#scPearl)"/><circle cx="239.9" cy="313.4" r="5.2" fill="url(#scPearl)"/><circle cx="238.6" cy="324.5" r="5.2" fill="url(#scPearl)"/></g>
 </g>
 <path class="sc-outline" d="${CUP}" fill="none" stroke-width="3" stroke-linejoin="round"/>
 <path d="M170 188L180 376" stroke="#fff" stroke-opacity=".7" stroke-width="6" stroke-linecap="round" fill="none"/>
 <g class="sc-drops" fill="#fff" fill-opacity=".75"><circle cx="186" cy="214" r="3.6"/><circle cx="296" cy="236" r="3"/><circle cx="198" cy="288" r="2.6"/><circle cx="288" cy="318" r="3.8"/><circle cx="206" cy="344" r="3"/><circle cx="304" cy="268" r="2.4"/></g>
 <rect class="sc-rim" x="148" y="161" width="184" height="14" rx="7" fill="#FAF6F0" stroke="#C87A28" stroke-width="2.4"/>
 <g class="sc-lid"><path d="M152 168C152 112 328 112 328 168Z" fill="#fff" fill-opacity=".4" stroke="#C87A28" stroke-width="2.4" stroke-linejoin="round"/><path d="M176 150C190 128 240 120 270 124" stroke="#fff" stroke-opacity=".8" stroke-width="5" stroke-linecap="round" fill="none"/></g>
</g></g>

<g class="sc-hotsteam"><path d="M204 152C194 132 216 120 206 98C198 82 214 70 206 50"/><path d="M240 148C230 128 252 116 242 94C234 78 250 66 242 46"/><path d="M276 152C266 132 288 120 278 98C270 82 286 70 278 50"/></g>
<g class="sc-shk" fill="none" stroke="#C87A28" stroke-opacity=".55" stroke-width="4" stroke-linecap="round"><path d="M118 250Q96 300 118 350"/><path d="M92 228Q56 300 92 372"/><path d="M362 250Q384 300 362 350"/><path d="M388 228Q424 300 388 372"/></g>
<g class="sc-shk2" opacity="0" fill="none" stroke="#C87A28" stroke-opacity=".55" stroke-width="4" stroke-linecap="round"><path d="M118 250Q96 300 118 350"/><path d="M92 228Q56 300 92 372"/><path d="M362 250Q384 300 362 350"/><path d="M388 228Q424 300 388 372"/></g>
<g class="sc-branchg">
 <path d="M312 -60C300 -24 266 14 240 46" stroke="#6B4F2E" stroke-width="9" stroke-linecap="round" fill="none"/>
 <path d="M290 -30C316 -44 336 -40 352 -56" stroke="#6B4F2E" stroke-width="5" stroke-linecap="round" fill="none"/>
 <path d="M268 8C246 2 232 -8 226 -24" stroke="#6B4F2E" stroke-width="4" stroke-linecap="round" fill="none"/>
 <path d="M226 -24C214 -34 212 -52 222 -60C236 -50 238 -34 226 -24Z" fill="url(#scLfA)"/>
 <path d="M344 -48C358 -50 370 -42 374 -30C360 -28 348 -34 344 -48Z" fill="url(#scLfB)"/>
<g transform="translate(240 44) rotate(180)"><g class="sc-sprig">
 <path class="sc-stem" d="M0 62C-1 42 1 22 0 0" stroke="#4A7029" stroke-width="5" stroke-linecap="round" fill="none"/>
</g></g></g>
<g clip-path="url(#scFallClip)"><g transform="translate(240 44) rotate(180)"><g class="sc-fallg">
 <g class="sc-lfL"><path d="M0 0C-38 4-66-22-62-64C-22-66 10-36 0 0Z" fill="url(#scLfA)"/><path class="sc-dfx" d="M0 0C-38 4-66-22-62-64C-22-66 10-36 0 0Z" fill="#7B6A3A" opacity="0"/><path d="M0 0C-14-22-36-44-60-62" stroke="#3E6524" stroke-width="2.4" stroke-linecap="round" fill="none" opacity=".7"/></g>
 <g class="sc-lfR"><path d="M0 0C38 4 66-22 62-64C22-66-10-36 0 0Z" fill="url(#scLfB)"/><path class="sc-dfx" d="M0 0C38 4 66-22 62-64C22-66-10-36 0 0Z" fill="#6F5F33" opacity="0"/><path d="M0 0C14-22 36-44 60-62" stroke="#355B1E" stroke-width="2.4" stroke-linecap="round" fill="none" opacity=".7"/></g>
 <g class="sc-bud"><path d="M0 2C-14-22-12-58 0-90C12-58 14-22 0 2Z" fill="url(#scBud)"/><path class="sc-dfx" d="M0 2C-14-22-12-58 0-90C12-58 14-22 0 2Z" fill="#85763F" opacity="0"/><path d="M0 -2C-1-28-1-58 0-82" stroke="#6C9440" stroke-width="1.8" stroke-linecap="round" fill="none" opacity=".7"/></g>
</g></g></g>

<g class="sc-kpos">
 <g class="sc-fire"><g transform="translate(-100 -88)"><rect x="52" y="174" width="96" height="13" rx="6.5" fill="#6A4325" transform="rotate(-7 100 180)"/><rect x="52" y="174" width="96" height="13" rx="6.5" fill="#563520" transform="rotate(8 100 180)"/>
  <g transform="translate(76 176) scale(.7)"><g class="sc-fl"><path d="${FLAME}" fill="url(#scFlO)"/></g></g>
  <g transform="translate(124 176) scale(.74)"><g class="sc-fl sc-fl2"><path d="${FLAME}" fill="url(#scFlO)"/></g></g>
  <g transform="translate(100 178)"><g class="sc-fl sc-fl3"><path d="${FLAME}" fill="url(#scFlO)"/><g transform="scale(.58)"><path d="${FLAME}" fill="url(#scFlI)"/></g></g></g></g></g>
 <g class="sc-krot"><g transform="translate(-100 -88)">
  <path d="M70 80C58 40 142 40 130 80" stroke="#2A1F17" stroke-width="5" fill="none" stroke-linecap="round"/>
  <path d="M132 86C146 82 155 73 157 60L165 62C165 79 152 95 134 101Z" fill="url(#scIron)"/>
  <path d="M64 100C60 76 78 62 100 62C122 62 140 76 136 100C135 109 128 114 120 114L80 114C72 114 65 109 64 100Z" fill="url(#scIron)"/>
  <path d="M72 96C71 82 80 72 92 69" stroke="#FFD9A0" stroke-opacity=".5" stroke-width="3" stroke-linecap="round" fill="none"/>
  <path d="M82 64C86 52 114 52 118 64Z" fill="#2E2219"/><circle cx="100" cy="51" r="4.2" fill="#C87A28"/>
  <path d="M70 104H130" stroke="#C87A28" stroke-opacity=".55" stroke-width="2" stroke-linecap="round"/>
  <g class="sc-steam"><path d="M162 54C154 46 170 40 161 30C156 24 164 18 160 10"/><path d="M158 56C150 50 164 44 157 36"/><path d="M100 42C92 36 108 30 100 22C95 16 103 12 99 6"/></g>
 </g></g>
</g>

<g class="sc-bpos"><g class="sc-brot"><g>
  <path d="M-48 -8H48C48 28 24 50 0 50C-24 50 -48 28 -48 -8Z" fill="url(#scWood)" stroke="#6B4527" stroke-width="2"/>
  <ellipse cx="0" cy="-8" rx="48" ry="9" fill="#8A5E37" stroke="#6B4527" stroke-width="2"/>
  <ellipse cx="0" cy="-8" rx="41" ry="6" fill="#3B1D0C"/>
  <g class="sc-bh"><g class="sc-bhp" transform="translate(-28 -13)"><circle r="11" fill="url(#scPearl)"/><ellipse cx="-3.5" cy="-4.5" rx="3.2" ry="2" fill="#fff" fill-opacity=".5"/></g><g class="sc-bhp" transform="translate(-10 -15)"><circle r="11" fill="url(#scPearl)"/><ellipse cx="-3.5" cy="-4.5" rx="3.2" ry="2" fill="#fff" fill-opacity=".5"/></g><g class="sc-bhp" transform="translate(8 -14)"><circle r="11" fill="url(#scPearl)"/><ellipse cx="-3.5" cy="-4.5" rx="3.2" ry="2" fill="#fff" fill-opacity=".5"/></g><g class="sc-bhp" transform="translate(26 -12)"><circle r="11" fill="url(#scPearl)"/><ellipse cx="-3.5" cy="-4.5" rx="3.2" ry="2" fill="#fff" fill-opacity=".5"/></g><g class="sc-bhp" transform="translate(-18 -29)"><circle r="11" fill="url(#scPearl)"/><ellipse cx="-3.5" cy="-4.5" rx="3.2" ry="2" fill="#fff" fill-opacity=".5"/></g><g class="sc-bhp" transform="translate(2 -31)"><circle r="11" fill="url(#scPearl)"/><ellipse cx="-3.5" cy="-4.5" rx="3.2" ry="2" fill="#fff" fill-opacity=".5"/></g><g class="sc-bhp" transform="translate(20 -28)"><circle r="11" fill="url(#scPearl)"/><ellipse cx="-3.5" cy="-4.5" rx="3.2" ry="2" fill="#fff" fill-opacity=".5"/></g><g class="sc-bhp" transform="translate(-6 -46)"><circle r="11" fill="url(#scPearl)"/><ellipse cx="-3.5" cy="-4.5" rx="3.2" ry="2" fill="#fff" fill-opacity=".5"/></g></g>
 </g></g></g>
<g class="sc-spos"><g class="sc-srot"><g>
  <path d="M-36 -6H36C36 24 16 40 0 40C-16 40 -36 24 -36 -6Z" fill="url(#scSteel)" stroke="#7C8794" stroke-width="2"/>
  <path d="M-36 -10L-86 -30" stroke="#8FA0B2" stroke-width="9" stroke-linecap="round" fill="none"/>
  <path d="M-62 -20L-94 -33" stroke="#7A4F2B" stroke-width="11" stroke-linecap="round" fill="none"/>
  <ellipse cx="0" cy="-6" rx="36" ry="7" fill="#E4E9EF" stroke="#7C8794" stroke-width="2"/>
  <g class="sc-sh"><g class="sc-shc" transform="translate(-16 -22) rotate(-8)"><rect x="-13" y="-13" width="26" height="26" rx="5" fill="#fff" fill-opacity=".6" stroke="#fff" stroke-width="2"/><path d="M-7 -6L-1 -9" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/></g><g class="sc-shc" transform="translate(10 -24) rotate(10)"><rect x="-13" y="-13" width="26" height="26" rx="5" fill="#fff" fill-opacity=".6" stroke="#fff" stroke-width="2"/><path d="M-7 -6L-1 -9" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/></g><g class="sc-shc" transform="translate(-3 -44) rotate(4)"><rect x="-13" y="-13" width="26" height="26" rx="5" fill="#fff" fill-opacity=".6" stroke="#fff" stroke-width="2"/><path d="M-7 -6L-1 -9" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/></g></g>
 </g></g></g>
<g class="sc-jpos"><g class="sc-jrot"><g>
  <polygon points="30,-24 44,-32 44,44 30,52" fill="#DCE3EA" stroke="#C3CDD7" stroke-width="1.6" stroke-linejoin="round"/>
  <polygon points="30,38 44,32 44,44 30,52" fill="#2A5E9E"/>
  <polygon points="-30,-24 30,-24 22,-48 -22,-48" fill="#FFFFFF" stroke="#CBD3DB" stroke-width="1.6" stroke-linejoin="round"/>
  <polygon points="30,-24 44,-32 34,-52 22,-48" fill="#E9EEF3" stroke="#CBD3DB" stroke-width="1.6" stroke-linejoin="round"/>
  <rect x="-20" y="-55" width="40" height="7" rx="2" fill="#EEF2F6" stroke="#CBD3DB" stroke-width="1.4"/>
  <polygon points="-30,-24 -42,-38 -34,-46 -22,-48" fill="#F4F7FA" stroke="#CBD3DB" stroke-width="1.4" stroke-linejoin="round"/>
  <path d="M-30 -24H30V48Q30 52 26 52H-26Q-30 52 -30 48Z" fill="#F9FAFB" stroke="#CBD3DB" stroke-width="1.6" stroke-linejoin="round"/>
  <rect x="-30" y="-24" width="60" height="15" fill="#2F6FB5"/>
  <text x="0" y="-13.4" text-anchor="middle" font-family="Inter Tight, Inter, Arial, sans-serif" font-size="5.4" font-weight="800" letter-spacing="1.1" fill="#fff">BOBA CRAVE CO.</text>
  <text x="0" y="12" text-anchor="middle" font-family="Inter Tight, Inter, Arial, sans-serif" font-size="16" font-weight="700" fill="#2F6FB5">Fresh</text>
  <text x="0" y="31" text-anchor="middle" font-family="Inter Tight, Inter, Arial, sans-serif" font-size="20" font-weight="800" fill="#1D3A64">Milk</text>
  <path d="M-30 38Q-20 32 -10 38T10 38T30 38V48Q30 52 26 52H-26Q-30 52 -30 48Z" fill="#2F6FB5"/>
  <text x="0" y="47.6" text-anchor="middle" font-family="Inter Tight, Inter, Arial, sans-serif" font-size="5" font-weight="700" fill="#fff">cold &amp; creamy</text>
  <path d="M-26 -6V40" stroke="#fff" stroke-opacity=".7" stroke-width="3" stroke-linecap="round"/>
 </g></g></g>
<g class="sc-upos"><g class="sc-urot"><g>
  <path d="M-30 -30H30V46Q30 52 24 52H-24Q-30 52 -30 46Z" fill="url(#scJar)" stroke="#BFA98C" stroke-width="1.8" stroke-linejoin="round"/>
  <path d="M-27 -12H27V46Q27 49 24 49H-24Q-27 49 -27 46Z" fill="url(#scSugar)"/>
  <ellipse cx="0" cy="-12" rx="27" ry="5" fill="#C98A4E"/>
  <g fill="#E6B374" fill-opacity=".9"><circle cx="-14" cy="-12" r="1.6"/><circle cx="-2" cy="-10" r="1.8"/><circle cx="12" cy="-13" r="1.6"/><circle cx="20" cy="-10" r="1.4"/></g>
  <rect x="-22" y="6" width="44" height="26" rx="4" fill="#E9D3AE" stroke="#B98A5A" stroke-width="1.4"/>
  <text x="0" y="17" text-anchor="middle" font-family="Inter Tight, Inter, Arial, sans-serif" font-size="8.4" font-weight="800" letter-spacing=".8" fill="#6B3A17">BROWN</text>
  <text x="0" y="27.5" text-anchor="middle" font-family="Inter Tight, Inter, Arial, sans-serif" font-size="8.4" font-weight="800" letter-spacing=".8" fill="#6B3A17">SUGAR</text>
  <rect x="-33" y="-40" width="66" height="12" rx="4" fill="#8A5E37" stroke="#6B4527" stroke-width="1.6"/>
  <path d="M-26 -34H24" stroke="#fff" stroke-opacity=".28" stroke-width="2.4" stroke-linecap="round"/>
  <path d="M-24 -4V44" stroke="#fff" stroke-opacity=".7" stroke-width="3" stroke-linecap="round"/>
 </g></g></g>
<g class="sc-sparks" fill="#FFE2B0"><path d="M92 150l3 10 10 3-10 3-3 10-3-10-10-3 10-3z"/><path d="M392 120l2.4 8 8 2.4-8 2.4-2.4 8-2.4-8-8-2.4 8-2.4z"/><path d="M410 330l2 7 7 2-7 2-2 7-2-7-7-2 7-2z"/><path d="M70 330l2.4 8 8 2.4-8 2.4-2.4 8-2.4-8-8-2.4 8-2.4z"/></g>
</g>
</svg>`;

  function create({ lis, tl, rail }) {
    const $ = (s, c) => (c || root).querySelector(s), $$ = (s, c) => [...(c || root).querySelectorAll(s)];
    const root = document.createElement('div');
    root.className = 'scene';
    const raw = lis.map((li, i) => {
      const t = sel => { const e = li.querySelector(sel); if (!e) return ''; const sr = e.querySelector('.sr-only'); return (sr || e).textContent.replace(/\s+/g, ' ').trim(); };
      return { era: t('.era'), h3: t('h3'), p: t('p'), id: li.id, art: li.querySelector('.tl-art') };
    });
    const wordsHTML = txt => txt.split(' ').map((w, i) => `<span class="scw">${w}</span>`).join(' ');

    root.innerHTML = `<div class="scene-pin"><div class="scene-grid">
      <div class="sc-copy">${raw.map((c, i) => `<article class="sc-chap" data-i="${i}"><span class="era">${c.era}</span><h3><span class="sr-only">${c.h3}</span><span aria-hidden="true">${wordsHTML(c.h3)}</span></h3><p><span class="sr-only">${c.p}</span><span aria-hidden="true">${wordsHTML(c.p)}</span></p></article>`).join('')}
        <div class="sc-foot">
          <div class="sc-prog"><div class="sc-track" role="slider" tabindex="0" aria-label="Story timeline: drag to scrub through the story" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" aria-valuetext="Chapter 1"><i class="sc-prog-bar" aria-hidden="true"></i><i class="sc-thumb" aria-hidden="true"></i></div>${raw.map((c, i) => `<button type="button" class="sc-dot" data-i="${i}" style="--k:${i}" aria-label="Chapter ${i + 1}: ${c.h3}"></button>`).join('')}</div>
          <div class="sc-ctrl" role="group" aria-label="Story controls">
            <button type="button" class="sc-btn sc-prev" aria-label="Previous chapter"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg></button>
            <button type="button" class="sc-btn sc-play" aria-pressed="false"><svg class="ic-play" viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg><svg class="ic-pause" viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg><span>Watch the story</span></button>
            <button type="button" class="sc-btn sc-next" aria-label="Next chapter"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg></button>
            <span class="sc-exits"><button type="button" class="sc-skip sc-up"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 15l6-6 6 6"/></svg><span>Back to top</span></button><button type="button" class="sc-skip sc-down"><span>Skip story</span><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></button></span>
          </div>
        </div></div>
      <div class="sc-card">
        ${TINTS.map((t, i) => `<div class="sc-bg" data-i="${i}" style="background:${t}"></div>`).join('')}
        <div class="sc-num" aria-hidden="true">01</div>
        ${svgMarkup()}
        <div class="sc-badges">${raw.map((c, i) => `<div class="sc-badge" data-i="${i}"></div>`).join('')}</div>
        <div class="sc-chips" aria-hidden="true">${CHIPS.map((row, i) => row.map(([txt, off, top, side]) => `<span class="sc-chip" data-i="${i}" style="${side === 'l' ? 'left' : 'right'}:${off}%;top:${top}%"><i></i>${txt}</span>`).join('')).join('')}</div>
      </div></div></div>`;

    const pin = $('.scene-pin'), card = $('.sc-card'), svg = $('.sc-svg');
    const chaps = $$('.sc-chap').map(el => ({ el, era: $('.era', el), words: $$('.scw', el), vis: $$('[aria-hidden]', el) }));
    const bgs = $$('.sc-bg'), badges = $$('.sc-badge'), chips = $$('.sc-chip'), num = $('.sc-num'), ticks = $$('.sc-dot'), bar = $('.sc-prog-bar'), thumb = $('.sc-thumb'), track = $('.sc-track');
    const q = (s) => svg.querySelector(s), qa = (s) => [...svg.querySelectorAll(s)];

    const wrap = document.createElement('div'); wrap.className = 'scene-wrap';     // the chapter rail lives with the scene so it releases when the scene ends
    let fillNow = 0, doneNode = [false, false, false, false, false];
    let mounted = false, tlm = null, cur = -1, proxy = { p: 0 }, lastE = -1, geo = { stageH: 600 };


    /* the caramel line runs from one chapter's end node to the next; a node fills with a ring pulse the moment the line reaches it */
    const setFill = (f, ring) => {
      f = clamp(f, 0, 1); fillNow = f; bar.style.transform = 'scaleX(' + f.toFixed(4) + ')'; thumb.style.left = (f * 100).toFixed(2) + '%'; track.setAttribute('aria-valuenow', Math.round(f * 100));
      ticks.forEach((b, k) => {
        const d = f >= (k + 1) / N - 1e-4;
        if (d === doneNode[k]) return;
        doneNode[k] = d; b.classList.toggle('done', d);
        if (d && ring) { b.classList.remove('ring'); void b.offsetWidth; b.classList.add('ring'); }
      });
    };
    const manualFill = p => { const x = p * N, i = Math.min(N - 1, Math.floor(x)), u = Math.min(1, (x - i) / .96); return (i + u) / N; };   // scrolling by hand: a chapter's stretch of line is full once its picture is finished

    /* ---------- the master timeline: 5 units, one per chapter; scrolling scrubs it ---------- */
    const build = () => {
      const g = window.gsap;
      const liqs = q('.sc-liq'), liqW = q('.sc-liqW'), liqA = q('.sc-liqA'), liqB = q('.sc-liqB'), waves = [liqW, liqA, liqB], cupg = q('.sc-cupg'), cam = q('.sc-cam');
      const kpos = q('.sc-kpos'), krot = q('.sc-krot'), jpos = q('.sc-jpos'), jrot = q('.sc-jrot'), bpos = q('.sc-bpos'), brot = q('.sc-brot'), spos = q('.sc-spos'), srot = q('.sc-srot'), upos = q('.sc-upos'), urot = q('.sc-urot');
      const sprig = q('.sc-sprig'), fallg = q('.sc-fallg'), branchg = q('.sc-branchg'), lfL = q('.sc-lfL'), lfR = q('.sc-lfR'), bud = q('.sc-bud'), dls = qa('.sc-dl');
      const rotP = (d, x, y) => { const a = d * Math.PI / 180; return [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)]; };

      /* where each container goes so its lip sits over the cup: centre = target lip - rotated lip offset */
      const S = 1.25, POUR = 38, tk = rotP(POUR, 65 * S, -26 * S), pour = { x: 268 - tk[0], y: 148 - tk[1] };        // kettle (from the left, on a fire)
      const rest = { x: 86, y: 318 };
      const SJ = 1.12, POURJ = -108, jk = rotP(POURJ, -42 * SJ, -38 * SJ), jug = { x: 226 - jk[0], y: 152 - jk[1] };     // the Fresh Milk carton (from the right)
      const SB = 1.0, POURB = -70, bk = rotP(POURB, -48 * SB, -8 * SB), bowl = { x: 232 - bk[0], y: 158 - bk[1] };      // pearl bowl (from the right)
      const SS = 1.2, POURS = 70, sk = rotP(POURS, 36 * SS, -6 * SS), scoop = { x: 214 - sk[0], y: 148 - sk[1] };       // ice scoop (from the left)
      const SU = 1.1, POURU = -104, uk = rotP(POURU, -31 * SU, -36 * SU), jar = { x: 238 - uk[0], y: 150 - uk[1] };            // brown sugar jar (from the right)
      const lipU = { x: 238, y: 150 };
      const lipB = { x: 232, y: 158 }, lipS = { x: 214, y: 148 };

      const liqState = { y: 440 };                                       // mirrors the liquid level so no frame ever has to read it back from the DOM
      /* GSAP measures an SVG element's pivot from the top-left of its box, not from its own origin. These props are drawn centred on (0,0), so pin each pivot there:
         then the carton, kettle, bowl and scoop swing about their middle and land exactly where the numbers above say. */
      [kpos, krot, jpos, jrot, bpos, brot, spos, srot, upos, urot].forEach(el => { const bb = el.getBBox(); g.set(el, { transformOrigin: (-bb.x) + 'px ' + (-bb.y) + 'px' }); });
      /* ---- starting state ---- */
      g.set(liqs, { y: 440 });
      g.set(waves, { transformOrigin: '0px 0px' }); g.set(liqA, { opacity: 0 });
      g.set([sprig, fallg], { svgOrigin: '240 -18', rotation: 0 });
      /* the leaves are drawn from their base (0,0): pin the pivot there, so they scale, turn and land exactly where the numbers say */
      [lfL, lfR, bud, ...dls].forEach(el => { const bb = el.getBBox(); g.set(el, { transformOrigin: (-bb.x) + 'px ' + (-bb.y) + 'px' }); });
      g.set(dls, { scale: .55, opacity: 0 });           // the same size the falling leaf has when it lands
      g.set(q('.sc-lid'), { y: -320 });                                  // lid and straw wait outside the frame and drop in from above
      g.set(q('.sc-straw'), { y: -440 });
      g.set(kpos, { x: rest.x - 280, y: rest.y, scale: S, opacity: 0 });
      g.set(krot, { rotation: 0 });
      g.set(q('.sc-fire'), { opacity: 0, scale: .6, transformOrigin: '0px 100px' });
      g.set(q('.sc-stream'), { svgOrigin: '270 152', scaleY: 0, opacity: 1 });
      g.set(q('.sc-mstream'), { svgOrigin: '225 152', scaleY: 0, opacity: 1 });
      g.set(jpos, { x: jug.x + 330, y: jug.y - 30, scale: SJ }); g.set(jrot, { rotation: 0 });
      g.set(bpos, { x: bowl.x + 330, y: bowl.y - 30, scale: SB }); g.set(brot, { rotation: 0 });
      g.set(spos, { x: scoop.x - 340, y: scoop.y - 30, scale: SS }); g.set(srot, { rotation: 0 });
      g.set(upos, { x: jar.x + 330, y: jar.y - 30, scale: SU }); g.set(urot, { rotation: 0 });
      g.set([upos, bpos, spos, jpos], { opacity: 0 });                  // parked props stay hidden until their own moment
      g.set(q('.sc-sugpile'), { svgOrigin: '240 412', scaleY: 0, scaleX: .8, opacity: 1 });                                  // the sugar bed on the cup floor, grows as the grains land
      qa('.sc-gr').forEach((e, i) => g.set(e, { x: lipU.x + (i % 5 - 2) * 3, y: lipU.y, opacity: 0, scale: .9 }));
      g.set(qa('.sc-mb'), { transformOrigin: '50% 50%', scale: .1, opacity: 0 });                 // the milk cloud: soft lobes that bloom out of the jet
      g.set(q('.sc-mjet'), { svgOrigin: '212 0', scaleY: 0, scaleX: .8, opacity: 1 });             // the jet the stream drives down into the tea
      g.set(q('.sc-msurf'), { transformOrigin: '50% 50%', scale: .2, opacity: 0 });                // the creamy patch spreading over the surface
      g.set(qa('.sc-mw'), { opacity: .85 });
      g.set(liqs, { transformOrigin: '240px 40px' });
      /* every pearl and ice cube gets an inner wrapper of its own (both are drawn around 0,0), so it can tumble about inside the cup without fighting the
         timeline, which owns the outer group */
      const wrapIn = (e, cls) => { let w = e.querySelector(':scope > .' + cls); if (!w) { w = document.createElementNS('http://www.w3.org/2000/svg', 'g'); w.setAttribute('class', cls); while (e.firstChild) w.appendChild(e.firstChild); e.appendChild(w); } return w; };
      const pj = qa('.sc-pl').map(e => wrapIn(e, 'sc-pj')), icj = qa('.sc-ic').map(e => wrapIn(e, 'sc-icj'));
      g.set(pj, { transformOrigin: '12px 12px', x: 0, y: 0, rotation: 0 }); g.set(icj, { transformOrigin: '18px 18px', x: 0, y: 0, rotation: 0 });
      qa('.sc-pl').forEach((e, i) => g.set(e, { x: lipB.x + (i % 3 - 1) * 8, y: lipB.y, opacity: 0, scale: .9 }));
      qa('.sc-ic').forEach((e, i) => g.set(e, { x: lipS.x + (i - 1) * 10, y: lipS.y, rotation: +e.dataset.r - 40, opacity: 0 }));
      g.set(q('.sc-pool'), { y: 44 }); g.set(q('.sc-poolg'), { y: 44 });
      g.set(q('.sc-hotsteam'), { opacity: 0 }); g.set(q('.sc-shk'), { opacity: 0 });
      g.set(qa('.sc-sp circle'), { opacity: 0 });
      g.set(q('.sc-halo'), { svgOrigin: '240 290', scale: .5, opacity: 0 });
      g.set(q('.sc-orbit'), { opacity: 0 }); g.set(q('.sc-sparks'), { opacity: 0 });
      g.set(qa('.sc-drops circle'), { opacity: 0, scale: 0, transformOrigin: '50% 50%' });
      g.set(cupg, { svgOrigin: '240 408', scale: 1, y: 0, x: 0, rotation: 0 });
      g.set(cam, { svgOrigin: '240 300', scale: 1 });
      g.set(q('.sc-shadow'), { svgOrigin: '240 426', scale: 1 });
      const milkPaths = qa('.sc-mw');
      milkPaths.forEach(p => { const L = p.getTotalLength(); p.style.strokeDasharray = L; p.style.strokeDashoffset = L; });

      /* ---- little helpers that make the water behave ---- */
      const NSV = 'http://www.w3.org/2000/svg', liqLayer = q('.sc-liq'), splashLayer = q('.sc-splash');
      const mk = (parent, tag, attrs) => { const e = document.createElementNS(NSV, tag); Object.keys(attrs).forEach(k => e.setAttribute(k, attrs[k])); parent.appendChild(e); return e; };

      const t = g.timeline({ paused: true, defaults: { ease: 'none' } });
      const sine = 'sine.inOut';
      const L2 = (y, dur, pos, ease) => t.to(liqs, { y, duration: dur, ease: ease || sine }, pos).to(liqState, { y, duration: dur, ease: ease || sine }, pos);
      const ripple = (x, at, big) => {                                    // a ring spreads on the surface where something lands
        const e = mk(liqLayer, 'ellipse', { cx: x, cy: 0, rx: 4, ry: 1.4, fill: 'none', stroke: '#fff', 'stroke-width': 2, opacity: 0 });
        t.to(e, { opacity: .9, duration: .01 }, at).to(e, { attr: { rx: big ? 36 : 24, ry: big ? 7 : 4.6 }, opacity: 0, duration: big ? .2 : .15, ease: 'power1.out' }, at + .01);
      };
      const splash = (x, y, at, n) => {                                   // a few droplets thrown up and falling back
        for (let k = 0; k < n; k++) {
          const e = mk(splashLayer, 'circle', { cx: x, cy: y, r: 2.4 + (k % 2), fill: '#fff', 'fill-opacity': .85, opacity: 0 }), dx = (k - (n - 1) / 2) * 11, h = 20 + (k % 3) * 8;
          t.to(e, { opacity: 1, duration: .01 }, at).to(e, { x: dx, y: -h, duration: .08, ease: 'power2.out' }, at).to(e, { x: dx * 1.5, y: 4, opacity: 0, duration: .1, ease: 'power2.in' }, at + .08);
        }
      };
      const surge = (at, dur, amp) => { t.to(waves, { scaleY: amp, duration: .06 }, at).to(waves, { scaleY: 1, duration: .16, ease: 'power2.out' }, at + dur); };   // the surface gets choppy, then calms
      /* the surface drifts sideways slowly all the way through (a wave pattern, not a still line) */
      t.to(waves, { x: -480, duration: 5, ease: 'none' }, 0);

      /* ===== 1 - the leaf: leaves hang from a branch, are picked, wither as they fall, and rest in the empty cup ===== */
      t.to(sprig, { rotation: 3.5, duration: .12, ease: sine }, .06).to(sprig, { rotation: -3, duration: .14, ease: sine }, .18).to(sprig, { rotation: 2, duration: .1, ease: sine }, .32);
      t.to(fallg, { rotation: 3.5, duration: .12, ease: sine }, .06).to(fallg, { rotation: -3, duration: .14, ease: sine }, .18).to(fallg, { rotation: 0, duration: .1, ease: sine }, .32);   // the leaves sway with the sprig, then hang true so they land exactly where the numbers say
      const fall = (leaf, x, y, rot, xs, at, dl) => {
        t.to(leaf, { y, duration: .34, ease: 'power1.in' }, at)
         .to(leaf, { keyframes: { x: xs, easeEach: 'sine.inOut' }, duration: .34 }, at)
         .to(leaf, { rotation: rot, scale: .55, duration: .34, ease: 'sine.inOut' }, at)
         .to(leaf.querySelector('.sc-dfx'), { opacity: 1, duration: .24 }, at + .08)
         .to(leaf, { opacity: 0, duration: .03 }, at + .34).to(dl, { opacity: 1, duration: .03 }, at + .34);
      };
      fall(lfL, 48, -348, -75, [0, 8, 24, 36, 48], .2, dls[0]);              // lands at x 192, leaning right
      fall(lfR, -48, -348, 80, [0, -8, -24, -36, -48], .24, dls[1]);         // lands at x 288, leaning left
      fall(bud, 0, -352, -160, [0, -4, 5, -2, 0], .28, dls[2]);               // the bud tumbles over as it falls and lands pointing up, lying inside the cup
      t.to(branchg, { y: -160, duration: .2, ease: 'power2.in' }, .42);

      /* ===== 1b - the brown sugar: a jar slides in, tips over the cup and the grains pour onto the leaves, piling up into a bed ===== */
      t.to(upos, { x: jar.x, y: jar.y, opacity: 1, duration: .08, ease: 'power2.out' }, .5)
       .to(urot, { rotation: POURU, duration: .08, ease: 'power2.inOut' }, .55);
      qa('.sc-gr').forEach((e, i) => {
        const at = .6 + i * .0036, lx = +e.dataset.x, ly = +e.dataset.y, mx = lipU.x + (lx - lipU.x) * .35;
        t.to(e, { opacity: 1, scale: 1, duration: .01 }, at)
         .to(e, { y: ly, duration: .1, ease: 'power2.in' }, at).to(e, { x: mx, duration: .06, ease: 'none' }, at).to(e, { x: lx, duration: .04, ease: 'sine.out' }, at + .06)   // falls, fanning out a little
         .to(e, { opacity: 0, duration: .02 }, at + .1);                                                                                                           // and melts into the bed
        if (+e.dataset.b) t.to(e, { opacity: 1, duration: .01 }, at + .1).to(e, { y: ly - 9, x: lx + (i % 2 ? 7 : -7), duration: .035, ease: 'power1.out' }, at + .1)
                           .to(e, { y: ly, opacity: 0, duration: .04, ease: 'power1.in' }, at + .135);                                                               // a few bounce
      });
      t.to(q('.sc-sugpile'), { scaleY: 1, scaleX: 1, duration: .16, ease: 'sine.out' }, .64)
       .to(dls, { y: -9, duration: .16, ease: 'sine.out' }, .66)                                                             // the leaves ride up on the growing bed
       .to(urot, { rotation: 0, duration: .06, ease: 'power2.inOut' }, .75)
       .to(upos, { x: jar.x + 330, y: jar.y - 30, opacity: 0, duration: .08, ease: 'power2.in' }, .8);                                                                                        // gone before the chapter's resting frame

      /* ===== 2 - the fire: the kettle heats on its fire, lifts, pours clear hot water; the leaves unfurl and the water turns into tea ===== */
      t.to(kpos, { x: rest.x, opacity: 1, duration: .12, ease: 'power2.out' }, 1.08)
       .to(q('.sc-fire'), { opacity: 1, scale: 1, duration: .1, ease: 'back.out(2)' }, 1.12)
       .to(q('.sc-fire'), { opacity: 0, scale: .4, duration: .08, ease: 'power1.in' }, 1.22)
       .to(kpos, { x: pour.x, y: pour.y, duration: .18, ease: 'power2.inOut' }, 1.2)
       .to(krot, { rotation: POUR, duration: .16, ease: 'power2.inOut' }, 1.22)
       .to(q('.sc-stream'), { scaleY: 1, duration: .05, ease: 'power1.out' }, 1.4);
      L2(262, .34, 1.42);
      t.to(q('.sc-sugpile'), { opacity: 0, scaleY: .7, duration: .34, ease: 'sine.inOut' }, 1.56).to(dls, { y: 0, duration: .34, ease: 'sine.inOut' }, 1.56);                                  // the sugar dissolves into the hot tea
      surge(1.42, .3, 2.4);
      for (let k = 0; k < 4; k++) ripple(270, 1.5 + k * .07);
      t.to(dls, { scale: .74, rotation: '+=6', duration: .3, ease: 'sine.out', stagger: .05 }, 1.5)
       .to(qa('.sc-dl path:first-child'), { fill: '#6E8A3C', duration: .3, stagger: .05 }, 1.52)
       .to(q('.sc-hotsteam'), { opacity: .9, duration: .14 }, 1.62)
       .to(liqA, { opacity: 1, duration: .24, ease: 'sine.inOut' }, 1.7)
       .to(q('.sc-stream'), { opacity: 0, duration: .05 }, 1.74)
       .to(krot, { rotation: 0, duration: .08, ease: 'power2.inOut' }, 1.76)
       .to(kpos, { x: pour.x - 260, y: pour.y - 60, opacity: 0, duration: .09, ease: 'power2.in' }, 1.8);

      /* ===== 3 - the roll: a bowl of syrupy pearls tips over the cup; each pearl drops, splashes and sinks, the syrup pools underneath ===== */
      t.to(bpos, { x: bowl.x, y: bowl.y, opacity: 1, duration: .14, ease: 'power2.out' }, 2.08)
       .to(brot, { rotation: POURB, duration: .14, ease: 'power2.inOut' }, 2.18);
      qa('.sc-pl').forEach((e, i) => {
        const at = 2.3 + i * .028, dx = +e.dataset.x, dy = +e.dataset.y, mx = lipB.x + (dx - lipB.x) * .4;
        t.to(e, { opacity: 1, scale: 1, duration: .01 }, at)
         .to(e, { y: 246, duration: .1, ease: 'power2.in' }, at).to(e, { x: mx, duration: .1 }, at)                  // falls through the air
         .to(e, { y: dy, duration: .26, ease: 'power2.out' }, at + .1).to(e, { x: dx, duration: .26, ease: sine }, at + .1)   // then sinks, slowed by the water
         .to(e, { y: dy - 4, duration: .04, ease: 'sine.out' }, at + .36).to(e, { y: dy, duration: .05, ease: 'sine.in' }, at + .4);
        ripple(mx, at + .1);
      });
      surge(2.34, .36, 1.9);
      t.to(qa('.sc-bhp'), { opacity: 0, scale: .6, duration: .08, stagger: .035 }, 2.34);
      L2(252, .22, 2.5);
      t.to(q('.sc-syrup'), { opacity: .96, duration: .05 }, 2.4)
       .to([q('.sc-pool'), q('.sc-poolg')], { y: 0, duration: .34, ease: 'sine.out' }, 2.42)
       .to(brot, { rotation: 0, duration: .08, ease: 'power2.inOut' }, 2.76)
       .to(bpos, { x: bowl.x + 330, y: bowl.y - 30, opacity: 0, duration: .1, ease: 'power2.in' }, 2.82);

      /* ===== 4 - the shake: ice plunges in and bobs up, milk swirls through, the lid goes on, THEN the sealed cup is shaken ===== */
      t.to(spos, { x: scoop.x, y: scoop.y, opacity: 1, duration: .08, ease: 'power2.out' }, 3.0)
       .to(srot, { rotation: POURS, duration: .08, ease: 'power2.inOut' }, 3.06);
      qa('.sc-ic').forEach((e, i) => {
        const at = 3.09 + i * .03, dx = +e.dataset.x, dy = +e.dataset.y, dr = +e.dataset.r, mx = lipS.x + (dx - lipS.x) * .45;
        t.to(e, { opacity: 1, duration: .01 }, at)
         .to(e, { y: 238, duration: .09, ease: 'power2.in' }, at).to(e, { x: mx, rotation: dr - 25, duration: .09 }, at)                      // drops from the scoop
         .to(e, { y: dy + 16, duration: .1, ease: 'power2.out' }, at + .09).to(e, { x: dx, duration: .2, ease: sine }, at + .09)               // plunges under
         .to(e, { y: dy - 5, rotation: dr, duration: .1, ease: 'sine.out' }, at + .19).to(e, { y: dy, duration: .08, ease: sine }, at + .29);  // pops up and bobs
        ripple(mx, at + .09, true); splash(mx, 246, at + .09, 3);
      });
      surge(3.17, .24, 2.2);
      L2(240, .2, 3.11);
      t.to(srot, { rotation: 0, duration: .06, ease: 'power2.inOut' }, 3.24)
       .to(spos, { x: scoop.x - 340, y: scoop.y - 30, opacity: 0, duration: .08, ease: 'power2.in' }, 3.28)
       .to(q('.sc-hotsteam'), { opacity: 0, duration: .14 }, 3.22)                                                                              // the ice cools it: no more steam
       .to(qa('.sc-drops circle'), { opacity: 1, scale: 1, duration: .08, ease: 'back.out(2)', stagger: .03 }, 3.5);                             // and the cold glass starts to sweat

      /* the milk: a smooth, glossy stream arcs out of the carton and punches a jet down into the tea. The jet blooms into soft, translucent billows that roll outward,
         curl and slowly thin out as the milk mixes through, before the shake blends it into milk tea. Everything is soft-edged and see-through, never a solid shape. */
      const M0 = 3.4, mturb = q('.sc-mturb'), mdisp = q('.sc-mdisp'), mp = { f: .016, s: 8 };
      const jet = q('.sc-mjet'), surf = q('.sc-msurf');
      t.to(jpos, { x: jug.x, y: jug.y, opacity: 1, duration: .1, ease: 'power2.out' }, 3.22)
       .to(jrot, { rotation: POURJ + 14, duration: .1, ease: 'power2.inOut' }, 3.28)                                    // the carton tips (spout still high)
       .to(jrot, { rotation: POURJ - 8, duration: .26, ease: 'sine.inOut' }, 3.4)                                       // and tips further, gently, as it empties
       .to(q('.sc-mstream'), { scaleY: 1, duration: .04, ease: 'power1.out' }, 3.37)                                    // the stream drops from the spout in one go
       .to(q('.sc-mstream'), { keyframes: { scaleX: [1, 1.22, .86, 1.18, .9, 1.12, .88, 1.08, .94, 1], easeEach: 'sine.inOut' }, duration: .24 }, 3.42)   // it glugs, not a steady rod
       .to(q('.sc-milk'), { opacity: 1, duration: .02 }, M0);
      t.to(jet, { scaleY: 1, duration: .1, ease: 'power2.out' }, M0)                                                    // the jet punches down through the tea
       .to(jet, { scaleX: 2.2, duration: .32, ease: 'sine.out' }, M0 + .06)
       .to(jet, { opacity: 0, duration: .22, ease: 'sine.in' }, M0 + .22)
       .to(surf, { opacity: .95, scale: 1.1, duration: .12, ease: 'power2.out' }, M0)                                   // cream spreads across the surface where it lands
       .to(surf, { scale: 1.9, opacity: .35, duration: .4, ease: 'sine.out' }, M0 + .12);
      qa('.sc-mb').forEach(e => {
        const at = M0 + .02 + (+e.dataset.o) * .02;
        t.to(e, { scale: 1, opacity: 1, duration: .14, ease: 'power2.out' }, at)                                        // a billow swells out of the jet
         .to(e, { x: +e.dataset.dx, y: +e.dataset.dy, scale: +e.dataset.s, duration: .42, ease: 'sine.out' }, at + .14)  // then rolls outward, growing
         .to(e, { opacity: +e.dataset.f, duration: .32, ease: 'sine.inOut' }, at + .32);                                 // and thins as it mixes
      });
      milkPaths.forEach((p, i) => {                                                                                       // curling tendrils trace the eddies
        t.to(p, { strokeDashoffset: 0, duration: .22, ease: 'power1.out' }, M0 + .1 + i * .07)
         .to(p, { opacity: 0, duration: .22, ease: 'sine.in' }, M0 + .34 + i * .05);
      });
      t.to(mp, { f: .03, s: 30, duration: .5, ease: 'sine.inOut', onUpdate: () => {                                      // the noise drifts: the edges boil and curl instead of sitting still
        mturb.setAttribute('baseFrequency', mp.f.toFixed(4) + ' ' + (mp.f * 1.7).toFixed(4)); mdisp.setAttribute('scale', mp.s.toFixed(2));
      } }, M0);
      for (let k = 0; k < 4; k++) ripple(212, M0 + .04 + k * .08);
      splash(212, 236, M0 + .02, 3);
      L2(226, .4, M0 + .02);
      surge(M0 + .04, .3, 1.5);
      t.to(liqB, { opacity: .45, duration: .24, ease: sine }, M0 + .22)                                                // the tea slowly turns creamy as the milk disperses
       .to(q('.sc-mstream'), { scaleX: .3, opacity: 0, duration: .05 }, 3.66)                                            // the stream thins to a thread and stops
       .to(jrot, { rotation: 0, duration: .05, ease: 'power2.inOut' }, 3.68)
       .to(jpos, { x: jug.x + 330, y: jug.y - 30, opacity: 0, duration: .07, ease: 'power2.in' }, 3.72);
      /* the lid drops and is pressed home (the cup squashes a touch), and only then is it shaken.
         The player builds a chapter up to t = i + .98 and then HOLDS there, so the whole shake has to be finished before ~3.95: a shake that runs past that point freezes mid-tilt.
         (While the chapter then holds, idleStart() below keeps the cup shaking live.) */
      const SHK = [{ x: -16, rotation: -8, y: -4 }, { x: 16, rotation: 8, y: 2 }, { x: -15, rotation: -8, y: -4 }, { x: 15, rotation: 8, y: 2 }, { x: -13, rotation: -7, y: -3 }, { x: 13, rotation: 7, y: 2 }, { x: -10, rotation: -5, y: -2 }, { x: 10, rotation: 5, y: 1 }, { x: -6, rotation: -3, y: -1 }, { x: 5, rotation: 2, y: 1 }, { x: 0, rotation: 0, y: 0 }];
      t.to(q('.sc-lid'), { y: -8, duration: .06, ease: 'power2.in' }, 3.76)
       .to(q('.sc-lid'), { y: 0, duration: .04, ease: 'back.out(3)' }, 3.82)
       .to(cupg, { scaleY: .975, duration: .03 }, 3.82).to(cupg, { scaleY: 1, duration: .04, ease: 'back.out(3)' }, 3.85)
       .to(cam, { scale: 1.06, duration: .1, ease: sine }, 3.84)
       .to(cupg, { keyframes: SHK, easeEach: 'sine.inOut', duration: .09 }, 3.86)                                         // the whole cup is thrown side to side
       .to(liqs, { keyframes: [{ rotation: 9 }, { rotation: -9 }, { rotation: 8 }, { rotation: -8 }, { rotation: 6 }, { rotation: -6 }, { rotation: 4 }, { rotation: -3 }, { rotation: 2 }, { rotation: -1 }, { rotation: 0 }], easeEach: 'sine.inOut', duration: .09 }, 3.86)   // the milk tea sloshes against it
       .to(q('.sc-shk'), { keyframes: [{ opacity: 1 }, { opacity: .2 }, { opacity: 1 }, { opacity: .2 }, { opacity: 1 }, { opacity: .2 }, { opacity: .8 }, { opacity: .1 }, { opacity: 0 }], easeEach: 'none', duration: .09 }, 3.86);
      surge(3.86, .08, 3);
      /* inside the cup the pearls and ice are thrown about too: each one hops, rolls and spins its own way (top pearls bounce the most), then settles.
         jig() makes a burst of n kicks that fades out, from a seed so neighbours move out of step */
      const jig = (n, ax, ay, ar, seed) => Array.from({ length: n }, (_, j) => j === n - 1 ? { x: 0, y: 0, rotation: 0 } : (() => { const f = 1 - j / (n * 1.5), d = (j + seed) % 2 ? 1 : -1; return { x: ax * d * f, y: -ay * ((j + seed * 2) % 3 ? .3 : 1) * f, rotation: ar * d * f }; })());
      const PH = [5, 5, 5, 5, 10, 10, 10, 15, 15];                                                                     // pearl rows: the higher the pearl, the higher it hops
      pj.forEach((e, i) => t.to(e, { keyframes: jig(8, 5 + (i % 3), PH[i], 120 + (i % 4) * 30, i), easeEach: sine, duration: .09 }, 3.86));
      icj.forEach((e, i) => t.to(e, { keyframes: jig(9, i === 2 ? 10 : 6, 10, 18, i + 1), easeEach: sine, duration: .09 }, 3.86));      // the two outer cubes stay clear of the glass
      t.to(liqB, { opacity: 1, duration: .08, ease: sine }, 3.86)                                                         // the shake blends the last of the milk through
       .to(q('.sc-milk'), { opacity: 0, duration: .07 }, 3.86);

      /* ===== 5 - today: the straw goes through the lid, the first sip travels up it, then the glow ===== */
      t.to(q('.sc-straw'), { y: -6, duration: .08, ease: 'power2.in' }, 4.06).to(q('.sc-straw'), { y: 0, duration: .05, ease: 'back.out(2)' }, 4.14)
       .to(qa('.sc-drops circle'), { y: '+=34', duration: .3, ease: 'power2.in', stagger: .03 }, 4.14);
      t.to(qa('.sc-sp circle'), { opacity: 1, duration: .02, stagger: .04 }, 4.28);
      [[241.2, 302.4, 264.2, 103.7], [239.9, 313.4, 266.2, 87.1], [238.6, 324.5, 268.1, 70.6]].forEach(([x0, y0, x1, y1], i) => {
        const c = qa('.sc-sp circle')[i];
        t.to(c, { x: x1 - x0, y: y1 - y0, duration: .24, ease: 'power1.inOut' }, 4.28 + i * .04).to(c, { opacity: 0, duration: .03 }, 4.54 + i * .02);
      });
      t.to(qa('.sc-pl')[8], { opacity: 0, duration: .03 }, 4.3);                                                                                // that pearl went up the straw
      L2(234, .12, 4.3);
      t.to(q('.sc-halo'), { opacity: 1, scale: 1, duration: .24, ease: 'power2.out' }, 4.5)
       .to(q('.sc-orbit'), { opacity: 1, duration: .2 }, 4.54)
       .to(cupg, { y: -16, scale: 1.05, duration: .24, ease: 'power2.out' }, 4.52)
       .to(q('.sc-shadow'), { scale: .88, opacity: .13, duration: .24, ease: 'power2.out' }, 4.52)
       .to(cam, { scale: 1.1, duration: .3, ease: 'power2.out' }, 4.5)
       .to(q('.sc-sparks'), { opacity: 1, duration: .14 }, 4.7)
       .to(q('.sc-glint'), { opacity: .38, duration: .01 }, 4.86)
       .to(q('.sc-glint'), { x: 360, duration: .1, ease: 'power1.inOut' }, 4.86)
       .to(q('.sc-glint'), { opacity: 0, duration: .02 }, 4.96);
      t.duration(5);
      const streamRect = q('.sc-stream rect'); let lastH = -1;
      t.eventCallback('onUpdate', () => {
        const h = Math.round(clamp(liqState.y - 152, 0, 262));
        if (h !== lastH) { lastH = h; streamRect.setAttribute('height', h); }
      });

      /* ---- the live shake: the story builds a chapter and then HOLDS on its finished picture, so the timeline alone would leave the cup standing still.
         While the picture is held on the shake chapter, the sealed cup keeps shaking in real time (a burst, a short breath, another burst), then eases to rest when the story moves on.
         It drives its own wrapper groups (never the ones the scrubbed timeline owns), so the two can't fight. ---- */
      const wob = q('.sc-wob'), slosh = q('.sc-slosh'), iceG = q('.sc-ice'), arcs2 = q('.sc-shk2'), rig = [wob, slosh, iceG, ...pj, ...icj];
      g.set(wob, { svgOrigin: '240 408' }); g.set(slosh, { svgOrigin: '240 226' }); g.set(arcs2, { opacity: 0 });
      const IDLE_CUP = SHK, IDLE_LIQ = SHK.map(k => ({ rotation: -k.rotation * .9, x: -k.x * .3 })), IDLE_ICE = SHK.map((k, i) => ({ x: -k.x * .5, y: i % 2 ? 6 : -6 }));
      const IDLE_ARC = [1, .2, 1, .2, 1, .2, 1, .2, .9, .2, 0].map(o => ({ opacity: o }));
      let idleTl = null;
      t.idleStart = () => {
        if (idleTl) { idleTl.paused(false); return; }
        g.killTweensOf(rig);
        idleTl = g.timeline({ repeat: -1 });
        idleTl.to(wob, { keyframes: IDLE_CUP, easeEach: 'sine.inOut', duration: .8 }, 0)
              .to(slosh, { keyframes: IDLE_LIQ, easeEach: 'sine.inOut', duration: .8 }, 0)
              .to(iceG, { keyframes: IDLE_ICE, easeEach: 'sine.inOut', duration: .8 }, 0)
              .to(arcs2, { keyframes: IDLE_ARC, easeEach: 'none', duration: .8 }, 0);
        pj.forEach((e, i) => idleTl.to(e, { keyframes: jig(11, 6 + (i % 3), PH[i] * 1.2, 150 + (i % 4) * 30, i), easeEach: 'sine.inOut', duration: .8 }, 0));      // pearls hop and roll about
        icj.forEach((e, i) => idleTl.to(e, { keyframes: jig(11, i === 2 ? 10 : 6, 12, 22, i + 1), easeEach: 'sine.inOut', duration: .8 }, 0));                              // the ice clinks around
        idleTl              .to({}, { duration: .3 });                                                                                 // a short breath before the next burst
      };
      t.idleStop = () => {
        if (!idleTl) return;
        idleTl.kill(); idleTl = null;
        g.to(rig, { x: 0, y: 0, rotation: 0, duration: .2, ease: 'power2.out', overwrite: true });
        g.set(arcs2, { opacity: 0 });
      };
      t.idlePause = on => { if (idleTl) idleTl.paused(!!on); };
      return t;
    };

    /* ---------- chapter changes (time based, so the words write in at a steady pace) ---------- */
    const show = (i, instant) => {
      const g = window.gsap;
      if (i === cur && !instant) return;
      const prev = cur; cur = i;
      root.dataset.ch = i;
      const writeIn = !instant;
      chaps.forEach((c, k) => {
        g.killTweensOf([c.el, c.era, ...c.words]);
        if (k === i) {
          c.el.classList.add('on'); g.set(c.el, { opacity: 1 });
          if (writeIn) {
            g.fromTo(c.era, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: .6, ease: 'expo.out', delay: prev >= 0 ? .22 : 0 });
            g.fromTo(c.words, { opacity: 0, y: '.55em' }, { opacity: 1, y: 0, duration: .9, ease: 'expo.out', delay: prev >= 0 ? .22 : 0, stagger: { each: .028, from: 'start' } });
          } else g.set([c.era, ...c.words], { opacity: 1, y: 0 });            // a jump: the new chapter's words are simply there, no waiting
        } else if (k === prev && !instant) {
          c.el.classList.remove('on'); g.to(c.el, { opacity: 0, duration: .22, ease: 'power1.out' });
        } else { c.el.classList.remove('on'); g.set(c.el, { opacity: 0 }); }
      });
      /* backgrounds: the new one fades in OVER the old one (which stays solid underneath), so the card never washes out to grey mid-fade */
      bgs.forEach((b, k) => {
        g.killTweensOf(b);
        if (instant) { g.set(b, { opacity: k === i ? 1 : 0, zIndex: k === i ? 0 : -1 }); return; }
        if (k === i) { b.style.zIndex = 0; g.fromTo(b, { opacity: 0 }, { opacity: 1, duration: .9, ease: 'power1.inOut' }); }
        else if (k === prev) { b.style.zIndex = -1; g.set(b, { opacity: 1 }); }
        else { b.style.zIndex = -1; g.set(b, { opacity: 0 }); }
      });
      badges.forEach((b, k) => {
        const on = k === i; b.classList.toggle('on', on);
        $$('svg', b).forEach(sv => { if (sv.pauseAnimations) on ? sv.unpauseAnimations() : sv.pauseAnimations(); });
        g.killTweensOf(b);
        if (instant) g.set(b, { opacity: on ? 1 : 0, scale: 1, rotation: 0 });
        else if (on) g.fromTo(b, { opacity: 0, scale: .4, rotation: -16 }, { opacity: 1, scale: 1, rotation: 0, duration: .95, ease: 'back.out(1.7)', delay: .08 });
        else g.to(b, { opacity: 0, scale: .7, duration: .25, ease: 'power1.in' });
      });
      chips.forEach(c => {
        const k = +c.dataset.i; g.killTweensOf(c);
        if (k === i) g.fromTo(c, { opacity: 0, scale: .6, y: 16 }, { opacity: 1, scale: 1, y: 0, duration: .7, ease: 'back.out(1.8)', delay: 1.1 + (+[...chips.filter(x => +x.dataset.i === k)].indexOf(c)) * .5 });
        else if (instant) g.set(c, { opacity: 0 });
        else g.to(c, { opacity: 0, scale: .85, duration: .2, ease: 'power1.in' });
      });
      g.killTweensOf(num);
      if (instant) g.set(num, { opacity: 1, y: 0 }); else g.fromTo(num, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: .6, ease: 'expo.out' });
      num.textContent = '0' + (i + 1);
      track.setAttribute('aria-valuetext', 'Chapter ' + (i + 1) + ': ' + raw[i].h3);
    };

    const api = {
      root, wrap, get index() { return cur; }, get fill() { return fillNow; }, get t() { return proxy.p * N; },
      mount() {
        if (mounted) return; mounted = true;
        tl.before(wrap); if (rail) wrap.append(rail); wrap.append(root);
        raw.forEach((c, i) => { if (c.art) badges[i].append(c.art); });          // the existing artwork becomes the corner emblem
        tlm = build(); window.gsap.set(badges, { opacity: 0 }); window.gsap.set(chips, { opacity: 0 }); window.gsap.set(chaps.map(c => c.el), { opacity: 0 });
        cur = -1; proxy.p = 0; setFill(0, false);
      },
      unmount() {
        if (!mounted) return; mounted = false;
        window.gsap.killTweensOf(proxy); if (tlm) { tlm.idleStop(); tlm.kill(); } tlm = null; cur = -1;
        raw.forEach((c, i) => { const li = lis[i]; if (c.art && li) { const copy = li.querySelector('.tl-copy'); if (copy) copy.after(c.art); } });
        if (rail) tl.before(rail); wrap.remove();
      },
      /* size the stage for this viewport. The story is an ordinary block on the page: scrolling moves past it, it never scrubs it. */
      layout(vh) {
        const stageH = Math.round(clamp(vh - 194, 430, 660));
        if (geo.stageH !== stageH) { root.style.setProperty('--stage-h', stageH + 'px'); root.style.height = stageH + 'px'; }
        geo = { stageH };
        return geo;
      },
      /* the only thing the page position still does: the stage eases in as it arrives, and the first chapter's words write in */
      update(y, top, vh) {
        if (!mounted) return;
        const e = Math.round(outCubic(clamp((vh - (top - y)) / (vh * .55), 0, 1)) * 200) / 200;
        if (e !== lastE) { lastE = e; card.style.scale = (.92 + .08 * e).toFixed(4); card.style.opacity = Math.min(1, e * 1.6).toFixed(3); }
        if (cur < 0 && e > .2) show(0);
      },
      /* the story player (and the draggable timeline) set the picture directly: t in chapters (0..5), fill 0..1 */
      drive(t, fill, instant) {
        if (!mounted) return;
        window.gsap.killTweensOf(proxy); proxy.p = clamp(t / N, 0, 1); tlm.progress(proxy.p);
        if (t >= 3.95 && t < 3.999) tlm.idleStart(); else tlm.idleStop();                 // held on the finished shake chapter: keep the cup shaking live
        setFill(fill, !instant); show(clamp(Math.floor(t), 0, N - 1), !!instant);
      },
      /* dragging the timeline: fill (0..1) -> the picture, immediately; a chapter's stretch of line is full once its picture is finished */
      scrub(f) {
        if (!mounted) return;
        f = clamp(f, 0, 1); const x = f * N, i = Math.min(N - 1, Math.floor(x)), u = Math.min(1, x - i);
        api.drive(i + .96 * u, f, true);
      },
      pause(on) { root.classList.toggle('is-away', on); if (tlm) tlm.idlePause(on); }
    };
    return api;
  }
  window.StoryScene = { create };
})();
