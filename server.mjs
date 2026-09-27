import http from 'node:http';
import {readFile,mkdir,writeFile,rename} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {join,dirname} from 'node:path';
import {randomUUID,createHash} from 'node:crypto';
import {menu,validateOrder} from './menu.mjs';
const root=dirname(fileURLToPath(import.meta.url));
const dataPath=process.env.DATA_DIR||join(root,'data');
let pool;
if(process.env.DATABASE_URL){
 const {default:pg}=await import('pg');
 pool=new pg.Pool({connectionString:process.env.DATABASE_URL,max:5});
 await pool.query('CREATE TABLE IF NOT EXISTS food_orders (id TEXT PRIMARY KEY, request_id TEXT UNIQUE NOT NULL, fingerprint TEXT NOT NULL, payload JSONB NOT NULL)');
}else if(process.env.RENDER){throw Error('Render requires DATABASE_URL for durable order storage');}
else await mkdir(dataPath,{recursive:true});
let chain=Promise.resolve();
async function saveOrder(order,fingerprint){
 if(pool){
  await pool.query('INSERT INTO food_orders(id,request_id,fingerprint,payload) VALUES($1,$2,$3,$4) ON CONFLICT(request_id) DO NOTHING',[order.id,order.requestId,fingerprint,order]);
  const {rows}=await pool.query('SELECT fingerprint,payload FROM food_orders WHERE request_id=$1',[order.requestId]);
  if(rows[0].fingerprint!==fingerprint) throw Error('此訂單已送出，請重新開始點餐');
  return rows[0].payload;
 }
 const op=chain.then(async()=>{
  const file=join(dataPath,'orders.json'); let orders=[];
  try{orders=JSON.parse(await readFile(file,'utf8'));}catch(e){if(e.code!=='ENOENT') throw e;}
  const existing=orders.find(x=>x.requestId===order.requestId);
  if(existing){if(existing.fingerprint!==fingerprint)throw Error('此訂單已送出，請重新開始點餐');return existing.order;}
  orders.push({requestId:order.requestId,fingerprint,order});
  await writeFile(file+'.tmp',JSON.stringify(orders,null,2));await rename(file+'.tmp',file);return order;
 });chain=op.catch(()=>{});return op;
}
async function findOrder(id){
 if(pool){const {rows}=await pool.query('SELECT payload FROM food_orders WHERE id=$1',[id]);return rows[0]?.payload;}
 try{return JSON.parse(await readFile(join(dataPath,'orders.json'),'utf8')).find(x=>x.order.id===id)?.order;}catch(e){if(e.code==='ENOENT')return null;throw e;}
}
const staticFiles={'/':['index.html','text/html; charset=utf-8'],'/app.js':['app.js','text/javascript; charset=utf-8'],'/style.css':['style.css','text/css; charset=utf-8'],'/favicon.svg':['favicon.svg','image/svg+xml']};
function send(res,status,data){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));}
const server=http.createServer(async(req,res)=>{
 res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');
 res.setHeader('Content-Security-Policy',"default-src 'self'; img-src 'self' https:; style-src 'self'; script-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'self'");
 try{
 const url=new URL(req.url,'http://localhost');
 if(req.method==='GET'&&url.pathname==='/health'){if(pool)await pool.query('SELECT 1');return send(res,200,{ok:true});}
 if(req.method==='GET'&&url.pathname==='/api/menu') return send(res,200,menu);
 if(req.method==='POST'&&url.pathname==='/api/orders'){
  if(req.headers.origin&&new URL(req.headers.origin).host!==req.headers.host) return send(res,403,{error:'請從本站送出訂單'});
  if(!req.headers['content-type']?.includes('application/json'))return send(res,415,{error:'請使用 JSON 格式'});
  let body='';for await(const chunk of req){body+=chunk;if(Buffer.byteLength(body)>16384)return send(res,413,{error:'訂單內容過大'});}
  let input;try{input=validateOrder(JSON.parse(body));}catch(e){return send(res,400,{error:e instanceof SyntaxError?'訂單格式不正確':e.message});}
  const fingerprint=createHash('sha256').update(JSON.stringify(input)).digest('hex');
  const order=await saveOrder({...input,id:randomUUID(),createdAt:new Date().toISOString(),status:'已收到訂單',payment:'到店付款'},fingerprint);
  return send(res,201,{id:order.id,total:order.total,items:order.items,status:order.status,createdAt:order.createdAt,payment:order.payment});
 }
 if(req.method==='GET'&&url.pathname.startsWith('/api/orders/')){
  const id=url.pathname.slice('/api/orders/'.length);
  if(!/^[a-f0-9-]{36}$/i.test(id))return send(res,404,{error:'找不到訂單'});
  const order=await findOrder(id);if(!order)return send(res,404,{error:'找不到訂單'});
  return send(res,200,{id:order.id,total:order.total,items:order.items,status:order.status,createdAt:order.createdAt,payment:order.payment});
 }
 if(req.method==='GET'&&staticFiles[url.pathname]){const [file,type]=staticFiles[url.pathname];res.writeHead(200,{'Content-Type':type});return res.end(await readFile(join(root,'public',file)));}
 send(res,404,{error:'找不到頁面'});
 }catch(e){console.error(e);send(res,503,{error:'目前無法完成操作，請稍後重試。你的購物車仍會保留。'});}
});
server.listen(Number(process.env.PORT)||3000,'0.0.0.0',()=>console.log(`Food Order System: http://localhost:${process.env.PORT||3000}`));
process.on('SIGTERM',()=>server.close(async()=>{await pool?.end();process.exit(0);}));
