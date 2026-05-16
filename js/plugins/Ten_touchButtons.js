/*:
 * @plugindesc (v1.6) [UI] On-screen GamePad using Base64. Mobile-optimized: only uses touch events. [Ten_touchButtons.js]
 * @author Tendev2d
 *
 * @require Ten_core.js
 *
 * @param GamePad Buttons
 * @type struct<GamePadButton>[]
 * @desc List of GamePad buttons to display on screen.
 * @default []
 *
 * @param Start Visible
 * @type boolean
 * @default true
 * @desc Should the GamePad be visible on game start? If false, stays hidden until shown.
 *
 * @help
 * ============================================================================
 * ■ DESCRIPTION:
 * This plugin displays customizable on-screen buttons, ideal for mobile games.
 * Fully touch-optimized. Base64 images. Drag to move between buttons.
 * ============================================================================
 * REQUIREMENTS:
 * - Required **Ten_core.js** to be placed and enabled **above** 
 *   this plugin. This provides lodash (_) and jQuery ($) globally.
 * - It's recommended to also place **Ten_scaleRoot.js** above.
 * ============================================================================  
 * ■ FEATURES:
 * ✔️ Touch-only (no pointer events)
 * ✔️ Base64 images (normal + pressed)
 * ✔️ Supports press-and-hold or one-shot trigger
 * ✔️ Built-in commands: MoveUp, DashToggle, etc.
 * ✔️ Drag finger across buttons (GamePad-like)
 * ✔️ Auto padding around buttons for better touch experience
 * ✔️ Auto dimming during events (choices, messages, menus)
 * ✔️ Scene-specific button visibility
 * ✔️ Choice dialog scene support
 * ✔️ JavaScript condition support (show/hide based on JS code)
 *
 * ============================================================================
 * ■ PLUGIN COMMANDS:
 * Ten_touchButtons Show     → Show the GamePad
 * Ten_touchButtons Hide     → Hide the GamePad
 */
