(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
!function(){"use strict";function t(t){var e=new XMLHttpRequest,n=d();t.encode&&(t.url+=encodeURI(t.encode(t.payload))),e.open(t.type.toUpperCase(),t.url),e.setRequestHeader("Content-Type",t.contentType);for(var i in t.headers)e.setRequestHeader(i,t.headers[i]);return e.onload=function(){e.status>=200&&e.status<=299?n.resolve(e.responseText):n.reject(e.responseText)},t.encode?e.send():e.send(JSON.stringify(t.payload)),n.promise}function e(t,e){e=e||{};for(var n in e)t[n]||(t[n]=e[n]);return t}function n(t){var e=this._constructor;if(e){var n={},i=function(){for(var t in n)this[t]=n[t];e.apply(this,arguments)},r={};for(var o in e.prototype)Object.prototype.hasOwnProperty.call(e.prototype,o)&&(r[o]=e.prototype[o]);for(var s in t)if(Object.prototype.hasOwnProperty.call(t,s)){var a=t[s];"function"==typeof a?r[s]=t[s]:n[s]=t[s]}return i.prototype=Object.create(r),i}}function i(t){var e=1;return function(){var n=t+e;return e++,n}}function r(t){for(var e in t){var n=e.split(" "),i=n[0],r=this.shadowRoot.querySelector(n[1]),o=t[e],s=this[o]=this[o].bind(this);r.addEventListener(i,s)}}function o(t){for(var e in t)switch(e){case"exends":break;case"onCreate":break;case"onDetach":break;case"onAttributesChange":break;case"onAttach":break;case"tagName":break;case"fragment":break;case"style":break;case"events":break;default:this[e]=t[e]}}function s(){return this._currentState[this._currentState.length-1]}function a(t,e){return!!t.className.match(new RegExp("(\\s|^)"+e+"(\\s|$)"))}function u(t){return t=t.replace(/[.#]/,function(t){return","+t+","}).split(",")}function c(t,e){switch(typeof e){case"function":return e.apply(this,arguments);case"string":return e}}var h=function(){this.head=null,this.tail=null};h.prototype.addToTail=function(t){var e={func:t,next:null};this.head||(this.head=e,this.head.next=this.tail),this.tail&&(this.tail.next=e),this.tail=e},h.prototype.removeHead=function(){var t;return this.head&&(t=this.head.func),this.head.next?this.head=this.head.next:(this.tail=null,this.head=null),t};var p={},l={},f={},d=function(){function t(){n&&console.error(n),e&&e.call(this,i),a=null,u=null,e=null,n=null,i=null,r=null}var e,n,i,r,o={},s=p,a=new h,u=new h;return o.resolve=function(e){setTimeout(function(){if(s===f||!a.head)return void t();s=l,i=e,r=a.removeHead();try{i=r.call(this,e)}catch(u){return s=f,n=u,void o.reject(u)}return i&&"function"==typeof i.then?void i.then(o.resolve):void o.resolve(i)}.bind(this),0)},o.reject=function(e){setTimeout(function(){if(s===l||!u.head)return void t();s=f,n=e,r=u.removeHead();try{r.call(this,n)}catch(i){return n=i,void o.reject(n)}o.reject(n)}.bind(this),0)},o.promise=function(){var t={};return t.then=function(e){return a.addToTail(e),t},t["catch"]=function(e){return u.addToTail(e),t},t.done=function(t){e=t},t}(),o},y=function(){};y.prototype.register=function(t){var e={};return function(n){var i={};return i.subscribe=function(i,r){n._subscribe(i,r,t,e)},i.publish=function(t,i,r){n._publish(t,i,r,e)},i.unsubscribe=function(i,r){n._unsubscribe(i,r,t,e)},i.unsubscribeAll=function(i){n._unsubscribeAll(i,t,e)},i}(this)},y.prototype._subscribe=function(t,e,n,i){if(i[t]||(i[t]={}),i[t][n]||(i[t][n]=[]),"function"!=typeof e)throw new Error("A callback function must be passed in to subscribe");i[t][n].push(e)},y.prototype._publish=function(t,e,n,i){function r(t,e){return function(n){n.call(this,t,e)}}e=e||null,n=n||null;var o=i[t];if(o)for(var s in o){var a=o[s];Array.isArray(a)&&a.forEach(r.call(this,e,n))}},y.prototype._unsubscribe=function(t,e,n,i){var r=i[t];if(r){var o=r[n];o.forEach(function(t,n){return t===e?void o.splice(n,1):void 0}.bind(this))}},y.prototype._unsubscribeAll=function(t,e,n){function i(t){var i=n[t];i&&i[e]&&delete i[e]}if(t)return void i(t);for(var r in n)i(r)};var v={},b=i("factory");v._constructor=function(t){this._initialize(t)},v._constructor.prototype._initialize=function(t){var n={};t=t||{},this.uuid=b(),this.resources={},this.eventBus=t.eventBus||new y,this.eventBus=this.eventBus.register(this.uuid),this.set=function(t,e){this._set(t,e,n)},this.unset=function(t){this._unset(t,n)},this.get=function(t){return this._get(t,n)},this.clone=function(){return JSON.parse(JSON.stringify(n))},"function"==typeof this.initialize&&this.initialize.apply(this,arguments),this.set(e(t,this.defaults)),this.eventBus.publish("initialize",this,t)},v._constructor.prototype._set=function(t,e,n){if("object"==typeof t&&!Array.isArray(t))for(var i in t)this._set(i,t[i],n);if("string"==typeof t){n[t]=e;var r={};r[t]=e,this.eventBus.publish("change",this,r),this.eventBus.publish("change:"+t,this,e)}},v._constructor.prototype._get=function(t,e){return"string"==typeof t?e[t]:"undefined"==typeof t?e:void 0},v._constructor.prototype._unset=function(t,e){if("string"==typeof t){var n={};n[t]=e[t],delete e[t],this.eventBus.publish("delete",this,n),this.eventBus.publish("delete:"+t,this,n[t])}else if("undefined"==typeof t)for(var i in e)this._unset(i,e)},v._constructor.prototype.sync=function(t,e){this.resources[t]=t,t.eventBus.subscribe("change:"+e,function(t,e){for(var n in e)this.set(n,e[n])}.bind(this)),t.eventBus.subscribe("delete:"+e,function(t,e){this.unset()}.bind(this))},v.extend=n;var g=i("service"),m={};m._constructor=function(t){this._initialize(t)},m._constructor.prototype._initialize=function(t){this.uuid=g(),"function"==typeof this.initialize&&this.initialize.apply(this,arguments)},m._constructor.prototype.subscribeAll=function(t,e){for(var n in e){var i=e[n],r=this[i]=this[i].bind(this);t.eventBus.subscribe(n,r)}},m.extend=n;var _=i("component"),x={},C={};C.register=function(t){if(x[t.tagName])return x[t.tagName];var e={},n=Object.create(HTMLElement.prototype);return o.call(n,t),n.createdCallback=function(){var e=this.createShadowRoot();e.appendChild(t.fragment.cloneNode(!0)),this.uuid=_(),t.style&&e.appendChild(t.style.cloneNode(!0)),t.onCreate&&t.onCreate.apply(this,arguments)},n.attachedCallback=function(){t.onAttach&&t.onAttach.apply(this,arguments),r.call(this,t.events)},n.detachedCallback=function(){t.onDetach&&t.onDetach.apply(this,arguments)},n.attributeChangedCallback=function(e,n,i){t.onAttributesChange&&t.onAttributesChange[e].apply(this,[n,i])},e.prototype=n,t["extends"]&&(e["extends"]=t["extends"]),x[t.tagName]=document.registerElement(t.tagName,e),x[t.tagName]},C.extend=function(t,e){var n=x[t],i={},s=Object.create(HTMLElement.prototype);return o.call(s,e),s.createdCallback=function(){n.prototype.createdCallback.apply(this,arguments),e.onCreate&&e.onCreate.apply(this,arguments)},s.attachedCallback=function(){n.prototype.attachedCallback.apply(this,arguments),e.onAttach&&e.onAttach.apply(this,arguments),r.call(this,e.events)},s.detachedCallback=function(){n.prototype.detachedCallback.apply(this,arguments),e.onDetach&&e.onDetach.apply(this,arguments)},s.attributeChangedCallback=function(t,i,r){n.prototype.attributeChangedCallback.apply(this,arguments),e.onAttributesChange&&e.onAttributesChange[t].apply(this,[i,r])},i.prototype=s,document.registerElement(e.tagName,i)};var w={},E={},k=function(){};k.prototype.stringify=function(t){var e="";for(var n in t){e+=n+"{";var i=t[n];for(var r in i){var o=i[r];e+=r+":"+o+";"}e=e.slice(0,e.length-1),e+="}"}return e},k.prototype.createStyleTag=function(t){var e=document.createElement("style");return t=this.stringify(t),e.innerText=t,e},k.prototype.registerMixins=function(t,e){w[t]=e},k.prototype.registerVariables=function(t,e){E[t]=e},k.prototype.getVariable=function(t){return E[t]?E[t]:void console.error("Variable "+t+" does not exist.")},k.prototype.toHex=function(t){function e(t){var e=t.toString(16);return 1==e.length?"0"+e:e}return t=t.replace(" ","").split(","),"#"+e(t[0])+e(t[1])+e(t[2])},k.prototype.toRGB=function(t){var e=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(t);return e?"rgb("+[parseInt(e[1],16),parseInt(e[2],16),parseInt(e[3],16)].join(",")+")":null},k.prototype.toRGBa=function(t,e){var n=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(t);return n?"rgba("+[parseInt(n[1],16),parseInt(n[2],16),parseInt(n[3],16),e].join(",")+")":null},k.prototype.getMixins=function(t){return w[t]?w[t]:void console.error("Mixin "+t+" does not exist.")};var A={},q=function(){};q.prototype["export"]=function(t,e){if("string"!=typeof t)throw new Error("Module name is not a string.");if("function"!=typeof e)throw new Error("Module is not a function.");A[t]=function(t){t(e())}},q.prototype["import"]=function(t){function e(s){var a=t[s];if("string"!=typeof s)throw new Error("Module name is not a string.");if("string"!=typeof a)throw new Error("URL is not a string.");var u=A[s];if(u)r.resolve(u());else{var c=document.createElement("script");c.type="text/javascript",c.src=a,c.onload=function(){var t=d();console.log("Loading "+s+"..."),t.promise.then(function(t){o[s]=t,n++,0===i.length?r.resolve(o):e(i.pop())}),c.remove(),A[s](t.resolve)}.bind(this,s),document.body.appendChild(c)}}var n=0,i=Object.keys(t),r=d(),o={};return e(i.pop()),r.promise.and={},r.promise.and["export"]=function(t,e){A[t]=function(n){r.promise.then(function(n){return A[t]=e.bind(this,n),e.call(this,n)}.bind(this)).done(n)}}.bind(this),r.promise.and["import"]=function(t){return r.promise.then(this["import"].bind(this,t))}.bind(this),r.promise};var B=v.extend({ajax:function(e){function n(t){return"DELETE"===e.type.toUpperCase()?Array.isArray(t)?t.forEach(function(t){this.unset(t[e.indexBy],t)}.bind(this)):"object"==typeof t&&this.unset(t[e.indexBy],t):Array.isArray(t)?t.forEach(function(t){this.set(t[e.indexBy],t)}.bind(this)):"object"==typeof t&&this.set(t[e.indexBy],t),t}function i(t){return e.parse?e.parse(t):this.parse(t)}if(!e.url)throw new Error("Url is required.");if(!e.type)throw new Error("Request type is required.");return e.contentType=e.contentType||"application/json",e.encode=e.encode||null,e.payload=e.payload||null,e.indexBy=e.indexBy||"id",t(e).then(i.bind(this)).then(n.bind(this))},parse:function(t){return JSON.parse(t)}}),T={},j=function(){};j.prototype.register=function(t){if(T[t])throw new Error("Resource "+t+" already exist.");return T[t]=new B,T[t]},j.prototype.get=function(t){return T[t]?T[t]:this.register(t)};var N=function(){};N.prototype.createTemplate=function(){return new S};var S=function(){this._currentState=[],this._queue=[],this._conditional=void 0,this._state=void 0,this._loop=void 0,this._start=void 0};S.prototype.create=function(t){t=u(t);var e=function(){var e=document.createElement(t[0]);"."===t[1]?e.className=t[2]:"#"===t[1]&&(e.id=t[2]),this._currentState.push(e)}.bind(this);return this._queue.push({type:"open",fn:e}),this},S.prototype.addClass=function(t){var e=function(e){var n=s.call(this);t=c(e,t);var i=n.className.length>0?" ":"";a(n,t)||(n.className+=i+t)}.bind(this);return this._queue.push({type:"addClass",fn:e}),this},S.prototype.text=function(t){var e=function(e){var n=s.call(this);n.textContent=c(e,t)}.bind(this);return this._queue.push({type:"text",fn:e}),this},S.prototype.attr=function(t,e){var n=function(n){var i=s.call(this);i.setAttribute(c(n,t),c(n,e))}.bind(this);return this._queue.push({type:"attr",fn:n}),this},S.prototype.style=function(t,e){var n=function(n){var i=s.call(this);i.style[c(n,t)]=c(n,e)}.bind(this);return this._queue.push({type:"style",fn:n}),this},S.prototype.removeClass=function(t){var e=function(e){var n=s.call(this);if(t=c(e,t),a(n,t)){var i=new RegExp("(\\s|^)"+t+"(\\s|$)");n.className=n.className.replace(i," ")}}.bind(this);return this._queue.push({type:"removeClass",fn:e}),this},S.prototype.append=function(){var t=function(t){var e=this._currentState.pop();if(0===this._currentState.length)this.previousFragment.appendChild(e);else{var n=s.call(this);n.appendChild(e)}}.bind(this);return this._queue.push({type:"close",fn:t}),this},S.prototype.appendLast=function(){var t=function(t){var e=this._currentState.pop();this.previousFragment.appendChild(e)}.bind(this);return this._queue.push({type:"end",fn:t}),this},S.prototype["if"]=function(t){var e=function(e){this._state="conditional",t=c(e,t),this._conditional=!!t}.bind(this);return this._queue.push({type:"if",fn:e}),this},S.prototype["else"]=function(){var t=function(t){this._conditional=!this._conditional}.bind(this);return this._queue.push({type:"else",fn:t}),this},S.prototype.each=function(t){var e=function(e,n){this._loop=c(e,t),this._state="loop",this._start=n}.bind(this);return this._queue.push({type:"each",fn:e}),this},S.prototype.done=function(){var t=function(t,e){this._conditional=void 0,this._state=void 0}.bind(this);return this._queue.push({type:"done",fn:t}),this},S.prototype.render=function(t){return this.previousFragment=document.createDocumentFragment(),this._queue.forEach(function(e,n){switch(this._state){case"conditional":(this._conditional||"else"===e.type||"done"===e.type)&&e.fn(t,n);break;case"loop":"done"===e.type&&(this._loop.forEach(function(t,e){for(var i=this._start+1;n>i;i++){var r=this._queue[i];r.fn(t,e)}}.bind(this)),e.fn(t,n));break;default:e.fn(t,n)}}.bind(this)),this.previousFragment};var R=new y,O={Factory:v,Service:m,Component:C,Vow:d,Stylizer:new k,Renderer:new N,Module:new q,Resource:new j};O.registerGlobalEventBus=function(t){return R.register(t)},window.Trio=O}();
},{}],2:[function(require,module,exports){
require('trio');
},{"trio":1}]},{},[2])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIuLi9UcmluaXR5SlMvZGlzdC90cmlvLm1pbi5qcyIsImNsaWVudC9zcmMvbGliLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7O0FDQUEiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiIWZ1bmN0aW9uKCl7XCJ1c2Ugc3RyaWN0XCI7ZnVuY3Rpb24gdCh0KXt2YXIgZT1uZXcgWE1MSHR0cFJlcXVlc3Qsbj1kKCk7dC5lbmNvZGUmJih0LnVybCs9ZW5jb2RlVVJJKHQuZW5jb2RlKHQucGF5bG9hZCkpKSxlLm9wZW4odC50eXBlLnRvVXBwZXJDYXNlKCksdC51cmwpLGUuc2V0UmVxdWVzdEhlYWRlcihcIkNvbnRlbnQtVHlwZVwiLHQuY29udGVudFR5cGUpO2Zvcih2YXIgaSBpbiB0LmhlYWRlcnMpZS5zZXRSZXF1ZXN0SGVhZGVyKGksdC5oZWFkZXJzW2ldKTtyZXR1cm4gZS5vbmxvYWQ9ZnVuY3Rpb24oKXtlLnN0YXR1cz49MjAwJiZlLnN0YXR1czw9Mjk5P24ucmVzb2x2ZShlLnJlc3BvbnNlVGV4dCk6bi5yZWplY3QoZS5yZXNwb25zZVRleHQpfSx0LmVuY29kZT9lLnNlbmQoKTplLnNlbmQoSlNPTi5zdHJpbmdpZnkodC5wYXlsb2FkKSksbi5wcm9taXNlfWZ1bmN0aW9uIGUodCxlKXtlPWV8fHt9O2Zvcih2YXIgbiBpbiBlKXRbbl18fCh0W25dPWVbbl0pO3JldHVybiB0fWZ1bmN0aW9uIG4odCl7dmFyIGU9dGhpcy5fY29uc3RydWN0b3I7aWYoZSl7dmFyIG49e30saT1mdW5jdGlvbigpe2Zvcih2YXIgdCBpbiBuKXRoaXNbdF09blt0XTtlLmFwcGx5KHRoaXMsYXJndW1lbnRzKX0scj17fTtmb3IodmFyIG8gaW4gZS5wcm90b3R5cGUpT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKGUucHJvdG90eXBlLG8pJiYocltvXT1lLnByb3RvdHlwZVtvXSk7Zm9yKHZhciBzIGluIHQpaWYoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHQscykpe3ZhciBhPXRbc107XCJmdW5jdGlvblwiPT10eXBlb2YgYT9yW3NdPXRbc106bltzXT10W3NdfXJldHVybiBpLnByb3RvdHlwZT1PYmplY3QuY3JlYXRlKHIpLGl9fWZ1bmN0aW9uIGkodCl7dmFyIGU9MTtyZXR1cm4gZnVuY3Rpb24oKXt2YXIgbj10K2U7cmV0dXJuIGUrKyxufX1mdW5jdGlvbiByKHQpe2Zvcih2YXIgZSBpbiB0KXt2YXIgbj1lLnNwbGl0KFwiIFwiKSxpPW5bMF0scj10aGlzLnNoYWRvd1Jvb3QucXVlcnlTZWxlY3RvcihuWzFdKSxvPXRbZV0scz10aGlzW29dPXRoaXNbb10uYmluZCh0aGlzKTtyLmFkZEV2ZW50TGlzdGVuZXIoaSxzKX19ZnVuY3Rpb24gbyh0KXtmb3IodmFyIGUgaW4gdClzd2l0Y2goZSl7Y2FzZVwiZXhlbmRzXCI6YnJlYWs7Y2FzZVwib25DcmVhdGVcIjpicmVhaztjYXNlXCJvbkRldGFjaFwiOmJyZWFrO2Nhc2VcIm9uQXR0cmlidXRlc0NoYW5nZVwiOmJyZWFrO2Nhc2VcIm9uQXR0YWNoXCI6YnJlYWs7Y2FzZVwidGFnTmFtZVwiOmJyZWFrO2Nhc2VcImZyYWdtZW50XCI6YnJlYWs7Y2FzZVwic3R5bGVcIjpicmVhaztjYXNlXCJldmVudHNcIjpicmVhaztkZWZhdWx0OnRoaXNbZV09dFtlXX19ZnVuY3Rpb24gcygpe3JldHVybiB0aGlzLl9jdXJyZW50U3RhdGVbdGhpcy5fY3VycmVudFN0YXRlLmxlbmd0aC0xXX1mdW5jdGlvbiBhKHQsZSl7cmV0dXJuISF0LmNsYXNzTmFtZS5tYXRjaChuZXcgUmVnRXhwKFwiKFxcXFxzfF4pXCIrZStcIihcXFxcc3wkKVwiKSl9ZnVuY3Rpb24gdSh0KXtyZXR1cm4gdD10LnJlcGxhY2UoL1suI10vLGZ1bmN0aW9uKHQpe3JldHVyblwiLFwiK3QrXCIsXCJ9KS5zcGxpdChcIixcIil9ZnVuY3Rpb24gYyh0LGUpe3N3aXRjaCh0eXBlb2YgZSl7Y2FzZVwiZnVuY3Rpb25cIjpyZXR1cm4gZS5hcHBseSh0aGlzLGFyZ3VtZW50cyk7Y2FzZVwic3RyaW5nXCI6cmV0dXJuIGV9fXZhciBoPWZ1bmN0aW9uKCl7dGhpcy5oZWFkPW51bGwsdGhpcy50YWlsPW51bGx9O2gucHJvdG90eXBlLmFkZFRvVGFpbD1mdW5jdGlvbih0KXt2YXIgZT17ZnVuYzp0LG5leHQ6bnVsbH07dGhpcy5oZWFkfHwodGhpcy5oZWFkPWUsdGhpcy5oZWFkLm5leHQ9dGhpcy50YWlsKSx0aGlzLnRhaWwmJih0aGlzLnRhaWwubmV4dD1lKSx0aGlzLnRhaWw9ZX0saC5wcm90b3R5cGUucmVtb3ZlSGVhZD1mdW5jdGlvbigpe3ZhciB0O3JldHVybiB0aGlzLmhlYWQmJih0PXRoaXMuaGVhZC5mdW5jKSx0aGlzLmhlYWQubmV4dD90aGlzLmhlYWQ9dGhpcy5oZWFkLm5leHQ6KHRoaXMudGFpbD1udWxsLHRoaXMuaGVhZD1udWxsKSx0fTt2YXIgcD17fSxsPXt9LGY9e30sZD1mdW5jdGlvbigpe2Z1bmN0aW9uIHQoKXtuJiZjb25zb2xlLmVycm9yKG4pLGUmJmUuY2FsbCh0aGlzLGkpLGE9bnVsbCx1PW51bGwsZT1udWxsLG49bnVsbCxpPW51bGwscj1udWxsfXZhciBlLG4saSxyLG89e30scz1wLGE9bmV3IGgsdT1uZXcgaDtyZXR1cm4gby5yZXNvbHZlPWZ1bmN0aW9uKGUpe3NldFRpbWVvdXQoZnVuY3Rpb24oKXtpZihzPT09Znx8IWEuaGVhZClyZXR1cm4gdm9pZCB0KCk7cz1sLGk9ZSxyPWEucmVtb3ZlSGVhZCgpO3RyeXtpPXIuY2FsbCh0aGlzLGUpfWNhdGNoKHUpe3JldHVybiBzPWYsbj11LHZvaWQgby5yZWplY3QodSl9cmV0dXJuIGkmJlwiZnVuY3Rpb25cIj09dHlwZW9mIGkudGhlbj92b2lkIGkudGhlbihvLnJlc29sdmUpOnZvaWQgby5yZXNvbHZlKGkpfS5iaW5kKHRoaXMpLDApfSxvLnJlamVjdD1mdW5jdGlvbihlKXtzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7aWYocz09PWx8fCF1LmhlYWQpcmV0dXJuIHZvaWQgdCgpO3M9ZixuPWUscj11LnJlbW92ZUhlYWQoKTt0cnl7ci5jYWxsKHRoaXMsbil9Y2F0Y2goaSl7cmV0dXJuIG49aSx2b2lkIG8ucmVqZWN0KG4pfW8ucmVqZWN0KG4pfS5iaW5kKHRoaXMpLDApfSxvLnByb21pc2U9ZnVuY3Rpb24oKXt2YXIgdD17fTtyZXR1cm4gdC50aGVuPWZ1bmN0aW9uKGUpe3JldHVybiBhLmFkZFRvVGFpbChlKSx0fSx0W1wiY2F0Y2hcIl09ZnVuY3Rpb24oZSl7cmV0dXJuIHUuYWRkVG9UYWlsKGUpLHR9LHQuZG9uZT1mdW5jdGlvbih0KXtlPXR9LHR9KCksb30seT1mdW5jdGlvbigpe307eS5wcm90b3R5cGUucmVnaXN0ZXI9ZnVuY3Rpb24odCl7dmFyIGU9e307cmV0dXJuIGZ1bmN0aW9uKG4pe3ZhciBpPXt9O3JldHVybiBpLnN1YnNjcmliZT1mdW5jdGlvbihpLHIpe24uX3N1YnNjcmliZShpLHIsdCxlKX0saS5wdWJsaXNoPWZ1bmN0aW9uKHQsaSxyKXtuLl9wdWJsaXNoKHQsaSxyLGUpfSxpLnVuc3Vic2NyaWJlPWZ1bmN0aW9uKGkscil7bi5fdW5zdWJzY3JpYmUoaSxyLHQsZSl9LGkudW5zdWJzY3JpYmVBbGw9ZnVuY3Rpb24oaSl7bi5fdW5zdWJzY3JpYmVBbGwoaSx0LGUpfSxpfSh0aGlzKX0seS5wcm90b3R5cGUuX3N1YnNjcmliZT1mdW5jdGlvbih0LGUsbixpKXtpZihpW3RdfHwoaVt0XT17fSksaVt0XVtuXXx8KGlbdF1bbl09W10pLFwiZnVuY3Rpb25cIiE9dHlwZW9mIGUpdGhyb3cgbmV3IEVycm9yKFwiQSBjYWxsYmFjayBmdW5jdGlvbiBtdXN0IGJlIHBhc3NlZCBpbiB0byBzdWJzY3JpYmVcIik7aVt0XVtuXS5wdXNoKGUpfSx5LnByb3RvdHlwZS5fcHVibGlzaD1mdW5jdGlvbih0LGUsbixpKXtmdW5jdGlvbiByKHQsZSl7cmV0dXJuIGZ1bmN0aW9uKG4pe24uY2FsbCh0aGlzLHQsZSl9fWU9ZXx8bnVsbCxuPW58fG51bGw7dmFyIG89aVt0XTtpZihvKWZvcih2YXIgcyBpbiBvKXt2YXIgYT1vW3NdO0FycmF5LmlzQXJyYXkoYSkmJmEuZm9yRWFjaChyLmNhbGwodGhpcyxlLG4pKX19LHkucHJvdG90eXBlLl91bnN1YnNjcmliZT1mdW5jdGlvbih0LGUsbixpKXt2YXIgcj1pW3RdO2lmKHIpe3ZhciBvPXJbbl07by5mb3JFYWNoKGZ1bmN0aW9uKHQsbil7cmV0dXJuIHQ9PT1lP3ZvaWQgby5zcGxpY2UobiwxKTp2b2lkIDB9LmJpbmQodGhpcykpfX0seS5wcm90b3R5cGUuX3Vuc3Vic2NyaWJlQWxsPWZ1bmN0aW9uKHQsZSxuKXtmdW5jdGlvbiBpKHQpe3ZhciBpPW5bdF07aSYmaVtlXSYmZGVsZXRlIGlbZV19aWYodClyZXR1cm4gdm9pZCBpKHQpO2Zvcih2YXIgciBpbiBuKWkocil9O3ZhciB2PXt9LGI9aShcImZhY3RvcnlcIik7di5fY29uc3RydWN0b3I9ZnVuY3Rpb24odCl7dGhpcy5faW5pdGlhbGl6ZSh0KX0sdi5fY29uc3RydWN0b3IucHJvdG90eXBlLl9pbml0aWFsaXplPWZ1bmN0aW9uKHQpe3ZhciBuPXt9O3Q9dHx8e30sdGhpcy51dWlkPWIoKSx0aGlzLnJlc291cmNlcz17fSx0aGlzLmV2ZW50QnVzPXQuZXZlbnRCdXN8fG5ldyB5LHRoaXMuZXZlbnRCdXM9dGhpcy5ldmVudEJ1cy5yZWdpc3Rlcih0aGlzLnV1aWQpLHRoaXMuc2V0PWZ1bmN0aW9uKHQsZSl7dGhpcy5fc2V0KHQsZSxuKX0sdGhpcy51bnNldD1mdW5jdGlvbih0KXt0aGlzLl91bnNldCh0LG4pfSx0aGlzLmdldD1mdW5jdGlvbih0KXtyZXR1cm4gdGhpcy5fZ2V0KHQsbil9LHRoaXMuY2xvbmU9ZnVuY3Rpb24oKXtyZXR1cm4gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShuKSl9LFwiZnVuY3Rpb25cIj09dHlwZW9mIHRoaXMuaW5pdGlhbGl6ZSYmdGhpcy5pbml0aWFsaXplLmFwcGx5KHRoaXMsYXJndW1lbnRzKSx0aGlzLnNldChlKHQsdGhpcy5kZWZhdWx0cykpLHRoaXMuZXZlbnRCdXMucHVibGlzaChcImluaXRpYWxpemVcIix0aGlzLHQpfSx2Ll9jb25zdHJ1Y3Rvci5wcm90b3R5cGUuX3NldD1mdW5jdGlvbih0LGUsbil7aWYoXCJvYmplY3RcIj09dHlwZW9mIHQmJiFBcnJheS5pc0FycmF5KHQpKWZvcih2YXIgaSBpbiB0KXRoaXMuX3NldChpLHRbaV0sbik7aWYoXCJzdHJpbmdcIj09dHlwZW9mIHQpe25bdF09ZTt2YXIgcj17fTtyW3RdPWUsdGhpcy5ldmVudEJ1cy5wdWJsaXNoKFwiY2hhbmdlXCIsdGhpcyxyKSx0aGlzLmV2ZW50QnVzLnB1Ymxpc2goXCJjaGFuZ2U6XCIrdCx0aGlzLGUpfX0sdi5fY29uc3RydWN0b3IucHJvdG90eXBlLl9nZXQ9ZnVuY3Rpb24odCxlKXtyZXR1cm5cInN0cmluZ1wiPT10eXBlb2YgdD9lW3RdOlwidW5kZWZpbmVkXCI9PXR5cGVvZiB0P2U6dm9pZCAwfSx2Ll9jb25zdHJ1Y3Rvci5wcm90b3R5cGUuX3Vuc2V0PWZ1bmN0aW9uKHQsZSl7aWYoXCJzdHJpbmdcIj09dHlwZW9mIHQpe3ZhciBuPXt9O25bdF09ZVt0XSxkZWxldGUgZVt0XSx0aGlzLmV2ZW50QnVzLnB1Ymxpc2goXCJkZWxldGVcIix0aGlzLG4pLHRoaXMuZXZlbnRCdXMucHVibGlzaChcImRlbGV0ZTpcIit0LHRoaXMsblt0XSl9ZWxzZSBpZihcInVuZGVmaW5lZFwiPT10eXBlb2YgdClmb3IodmFyIGkgaW4gZSl0aGlzLl91bnNldChpLGUpfSx2Ll9jb25zdHJ1Y3Rvci5wcm90b3R5cGUuc3luYz1mdW5jdGlvbih0LGUpe3RoaXMucmVzb3VyY2VzW3RdPXQsdC5ldmVudEJ1cy5zdWJzY3JpYmUoXCJjaGFuZ2U6XCIrZSxmdW5jdGlvbih0LGUpe2Zvcih2YXIgbiBpbiBlKXRoaXMuc2V0KG4sZVtuXSl9LmJpbmQodGhpcykpLHQuZXZlbnRCdXMuc3Vic2NyaWJlKFwiZGVsZXRlOlwiK2UsZnVuY3Rpb24odCxlKXt0aGlzLnVuc2V0KCl9LmJpbmQodGhpcykpfSx2LmV4dGVuZD1uO3ZhciBnPWkoXCJzZXJ2aWNlXCIpLG09e307bS5fY29uc3RydWN0b3I9ZnVuY3Rpb24odCl7dGhpcy5faW5pdGlhbGl6ZSh0KX0sbS5fY29uc3RydWN0b3IucHJvdG90eXBlLl9pbml0aWFsaXplPWZ1bmN0aW9uKHQpe3RoaXMudXVpZD1nKCksXCJmdW5jdGlvblwiPT10eXBlb2YgdGhpcy5pbml0aWFsaXplJiZ0aGlzLmluaXRpYWxpemUuYXBwbHkodGhpcyxhcmd1bWVudHMpfSxtLl9jb25zdHJ1Y3Rvci5wcm90b3R5cGUuc3Vic2NyaWJlQWxsPWZ1bmN0aW9uKHQsZSl7Zm9yKHZhciBuIGluIGUpe3ZhciBpPWVbbl0scj10aGlzW2ldPXRoaXNbaV0uYmluZCh0aGlzKTt0LmV2ZW50QnVzLnN1YnNjcmliZShuLHIpfX0sbS5leHRlbmQ9bjt2YXIgXz1pKFwiY29tcG9uZW50XCIpLHg9e30sQz17fTtDLnJlZ2lzdGVyPWZ1bmN0aW9uKHQpe2lmKHhbdC50YWdOYW1lXSlyZXR1cm4geFt0LnRhZ05hbWVdO3ZhciBlPXt9LG49T2JqZWN0LmNyZWF0ZShIVE1MRWxlbWVudC5wcm90b3R5cGUpO3JldHVybiBvLmNhbGwobix0KSxuLmNyZWF0ZWRDYWxsYmFjaz1mdW5jdGlvbigpe3ZhciBlPXRoaXMuY3JlYXRlU2hhZG93Um9vdCgpO2UuYXBwZW5kQ2hpbGQodC5mcmFnbWVudC5jbG9uZU5vZGUoITApKSx0aGlzLnV1aWQ9XygpLHQuc3R5bGUmJmUuYXBwZW5kQ2hpbGQodC5zdHlsZS5jbG9uZU5vZGUoITApKSx0Lm9uQ3JlYXRlJiZ0Lm9uQ3JlYXRlLmFwcGx5KHRoaXMsYXJndW1lbnRzKX0sbi5hdHRhY2hlZENhbGxiYWNrPWZ1bmN0aW9uKCl7dC5vbkF0dGFjaCYmdC5vbkF0dGFjaC5hcHBseSh0aGlzLGFyZ3VtZW50cyksci5jYWxsKHRoaXMsdC5ldmVudHMpfSxuLmRldGFjaGVkQ2FsbGJhY2s9ZnVuY3Rpb24oKXt0Lm9uRGV0YWNoJiZ0Lm9uRGV0YWNoLmFwcGx5KHRoaXMsYXJndW1lbnRzKX0sbi5hdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2s9ZnVuY3Rpb24oZSxuLGkpe3Qub25BdHRyaWJ1dGVzQ2hhbmdlJiZ0Lm9uQXR0cmlidXRlc0NoYW5nZVtlXS5hcHBseSh0aGlzLFtuLGldKX0sZS5wcm90b3R5cGU9bix0W1wiZXh0ZW5kc1wiXSYmKGVbXCJleHRlbmRzXCJdPXRbXCJleHRlbmRzXCJdKSx4W3QudGFnTmFtZV09ZG9jdW1lbnQucmVnaXN0ZXJFbGVtZW50KHQudGFnTmFtZSxlKSx4W3QudGFnTmFtZV19LEMuZXh0ZW5kPWZ1bmN0aW9uKHQsZSl7dmFyIG49eFt0XSxpPXt9LHM9T2JqZWN0LmNyZWF0ZShIVE1MRWxlbWVudC5wcm90b3R5cGUpO3JldHVybiBvLmNhbGwocyxlKSxzLmNyZWF0ZWRDYWxsYmFjaz1mdW5jdGlvbigpe24ucHJvdG90eXBlLmNyZWF0ZWRDYWxsYmFjay5hcHBseSh0aGlzLGFyZ3VtZW50cyksZS5vbkNyZWF0ZSYmZS5vbkNyZWF0ZS5hcHBseSh0aGlzLGFyZ3VtZW50cyl9LHMuYXR0YWNoZWRDYWxsYmFjaz1mdW5jdGlvbigpe24ucHJvdG90eXBlLmF0dGFjaGVkQ2FsbGJhY2suYXBwbHkodGhpcyxhcmd1bWVudHMpLGUub25BdHRhY2gmJmUub25BdHRhY2guYXBwbHkodGhpcyxhcmd1bWVudHMpLHIuY2FsbCh0aGlzLGUuZXZlbnRzKX0scy5kZXRhY2hlZENhbGxiYWNrPWZ1bmN0aW9uKCl7bi5wcm90b3R5cGUuZGV0YWNoZWRDYWxsYmFjay5hcHBseSh0aGlzLGFyZ3VtZW50cyksZS5vbkRldGFjaCYmZS5vbkRldGFjaC5hcHBseSh0aGlzLGFyZ3VtZW50cyl9LHMuYXR0cmlidXRlQ2hhbmdlZENhbGxiYWNrPWZ1bmN0aW9uKHQsaSxyKXtuLnByb3RvdHlwZS5hdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2suYXBwbHkodGhpcyxhcmd1bWVudHMpLGUub25BdHRyaWJ1dGVzQ2hhbmdlJiZlLm9uQXR0cmlidXRlc0NoYW5nZVt0XS5hcHBseSh0aGlzLFtpLHJdKX0saS5wcm90b3R5cGU9cyxkb2N1bWVudC5yZWdpc3RlckVsZW1lbnQoZS50YWdOYW1lLGkpfTt2YXIgdz17fSxFPXt9LGs9ZnVuY3Rpb24oKXt9O2sucHJvdG90eXBlLnN0cmluZ2lmeT1mdW5jdGlvbih0KXt2YXIgZT1cIlwiO2Zvcih2YXIgbiBpbiB0KXtlKz1uK1wie1wiO3ZhciBpPXRbbl07Zm9yKHZhciByIGluIGkpe3ZhciBvPWlbcl07ZSs9citcIjpcIitvK1wiO1wifWU9ZS5zbGljZSgwLGUubGVuZ3RoLTEpLGUrPVwifVwifXJldHVybiBlfSxrLnByb3RvdHlwZS5jcmVhdGVTdHlsZVRhZz1mdW5jdGlvbih0KXt2YXIgZT1kb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3R5bGVcIik7cmV0dXJuIHQ9dGhpcy5zdHJpbmdpZnkodCksZS5pbm5lclRleHQ9dCxlfSxrLnByb3RvdHlwZS5yZWdpc3Rlck1peGlucz1mdW5jdGlvbih0LGUpe3dbdF09ZX0say5wcm90b3R5cGUucmVnaXN0ZXJWYXJpYWJsZXM9ZnVuY3Rpb24odCxlKXtFW3RdPWV9LGsucHJvdG90eXBlLmdldFZhcmlhYmxlPWZ1bmN0aW9uKHQpe3JldHVybiBFW3RdP0VbdF06dm9pZCBjb25zb2xlLmVycm9yKFwiVmFyaWFibGUgXCIrdCtcIiBkb2VzIG5vdCBleGlzdC5cIil9LGsucHJvdG90eXBlLnRvSGV4PWZ1bmN0aW9uKHQpe2Z1bmN0aW9uIGUodCl7dmFyIGU9dC50b1N0cmluZygxNik7cmV0dXJuIDE9PWUubGVuZ3RoP1wiMFwiK2U6ZX1yZXR1cm4gdD10LnJlcGxhY2UoXCIgXCIsXCJcIikuc3BsaXQoXCIsXCIpLFwiI1wiK2UodFswXSkrZSh0WzFdKStlKHRbMl0pfSxrLnByb3RvdHlwZS50b1JHQj1mdW5jdGlvbih0KXt2YXIgZT0vXiM/KFthLWZcXGRdezJ9KShbYS1mXFxkXXsyfSkoW2EtZlxcZF17Mn0pJC9pLmV4ZWModCk7cmV0dXJuIGU/XCJyZ2IoXCIrW3BhcnNlSW50KGVbMV0sMTYpLHBhcnNlSW50KGVbMl0sMTYpLHBhcnNlSW50KGVbM10sMTYpXS5qb2luKFwiLFwiKStcIilcIjpudWxsfSxrLnByb3RvdHlwZS50b1JHQmE9ZnVuY3Rpb24odCxlKXt2YXIgbj0vXiM/KFthLWZcXGRdezJ9KShbYS1mXFxkXXsyfSkoW2EtZlxcZF17Mn0pJC9pLmV4ZWModCk7cmV0dXJuIG4/XCJyZ2JhKFwiK1twYXJzZUludChuWzFdLDE2KSxwYXJzZUludChuWzJdLDE2KSxwYXJzZUludChuWzNdLDE2KSxlXS5qb2luKFwiLFwiKStcIilcIjpudWxsfSxrLnByb3RvdHlwZS5nZXRNaXhpbnM9ZnVuY3Rpb24odCl7cmV0dXJuIHdbdF0/d1t0XTp2b2lkIGNvbnNvbGUuZXJyb3IoXCJNaXhpbiBcIit0K1wiIGRvZXMgbm90IGV4aXN0LlwiKX07dmFyIEE9e30scT1mdW5jdGlvbigpe307cS5wcm90b3R5cGVbXCJleHBvcnRcIl09ZnVuY3Rpb24odCxlKXtpZihcInN0cmluZ1wiIT10eXBlb2YgdCl0aHJvdyBuZXcgRXJyb3IoXCJNb2R1bGUgbmFtZSBpcyBub3QgYSBzdHJpbmcuXCIpO2lmKFwiZnVuY3Rpb25cIiE9dHlwZW9mIGUpdGhyb3cgbmV3IEVycm9yKFwiTW9kdWxlIGlzIG5vdCBhIGZ1bmN0aW9uLlwiKTtBW3RdPWZ1bmN0aW9uKHQpe3QoZSgpKX19LHEucHJvdG90eXBlW1wiaW1wb3J0XCJdPWZ1bmN0aW9uKHQpe2Z1bmN0aW9uIGUocyl7dmFyIGE9dFtzXTtpZihcInN0cmluZ1wiIT10eXBlb2Ygcyl0aHJvdyBuZXcgRXJyb3IoXCJNb2R1bGUgbmFtZSBpcyBub3QgYSBzdHJpbmcuXCIpO2lmKFwic3RyaW5nXCIhPXR5cGVvZiBhKXRocm93IG5ldyBFcnJvcihcIlVSTCBpcyBub3QgYSBzdHJpbmcuXCIpO3ZhciB1PUFbc107aWYodSlyLnJlc29sdmUodSgpKTtlbHNle3ZhciBjPWRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzY3JpcHRcIik7Yy50eXBlPVwidGV4dC9qYXZhc2NyaXB0XCIsYy5zcmM9YSxjLm9ubG9hZD1mdW5jdGlvbigpe3ZhciB0PWQoKTtjb25zb2xlLmxvZyhcIkxvYWRpbmcgXCIrcytcIi4uLlwiKSx0LnByb21pc2UudGhlbihmdW5jdGlvbih0KXtvW3NdPXQsbisrLDA9PT1pLmxlbmd0aD9yLnJlc29sdmUobyk6ZShpLnBvcCgpKX0pLGMucmVtb3ZlKCksQVtzXSh0LnJlc29sdmUpfS5iaW5kKHRoaXMscyksZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChjKX19dmFyIG49MCxpPU9iamVjdC5rZXlzKHQpLHI9ZCgpLG89e307cmV0dXJuIGUoaS5wb3AoKSksci5wcm9taXNlLmFuZD17fSxyLnByb21pc2UuYW5kW1wiZXhwb3J0XCJdPWZ1bmN0aW9uKHQsZSl7QVt0XT1mdW5jdGlvbihuKXtyLnByb21pc2UudGhlbihmdW5jdGlvbihuKXtyZXR1cm4gQVt0XT1lLmJpbmQodGhpcyxuKSxlLmNhbGwodGhpcyxuKX0uYmluZCh0aGlzKSkuZG9uZShuKX19LmJpbmQodGhpcyksci5wcm9taXNlLmFuZFtcImltcG9ydFwiXT1mdW5jdGlvbih0KXtyZXR1cm4gci5wcm9taXNlLnRoZW4odGhpc1tcImltcG9ydFwiXS5iaW5kKHRoaXMsdCkpfS5iaW5kKHRoaXMpLHIucHJvbWlzZX07dmFyIEI9di5leHRlbmQoe2FqYXg6ZnVuY3Rpb24oZSl7ZnVuY3Rpb24gbih0KXtyZXR1cm5cIkRFTEVURVwiPT09ZS50eXBlLnRvVXBwZXJDYXNlKCk/QXJyYXkuaXNBcnJheSh0KT90LmZvckVhY2goZnVuY3Rpb24odCl7dGhpcy51bnNldCh0W2UuaW5kZXhCeV0sdCl9LmJpbmQodGhpcykpOlwib2JqZWN0XCI9PXR5cGVvZiB0JiZ0aGlzLnVuc2V0KHRbZS5pbmRleEJ5XSx0KTpBcnJheS5pc0FycmF5KHQpP3QuZm9yRWFjaChmdW5jdGlvbih0KXt0aGlzLnNldCh0W2UuaW5kZXhCeV0sdCl9LmJpbmQodGhpcykpOlwib2JqZWN0XCI9PXR5cGVvZiB0JiZ0aGlzLnNldCh0W2UuaW5kZXhCeV0sdCksdH1mdW5jdGlvbiBpKHQpe3JldHVybiBlLnBhcnNlP2UucGFyc2UodCk6dGhpcy5wYXJzZSh0KX1pZighZS51cmwpdGhyb3cgbmV3IEVycm9yKFwiVXJsIGlzIHJlcXVpcmVkLlwiKTtpZighZS50eXBlKXRocm93IG5ldyBFcnJvcihcIlJlcXVlc3QgdHlwZSBpcyByZXF1aXJlZC5cIik7cmV0dXJuIGUuY29udGVudFR5cGU9ZS5jb250ZW50VHlwZXx8XCJhcHBsaWNhdGlvbi9qc29uXCIsZS5lbmNvZGU9ZS5lbmNvZGV8fG51bGwsZS5wYXlsb2FkPWUucGF5bG9hZHx8bnVsbCxlLmluZGV4Qnk9ZS5pbmRleEJ5fHxcImlkXCIsdChlKS50aGVuKGkuYmluZCh0aGlzKSkudGhlbihuLmJpbmQodGhpcykpfSxwYXJzZTpmdW5jdGlvbih0KXtyZXR1cm4gSlNPTi5wYXJzZSh0KX19KSxUPXt9LGo9ZnVuY3Rpb24oKXt9O2oucHJvdG90eXBlLnJlZ2lzdGVyPWZ1bmN0aW9uKHQpe2lmKFRbdF0pdGhyb3cgbmV3IEVycm9yKFwiUmVzb3VyY2UgXCIrdCtcIiBhbHJlYWR5IGV4aXN0LlwiKTtyZXR1cm4gVFt0XT1uZXcgQixUW3RdfSxqLnByb3RvdHlwZS5nZXQ9ZnVuY3Rpb24odCl7cmV0dXJuIFRbdF0/VFt0XTp0aGlzLnJlZ2lzdGVyKHQpfTt2YXIgTj1mdW5jdGlvbigpe307Ti5wcm90b3R5cGUuY3JlYXRlVGVtcGxhdGU9ZnVuY3Rpb24oKXtyZXR1cm4gbmV3IFN9O3ZhciBTPWZ1bmN0aW9uKCl7dGhpcy5fY3VycmVudFN0YXRlPVtdLHRoaXMuX3F1ZXVlPVtdLHRoaXMuX2NvbmRpdGlvbmFsPXZvaWQgMCx0aGlzLl9zdGF0ZT12b2lkIDAsdGhpcy5fbG9vcD12b2lkIDAsdGhpcy5fc3RhcnQ9dm9pZCAwfTtTLnByb3RvdHlwZS5jcmVhdGU9ZnVuY3Rpb24odCl7dD11KHQpO3ZhciBlPWZ1bmN0aW9uKCl7dmFyIGU9ZG9jdW1lbnQuY3JlYXRlRWxlbWVudCh0WzBdKTtcIi5cIj09PXRbMV0/ZS5jbGFzc05hbWU9dFsyXTpcIiNcIj09PXRbMV0mJihlLmlkPXRbMl0pLHRoaXMuX2N1cnJlbnRTdGF0ZS5wdXNoKGUpfS5iaW5kKHRoaXMpO3JldHVybiB0aGlzLl9xdWV1ZS5wdXNoKHt0eXBlOlwib3BlblwiLGZuOmV9KSx0aGlzfSxTLnByb3RvdHlwZS5hZGRDbGFzcz1mdW5jdGlvbih0KXt2YXIgZT1mdW5jdGlvbihlKXt2YXIgbj1zLmNhbGwodGhpcyk7dD1jKGUsdCk7dmFyIGk9bi5jbGFzc05hbWUubGVuZ3RoPjA/XCIgXCI6XCJcIjthKG4sdCl8fChuLmNsYXNzTmFtZSs9aSt0KX0uYmluZCh0aGlzKTtyZXR1cm4gdGhpcy5fcXVldWUucHVzaCh7dHlwZTpcImFkZENsYXNzXCIsZm46ZX0pLHRoaXN9LFMucHJvdG90eXBlLnRleHQ9ZnVuY3Rpb24odCl7dmFyIGU9ZnVuY3Rpb24oZSl7dmFyIG49cy5jYWxsKHRoaXMpO24udGV4dENvbnRlbnQ9YyhlLHQpfS5iaW5kKHRoaXMpO3JldHVybiB0aGlzLl9xdWV1ZS5wdXNoKHt0eXBlOlwidGV4dFwiLGZuOmV9KSx0aGlzfSxTLnByb3RvdHlwZS5hdHRyPWZ1bmN0aW9uKHQsZSl7dmFyIG49ZnVuY3Rpb24obil7dmFyIGk9cy5jYWxsKHRoaXMpO2kuc2V0QXR0cmlidXRlKGMobix0KSxjKG4sZSkpfS5iaW5kKHRoaXMpO3JldHVybiB0aGlzLl9xdWV1ZS5wdXNoKHt0eXBlOlwiYXR0clwiLGZuOm59KSx0aGlzfSxTLnByb3RvdHlwZS5zdHlsZT1mdW5jdGlvbih0LGUpe3ZhciBuPWZ1bmN0aW9uKG4pe3ZhciBpPXMuY2FsbCh0aGlzKTtpLnN0eWxlW2Mobix0KV09YyhuLGUpfS5iaW5kKHRoaXMpO3JldHVybiB0aGlzLl9xdWV1ZS5wdXNoKHt0eXBlOlwic3R5bGVcIixmbjpufSksdGhpc30sUy5wcm90b3R5cGUucmVtb3ZlQ2xhc3M9ZnVuY3Rpb24odCl7dmFyIGU9ZnVuY3Rpb24oZSl7dmFyIG49cy5jYWxsKHRoaXMpO2lmKHQ9YyhlLHQpLGEobix0KSl7dmFyIGk9bmV3IFJlZ0V4cChcIihcXFxcc3xeKVwiK3QrXCIoXFxcXHN8JClcIik7bi5jbGFzc05hbWU9bi5jbGFzc05hbWUucmVwbGFjZShpLFwiIFwiKX19LmJpbmQodGhpcyk7cmV0dXJuIHRoaXMuX3F1ZXVlLnB1c2goe3R5cGU6XCJyZW1vdmVDbGFzc1wiLGZuOmV9KSx0aGlzfSxTLnByb3RvdHlwZS5hcHBlbmQ9ZnVuY3Rpb24oKXt2YXIgdD1mdW5jdGlvbih0KXt2YXIgZT10aGlzLl9jdXJyZW50U3RhdGUucG9wKCk7aWYoMD09PXRoaXMuX2N1cnJlbnRTdGF0ZS5sZW5ndGgpdGhpcy5wcmV2aW91c0ZyYWdtZW50LmFwcGVuZENoaWxkKGUpO2Vsc2V7dmFyIG49cy5jYWxsKHRoaXMpO24uYXBwZW5kQ2hpbGQoZSl9fS5iaW5kKHRoaXMpO3JldHVybiB0aGlzLl9xdWV1ZS5wdXNoKHt0eXBlOlwiY2xvc2VcIixmbjp0fSksdGhpc30sUy5wcm90b3R5cGUuYXBwZW5kTGFzdD1mdW5jdGlvbigpe3ZhciB0PWZ1bmN0aW9uKHQpe3ZhciBlPXRoaXMuX2N1cnJlbnRTdGF0ZS5wb3AoKTt0aGlzLnByZXZpb3VzRnJhZ21lbnQuYXBwZW5kQ2hpbGQoZSl9LmJpbmQodGhpcyk7cmV0dXJuIHRoaXMuX3F1ZXVlLnB1c2goe3R5cGU6XCJlbmRcIixmbjp0fSksdGhpc30sUy5wcm90b3R5cGVbXCJpZlwiXT1mdW5jdGlvbih0KXt2YXIgZT1mdW5jdGlvbihlKXt0aGlzLl9zdGF0ZT1cImNvbmRpdGlvbmFsXCIsdD1jKGUsdCksdGhpcy5fY29uZGl0aW9uYWw9ISF0fS5iaW5kKHRoaXMpO3JldHVybiB0aGlzLl9xdWV1ZS5wdXNoKHt0eXBlOlwiaWZcIixmbjplfSksdGhpc30sUy5wcm90b3R5cGVbXCJlbHNlXCJdPWZ1bmN0aW9uKCl7dmFyIHQ9ZnVuY3Rpb24odCl7dGhpcy5fY29uZGl0aW9uYWw9IXRoaXMuX2NvbmRpdGlvbmFsfS5iaW5kKHRoaXMpO3JldHVybiB0aGlzLl9xdWV1ZS5wdXNoKHt0eXBlOlwiZWxzZVwiLGZuOnR9KSx0aGlzfSxTLnByb3RvdHlwZS5lYWNoPWZ1bmN0aW9uKHQpe3ZhciBlPWZ1bmN0aW9uKGUsbil7dGhpcy5fbG9vcD1jKGUsdCksdGhpcy5fc3RhdGU9XCJsb29wXCIsdGhpcy5fc3RhcnQ9bn0uYmluZCh0aGlzKTtyZXR1cm4gdGhpcy5fcXVldWUucHVzaCh7dHlwZTpcImVhY2hcIixmbjplfSksdGhpc30sUy5wcm90b3R5cGUuZG9uZT1mdW5jdGlvbigpe3ZhciB0PWZ1bmN0aW9uKHQsZSl7dGhpcy5fY29uZGl0aW9uYWw9dm9pZCAwLHRoaXMuX3N0YXRlPXZvaWQgMH0uYmluZCh0aGlzKTtyZXR1cm4gdGhpcy5fcXVldWUucHVzaCh7dHlwZTpcImRvbmVcIixmbjp0fSksdGhpc30sUy5wcm90b3R5cGUucmVuZGVyPWZ1bmN0aW9uKHQpe3JldHVybiB0aGlzLnByZXZpb3VzRnJhZ21lbnQ9ZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpLHRoaXMuX3F1ZXVlLmZvckVhY2goZnVuY3Rpb24oZSxuKXtzd2l0Y2godGhpcy5fc3RhdGUpe2Nhc2VcImNvbmRpdGlvbmFsXCI6KHRoaXMuX2NvbmRpdGlvbmFsfHxcImVsc2VcIj09PWUudHlwZXx8XCJkb25lXCI9PT1lLnR5cGUpJiZlLmZuKHQsbik7YnJlYWs7Y2FzZVwibG9vcFwiOlwiZG9uZVwiPT09ZS50eXBlJiYodGhpcy5fbG9vcC5mb3JFYWNoKGZ1bmN0aW9uKHQsZSl7Zm9yKHZhciBpPXRoaXMuX3N0YXJ0KzE7bj5pO2krKyl7dmFyIHI9dGhpcy5fcXVldWVbaV07ci5mbih0LGUpfX0uYmluZCh0aGlzKSksZS5mbih0LG4pKTticmVhaztkZWZhdWx0OmUuZm4odCxuKX19LmJpbmQodGhpcykpLHRoaXMucHJldmlvdXNGcmFnbWVudH07dmFyIFI9bmV3IHksTz17RmFjdG9yeTp2LFNlcnZpY2U6bSxDb21wb25lbnQ6QyxWb3c6ZCxTdHlsaXplcjpuZXcgayxSZW5kZXJlcjpuZXcgTixNb2R1bGU6bmV3IHEsUmVzb3VyY2U6bmV3IGp9O08ucmVnaXN0ZXJHbG9iYWxFdmVudEJ1cz1mdW5jdGlvbih0KXtyZXR1cm4gUi5yZWdpc3Rlcih0KX0sd2luZG93LlRyaW89T30oKTsiLCJyZXF1aXJlKCd0cmlvJyk7Il19
