import {build} from 'esbuild';
import fs from 'fs';
const r = await build({entryPoints:['gift/gift.js'], bundle:true, format:'iife', minify:true, write:false, target:['es2018'], legalComments:'inline'});
const js = r.outputFiles[0].text.replace(/<\/script/gi,'<\\/script');
const lic = fs.readFileSync('node_modules/@fullstackfamily/manseryeok/LICENSE','utf8').replace(/\*\//g,'');
const html = fs.readFileSync('gift/gift.template.html','utf8').replace('/*__APP__*/', ()=>'/*! 포함된 라이브러리: @fullstackfamily/manseryeok\n'+lic+'*/\n'+js);
fs.mkdirSync('site/gift',{recursive:true});
fs.writeFileSync('site/gift/index.html', html);
console.log('gift/index.html', html.length, 'bytes, js', js.length);