/*~struct~GamePadButton:
 * @param Name
 * @type string
 * @default Button
 *
 * @param Normal Image Base64
 * @type note
 *
 * @param Active Image Base64
 * @type note
 *
 * @param Method
 * @type select
 * @option trigger
 * @option pressed
 * @default trigger
 *
 * @param Command
 * @type select
 * @option none
 * @option MoveUp
 * @option MoveDown
 * @option MoveLeft
 * @option MoveRight
 * @option MoveAnalog
 * @option DashToggle
 * @option Ok
 * @option Cancel
 * @option Menu
 * @option PageUp
 * @option PageDown
 * @default none
 *
 * @param Common Event
 * @type common_event
 * 
 * @param X
 * @type number
 * @min 0
 * @desc X position of the button (center point)
 *
 * @param Y
 * @type number
 * @min 0
 * @desc Y position of the button (center point)
 *
 * @param Scale
 * @type number
 * @decimals 2
 * @min 0.1
 * @default 1.0
 * @desc Scale factor for the button image
 *
 * @param Touch Padding
 * @type number
 * @min 0
 * @default 0
 * @desc Extra padding around button for easier touch (in pixels)
 *
 * @param Visible Scenes
 * @type string[]
 * @option Scene_Map
 * @option Scene_Menu
 * @option Scene_Item
 * @option Scene_Skill
 * @option Scene_Equip
 * @option Scene_Status
 * @option Scene_Options
 * @option Scene_Save
 * @option Scene_Load
 * @option Scene_GameEnd
 * @option Scene_Shop
 * @option Scene_Name
 * @option Scene_Debug
 * @option Scene_Choice
 * @default ["Scene_Map"]
 * @desc List of scenes where this button will be visible. Scene_Choice = when choice dialog is active.
 *
 * @param JavaScript Condition
 * @type note
 * @desc JavaScript code that returns true/false. Button will only show when this returns true. 
 * @default 
 */(()=>{"use strict";var e={540:e=>{e.exports=function(e){var t=document.createElement("style");return e.setAttributes(t,e.attributes),e.insert(t,e.options),t}},1113:e=>{e.exports=function(e,t){if(t.styleSheet)t.styleSheet.cssText=e;else{for(;t.firstChild;)t.removeChild(t.firstChild);t.appendChild(document.createTextNode(e))}}},1601:e=>{e.exports=function(e){return e[1]}},5056:(e,t,n)=>{e.exports=function(e){var t=n.nc;t&&e.setAttribute("nonce",t)}},5072:e=>{var t=[];function n(e){for(var n=-1,o=0;o<t.length;o++)if(t[o].identifier===e){n=o;break}return n}function o(e,o){for(var s={},r=[],c=0;c<e.length;c++){var i=e[c],u=o.base?i[0]+o.base:i[0],l=s[u]||0,p="".concat(u," ").concat(l);s[u]=l+1;var m=n(p),d={css:i[1],media:i[2],sourceMap:i[3],supports:i[4],layer:i[5]};if(-1!==m)t[m].references++,t[m].updater(d);else{var g=a(d,o);o.byIndex=c,t.splice(c,0,{identifier:p,updater:g,references:1})}r.push(p)}return r}function a(e,t){var n=t.domAPI(t);n.update(e);return function(t){if(t){if(t.css===e.css&&t.media===e.media&&t.sourceMap===e.sourceMap&&t.supports===e.supports&&t.layer===e.layer)return;n.update(e=t)}else n.remove()}}e.exports=function(e,a){var s=o(e=e||[],a=a||{});return function(e){e=e||[];for(var r=0;r<s.length;r++){var c=n(s[r]);t[c].references--}for(var i=o(e,a),u=0;u<s.length;u++){var l=n(s[u]);0===t[l].references&&(t[l].updater(),t.splice(l,1))}s=i}}},6052:(e,t,n)=>{n.d(t,{A:()=>c});var o=n(1601),a=n.n(o),s=n(6314),r=n.n(s)()(a());r.push([e.id,".graphics-content .touchButtons{width:100%;height:100%;position:absolute;top:0;left:0;z-index:11;pointer-events:none;display:none}.graphics-content .touchButtons.active{display:block}.graphics-content .touchButtons .btn-wrapper{position:absolute;width:auto;height:auto;user-select:none;pointer-events:auto;display:flex;align-items:center;justify-content:center;transform:translateZ(0)}.graphics-content .touchButtons .btn-wrapper.dimmed{opacity:.3;pointer-events:none}.graphics-content .touchButtons .btn{position:relative;width:auto;height:auto;user-select:none;pointer-events:none;transform:translateZ(0)}.graphics-content .touchButtons .btn img{pointer-events:none;image-rendering:-webkit-optimize-contrast;image-rendering:crisp-edges}.graphics-content .touchButtons .btn .normal{display:block}.graphics-content .touchButtons .btn .active{display:none}.graphics-content .touchButtons .btn.active .normal{display:none}.graphics-content .touchButtons .btn.active .active{display:block}.graphics-content .touchButtons .analog-stick{position:relative;width:auto;height:auto;user-select:none;pointer-events:none;transform:translateZ(0)}.graphics-content .touchButtons .analog-stick .analog-base{position:relative;width:auto;height:auto}.graphics-content .touchButtons .analog-stick .analog-base .base-image{display:block;pointer-events:none;image-rendering:-webkit-optimize-contrast;image-rendering:crisp-edges}.graphics-content .touchButtons .analog-stick .analog-thumb{position:absolute;top:50%;left:50%;transform:translate3d(-50%, -50%, 0);width:auto;height:auto;transition:transform .1s ease-out;will-change:transform;backface-visibility:hidden}.graphics-content .touchButtons .analog-stick .analog-thumb .thumb-image{display:block;pointer-events:none;image-rendering:-webkit-optimize-contrast;image-rendering:crisp-edges}.graphics-content .touchButtons.dimmed{opacity:.3;pointer-events:none}.graphics-content .touchButtons.dimmed .btn-wrapper{pointer-events:none}.graphics-content .touchButtons.hidden{opacity:0;pointer-events:none}.graphics-content .touchButtons.hidden .btn-wrapper{pointer-events:none}",""]);const c=r},6314:e=>{e.exports=function(e){var t=[];return t.toString=function(){return this.map((function(t){var n="",o=void 0!==t[5];return t[4]&&(n+="@supports (".concat(t[4],") {")),t[2]&&(n+="@media ".concat(t[2]," {")),o&&(n+="@layer".concat(t[5].length>0?" ".concat(t[5]):""," {")),n+=e(t),o&&(n+="}"),t[2]&&(n+="}"),t[4]&&(n+="}"),n})).join("")},t.i=function(e,n,o,a,s){"string"==typeof e&&(e=[[null,e,void 0]]);var r={};if(o)for(var c=0;c<this.length;c++){var i=this[c][0];null!=i&&(r[i]=!0)}for(var u=0;u<e.length;u++){var l=[].concat(e[u]);o&&r[l[0]]||(void 0!==s&&(void 0===l[5]||(l[1]="@layer".concat(l[5].length>0?" ".concat(l[5]):""," {").concat(l[1],"}")),l[5]=s),n&&(l[2]?(l[1]="@media ".concat(l[2]," {").concat(l[1],"}"),l[2]=n):l[2]=n),a&&(l[4]?(l[1]="@supports (".concat(l[4],") {").concat(l[1],"}"),l[4]=a):l[4]="".concat(a)),t.push(l))}},t}},7659:e=>{var t={};e.exports=function(e,n){var o=function(e){if(void 0===t[e]){var n=document.querySelector(e);if(window.HTMLIFrameElement&&n instanceof window.HTMLIFrameElement)try{n=n.contentDocument.head}catch(e){n=null}t[e]=n}return t[e]}(e);if(!o)throw new Error("Couldn't find a style target. This probably means that the value for the 'insert' parameter is invalid.");o.appendChild(n)}},7825:e=>{e.exports=function(e){if("undefined"==typeof document)return{update:function(){},remove:function(){}};var t=e.insertStyleElement(e);return{update:function(n){!function(e,t,n){var o="";n.supports&&(o+="@supports (".concat(n.supports,") {")),n.media&&(o+="@media ".concat(n.media," {"));var a=void 0!==n.layer;a&&(o+="@layer".concat(n.layer.length>0?" ".concat(n.layer):""," {")),o+=n.css,a&&(o+="}"),n.media&&(o+="}"),n.supports&&(o+="}");var s=n.sourceMap;s&&"undefined"!=typeof btoa&&(o+="\n/*# sourceMappingURL=data:application/json;base64,".concat(btoa(unescape(encodeURIComponent(JSON.stringify(s))))," */")),t.styleTagTransform(o,e,t.options)}(t,e,n)},remove:function(){!function(e){if(null===e.parentNode)return!1;e.parentNode.removeChild(e)}(t)}}}}},t={};function n(o){var a=t[o];if(void 0!==a)return a.exports;var s=t[o]={id:o,exports:{}};return e[o](s,s.exports,n),s.exports}n.n=e=>{var t=e&&e.__esModule?()=>e.default:()=>e;return n.d(t,{a:t}),t},n.d=(e,t)=>{for(var o in t)n.o(t,o)&&!n.o(e,o)&&Object.defineProperty(e,o,{enumerable:!0,get:t[o]})},n.o=(e,t)=>Object.prototype.hasOwnProperty.call(e,t),n.nc=void 0;var o=n(5072),a=n.n(o),s=n(7825),r=n.n(s),c=n(7659),i=n.n(c),u=n(5056),l=n.n(u),p=n(540),m=n.n(p),d=n(1113),g=n.n(d),h=n(6052),v={};v.styleTagTransform=g(),v.setAttributes=l(),v.insert=i().bind(null,"head"),v.domAPI=r(),v.insertStyleElement=m();a()(h.A,v);h.A&&h.A.locals&&h.A.locals;const f=PluginManager.parameters("Ten_touchButtons"),b="true"===String(f["Start Visible"]||"false");window.Ten_touchButtons={show(){$(".graphics-content .touchButtons").addClass("active")},hide(){$(".graphics-content .touchButtons").removeClass("active")}};const C=Game_Interpreter.prototype.pluginCommand;Game_Interpreter.prototype.pluginCommand=function(e,t){if(C.call(this,e,t),"ten_touchbuttons"===e.toLowerCase()){const e=t[0]?.toLowerCase();"show"===e?Ten_touchButtons.show():"hide"===e&&Ten_touchButtons.hide()}};const y=PluginManager.parameters("Ten_touchButtons")["GamePad Buttons"]||[],M=JSON.parse(y).map((e=>JSON.parse(e)));let S=null,w=null,B=null,_=null,T=[],k=!1,E=null,x=0;function D(){const e=$gameTemp&&$gameTemp._isSceneChoiceActive;return $gameMessage&&$gameMessage.isChoice()&&$gameMessage.isBusy()||e?"Scene_Choice":SceneManager._scene?SceneManager._scene.constructor.name:""}function I(e){if(!e||0===e.length)return!0;const t=D();return e.includes(t)}function N(){if(!w)return;const e="Scene_Choice"===D();e||(B=SceneManager._scene?SceneManager._scene.constructor.name:""),w.find(".btn-wrapper").each((function(t){const n=$(this),o=M[t],a=o["Visible Scenes"]||["Scene_Map"],s=a.includes("Scene_Choice"),r=a.includes(B),c=function(e){const t=e?.trim();if(!t||""===t||'""'===t||"''"===t)return!0;try{let e=t;return(e.startsWith('"')&&e.endsWith('"')||e.startsWith("'")&&e.endsWith("'"))&&(e=e.slice(1,-1)),e=e.replace(/\\"/g,'"').replace(/\\'/g,"'"),/^return\s+/.test(e)||(e="return "+e),new Function(e)()}catch(e){return!1}}(o["JavaScript Condition"]||"");let i=!1,u=!1;e?s&&c?(i=!0,u=!1):r&&c?(i=!0,u=!0):(i=!1,u=!1):r&&c?(i=!0,u=!1):(i=!1,u=!1),i?(n.show(),u?n.addClass("dimmed"):n.removeClass("dimmed")):(n.hide(),n.removeClass("dimmed"))}))}function A(){w=$('<div class="touchButtons"></div>').appendTo(".TenCore .graphics-content"),b&&w.addClass("active"),M.forEach((e=>{const t=e["Normal Image Base64"].replace(/^"(.*)"$/,"$1"),n=e["Active Image Base64"].replace(/^"(.*)"$/,"$1"),o=e.Method||"trigger",a=e.Command||"none",s=Number(e["Common Event"]||0),r=Number(e.X||0),c=Number(e.Y||0),i=Number(e.Scale||1),u=Number(e["Touch Padding"]||20),l=e["Visible Scenes"]||["Scene_Map"],p=$(`<div class="btn-wrapper" style="\n            position: absolute;\n            left: ${r}px;\n            top: ${c}px;\n            transform: scale(${i});\n            padding: ${u}px;\n            margin-left: -${u}px;\n            margin-top: -${u}px;\n        "></div>`);if("pressed"===o&&"MoveAnalog"===a){const e=$(`<div class="analog-stick">\n                <div class="analog-base">\n                    <img class="base-image" src="${t}">\n                </div>\n                <div class="analog-thumb">\n                    <img class="thumb-image" src="${n}">\n                </div>\n            </div>`);!function(e,t,n,o,a){let s,r,c,i,u=!1;const l=50;e.on("touchstart",(p=>{const m=$gameMessage&&$gameMessage.isChoice()&&$gameMessage.isBusy(),d=n.includes("Scene_Choice");if(!I(n))return void p.preventDefault();if(m&&!d)return void p.preventDefault();p.preventDefault();const g=p.touches[0],h=e[0].getBoundingClientRect();s=g.clientX,r=g.clientY,c=h.left+h.width/2,i=h.top+h.height/2,u=!0,_={$wrapper:e,$thumb:t.find(".analog-thumb"),centerX:c,centerY:i,radius:l,command:o,commonEvent:a},P(g.clientX,g.clientY)})),e.on("touchmove",(e=>{const t=$gameMessage&&$gameMessage.isChoice()&&$gameMessage.isBusy(),o=n.includes("Scene_Choice");I(n)&&(!t||o)?(e.preventDefault(),u&&_&&P(e.touches[0].clientX,e.touches[0].clientY)):e.preventDefault()})),e.on("touchend touchcancel",(()=>{u&&(u=!1,_&&_.$thumb&&(_.$thumb.css("transform","translate3d(-50%, -50%, 0)"),_=null),T.length>0&&(T.forEach((e=>{Input._currentState[e]=!1})),T=[]))})),e.on("mousedown",(p=>{const m=$gameMessage&&$gameMessage.isChoice()&&$gameMessage.isBusy(),d=n.includes("Scene_Choice");if(!I(n))return void p.preventDefault();if(m&&!d)return void p.preventDefault();p.preventDefault();const g=e[0].getBoundingClientRect();s=p.clientX,r=p.clientY,c=g.left+g.width/2,i=g.top+g.height/2,u=!0,_={$wrapper:e,$thumb:t.find(".analog-thumb"),centerX:c,centerY:i,radius:l,command:o,commonEvent:a},P(p.clientX,p.clientY)})),e.on("mousemove",(e=>{if(!u)return;const t=$gameMessage&&$gameMessage.isChoice()&&$gameMessage.isBusy(),o=n.includes("Scene_Choice");I(n)&&(!t||o)?(e.preventDefault(),_&&P(e.clientX,e.clientY)):e.preventDefault()})),e.on("mouseup mouseleave",(()=>{u&&(u=!1,_&&_.$thumb&&(_.$thumb.css("transform","translate3d(-50%, -50%, 0)"),_=null),T.length>0&&(T.forEach((e=>{Input._currentState[e]=!1})),T=[]))}))}(p,e,l,a,s),p.append(e)}else{const e=$(`<div class="btn">\n                <img class="normal" src="${t}">\n                <img class="active" src="${n}">\n            </div>`);"pressed"===o?function(e,t){e.on("touchstart",(n=>{const o=$gameMessage&&$gameMessage.isChoice()&&$gameMessage.isBusy(),a=t.includes("Scene_Choice");if(!I(t))return void n.preventDefault();if(o&&!a)return void n.preventDefault();n.preventDefault(),S&&S.btn.removeClass("active");const s=e.find(".btn");s.addClass("active");const r=[...document.querySelectorAll(".touchButtons .btn-wrapper")].indexOf(e[0]),c=M[r];S={btnWrapper:e,btn:s,command:c.Command||"none",commonEvent:Number(c["Common Event"]||0)}})),e.on("touchend touchcancel",(()=>{S&&(S.btn.removeClass("active"),S=null)})),e.on("mousedown",(e=>{const n=$gameMessage&&$gameMessage.isChoice()&&$gameMessage.isBusy(),o=t.includes("Scene_Choice");I(t)&&(!n||o)?(e.preventDefault(),k=!0,O(e)):e.preventDefault()})),e.on("mousemove",(e=>{if(!k)return;const n=$gameMessage&&$gameMessage.isChoice()&&$gameMessage.isBusy(),o=t.includes("Scene_Choice");I(t)&&(!n||o)?(e.preventDefault(),O(e)):e.preventDefault()})),e.on("mouseup mouseleave",(()=>{E&&(E.btn.removeClass("active"),E=null),k=!1}))}(p,l):"trigger"===o&&(p.on("touchstart",(t=>{const n=$gameMessage&&$gameMessage.isChoice()&&$gameMessage.isBusy(),o=l.includes("Scene_Choice");I(l)&&(!n||o)?(t.preventDefault(),e.addClass("active")):t.preventDefault()})),p.on("touchend touchcancel",(()=>{const t=$gameMessage&&$gameMessage.isChoice()&&$gameMessage.isBusy(),n=l.includes("Scene_Choice");I(l)&&(t&&!n||(e.removeClass("active"),a&&"none"!==a?X(a):s&&!$gameTemp.isCommonEventReserved()&&$gameTemp.reserveCommonEvent(s)))})),p.on("mousedown",(t=>{const n=$gameMessage&&$gameMessage.isChoice()&&$gameMessage.isBusy(),o=l.includes("Scene_Choice");I(l)&&(!n||o)?(t.preventDefault(),e.addClass("active")):t.preventDefault()})),p.on("mouseup",(()=>{const t=$gameMessage&&$gameMessage.isChoice()&&$gameMessage.isBusy(),n=l.includes("Scene_Choice");I(l)&&(t&&!n||(e.removeClass("active"),a&&"none"!==a?X(a):s&&!$gameTemp.isCommonEventReserved()&&$gameTemp.reserveCommonEvent(s)))}))),p.append(e)}w.append(p)}))}function P(e,t){if(!_||!_.$thumb)return;const n=Date.now();if(n-x<16)return;x=n;const{centerX:o,centerY:a,radius:s,$thumb:r}=_,c=e-o,i=t-a,u=Math.sqrt(c*c+i*i);let l=c,p=i;if(u>s&&(l=c/u*s,p=i/u*s),r.css("transform",`translate3d(calc(-50% + ${l}px), calc(-50% + ${p}px), 0)`),u>10){const e=function(e,t,n){const o=[],a=.3*n,s=t>a,r=e<-a,c=e>a;t<-a&&o.push("up");s&&o.push("down");r&&o.push("left");c&&o.push("right");return o}(l,p,s);JSON.stringify(e)!==JSON.stringify(T)&&(T.forEach((e=>{Input._currentState[e]=!1})),T=e,T.forEach((e=>{Input._currentState[e]=!0})))}else T.length>0&&(T.forEach((e=>{Input._currentState[e]=!1})),T=[])}function O(e){const t=e.clientX,n=e.clientY,o=document.querySelectorAll(".touchButtons .btn-wrapper");for(let e of o){const a=e.getBoundingClientRect();if(t>=a.left&&t<=a.right&&n>=a.top&&n<=a.bottom){if(!E||E.btnWrapper[0]!==e){E&&E.btn.removeClass("active");const t=$(e).find(".btn");t.addClass("active");const n=[...o].indexOf(e),a=M[n];E={btnWrapper:$(e),btn:t,command:a.Command||"none",commonEvent:Number(a["Common Event"]||0)}}return}}let a=null,s=1/0;for(let e of o){const o=e.getBoundingClientRect(),r=o.left+o.width/2,c=o.top+o.height/2,i=Math.sqrt(Math.pow(t-r,2)+Math.pow(n-c,2));i<s&&(s=i,a=e)}if(a&&s<=100){if(!E||E.btnWrapper[0]!==a){E&&E.btn.removeClass("active");const e=$(a).find(".btn");e.addClass("active");const t=[...o].indexOf(a),n=M[t];E={btnWrapper:$(a),btn:e,command:n.Command||"none",commonEvent:Number(n["Common Event"]||0)}}}else E&&(E.btn.removeClass("active"),E=null)}function X(e){if($gamePlayer)switch(e){case"MoveUp":Y("up");break;case"MoveDown":Y("down");break;case"MoveLeft":Y("left");break;case"MoveRight":Y("right");break;case"MoveAnalog":break;case"DashToggle":$gamePlayer.setMoveSpeed(4===$gamePlayer.moveSpeed()?5:4);break;case"Menu":$gameParty.inBattle()||SceneManager.push(Scene_Menu);break;case"Ok":Y("ok");break;case"Cancel":Y("cancel");break;case"PageUp":Y("pageup");break;case"PageDown":Y("pagedown")}}function Y(e){Input._currentState[e]=!0,setTimeout((()=>{Input._currentState[e]=!1}),100)}const R=Scene_Map.prototype.update;Scene_Map.prototype.update=function(){R.call(this),function(){if(!S||$gamePlayer.isMoving())return;const{command:e,commonEvent:t}=S;e&&"none"!==e?X(e):t&&!$gameTemp.isCommonEventReserved()&&$gameTemp.reserveCommonEvent(t)}(),N()};const W=Scene_Title.prototype.start;Scene_Title.prototype.start=function(){W.call(this),A()};const J=Scene_Base.prototype.update;Scene_Base.prototype.update=function(){J.call(this),N()};const L=Scene_Menu.prototype.update;Scene_Menu.prototype.update=function(){L.call(this),N()}})();