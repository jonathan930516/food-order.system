import test from 'node:test';import assert from 'node:assert/strict';import {validateOrder} from '../menu.mjs';
const valid=()=>({name:'測試顧客',phone:'0912345678',note:'不要洋蔥',requestId:'12345678-1234-1234-1234-123456789012',items:[{id:'classic',quantity:2,price:1},{id:'tea',quantity:1}]});
test('以伺服器菜單計算總額，忽略客戶端價格',()=>assert.equal(validateOrder(valid()).total,405));
test('拒絕空購物車、負數、超量、非整數與重複品項',()=>{for(const items of [[],[{id:'classic',quantity:-1}],[{id:'classic',quantity:21}],[{id:'classic',quantity:1.5}],[{id:'fake',quantity:1}],[{id:'tea',quantity:1},{id:'tea',quantity:1}]])assert.throws(()=>validateOrder({...valid(),items}));});
test('檢查聯絡方式與備註長度',()=>{assert.throws(()=>validateOrder({...valid(),phone:'123'}));assert.throws(()=>validateOrder({...valid(),name:' '}));assert.throws(()=>validateOrder({...valid(),note:'a'.repeat(301)}));});
