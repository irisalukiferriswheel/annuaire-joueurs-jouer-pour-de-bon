import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {english,translateEligibility,eligibilityError} from './eligibilityLanguage.js';
test('every existing explicit validation message has English text, without changing validation',()=>{
 const source=readFileSync(new URL('./EditProfile.jsx',import.meta.url),'utf8');
 const block=source.slice(source.indexOf('const required ='),source.indexOf('setSaving(true);'));
 const messages=[...block.matchAll(/'([^']+[.!])'/g)].map(m=>m[1]);assert.equal(messages.length,16);
 for(const message of messages){assert.ok(english[message],message);assert.equal(translateEligibility(message,'fr'),message);}
 assert.equal(eligibilityError('unrecognized backend text','en'),'Something went wrong. Your entered details are preserved.');
});
test('directory permission and privacy text have no activated English translations',()=>{
 for(const text of ['Afficher mon profil dans l’annuaire public','Données privées protégées','Les informations privées servent uniquement aux besoins administratifs, de sécurité, d’admissibilité, de consentement et de paiement.'])assert.equal(translateEligibility(text,'en'),text);
});
