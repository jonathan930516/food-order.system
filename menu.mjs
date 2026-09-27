export const menu = [
 {id:'classic',name:'經典起司牛肉堡',category:'漢堡',price:180,description:'炙烤牛肉、切達起司、生菜與特製醬',tag:'人氣首選'},
 {id:'double',name:'雙層起司牛肉堡',category:'漢堡',price:250,description:'雙份牛肉與雙倍起司，滿足大口的你',tag:'大滿足'},
 {id:'chicken',name:'香脆雞腿堡',category:'漢堡',price:170,description:'酥炸雞腿排、爽脆生菜與蜂蜜芥末'},
 {id:'veggie',name:'田園菇菇堡',category:'漢堡',price:160,description:'香煎杏鮑菇、番茄與起司（奶蛋素）',tag:'蔬食'},
 {id:'fries',name:'海鹽薯條',category:'小點',price:70,description:'現炸金黃薯條，撒上細緻海鹽'},
 {id:'nuggets',name:'酥脆雞塊',category:'小點',price:85,description:'六塊酥嫩雞塊，附蜂蜜芥末醬'},
 {id:'tea',name:'日月潭紅茶',category:'飲料',price:45,description:'清香回甘，固定微糖去冰'},
 {id:'lemon',name:'蜂蜜檸檬氣泡飲',category:'飲料',price:65,description:'蜂蜜與新鮮檸檬的清爽組合'}
];
export function validateOrder(body) {
 if(!body || typeof body !== 'object') throw Error('訂單格式不正確');
 const name=typeof body.name==='string'?body.name.trim():'';
 const phone=typeof body.phone==='string'?body.phone.trim():'';
 const note=typeof body.note==='string'?body.note.trim():'';
 if(name.length<1||name.length>40) throw Error('請填寫取餐姓名（最多 40 字）');
 if(!/^09\d{8}$/.test(phone)) throw Error('請填寫 10 位數手機號碼');
 if(note.length>300) throw Error('備註最多 300 字');
 if(!/^[a-f0-9-]{36}$/i.test(body.requestId||'')) throw Error('訂單識別碼不正確，請重新整理');
 if(!Array.isArray(body.items)||!body.items.length||body.items.length>menu.length) throw Error('請先選擇餐點');
 const seen=new Set();
 const items=body.items.map(item=>{
  const dish=menu.find(m=>m.id===item?.id);
  if(!dish||seen.has(dish.id)||!Number.isInteger(item.quantity)||item.quantity<1||item.quantity>20) throw Error('餐點或數量不正確（每項最多 20 份）');
  seen.add(dish.id); return {id:dish.id,name:dish.name,price:dish.price,quantity:item.quantity};
 });
 return {name,phone,note,items,total:items.reduce((sum,i)=>sum+i.price*i.quantity,0),requestId:body.requestId};
}
