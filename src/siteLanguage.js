import {useSyncExternalStore} from 'react';
import {createLanguageController,initialLanguage} from './jpdbLocalization.js';
import {en} from './profileCatalog.js';
let current=initialLanguage(window,'jpdb-player-directory-language');
let controller;const listeners=new Set();
const reverse=Object.fromEntries(Object.entries(en).map(([fr,value])=>[value,fr]));
export const getLanguage=()=>current;
export const t=value=>current==='en'?(en[value]||value):(reverse[value]||value);
export const localError=value=>Object.hasOwn(en,value)||Object.hasOwn(reverse,value)?t(value):t('Une erreur est survenue.');
export function setLanguage(value){controller?.choose(value);}
function subscribe(listener){listeners.add(listener);if(!controller)controller=createLanguageController(window,code=>{current=code;listeners.forEach(fn=>fn());},'jpdb-player-directory-language');return()=>listeners.delete(listener);}
export function useSiteLanguage(){return [useSyncExternalStore(subscribe,getLanguage,()=> 'fr'),setLanguage];}
