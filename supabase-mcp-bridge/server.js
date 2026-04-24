const http = require('http');
const https = require('https');
const SUPABASE_URL = process.env.SUPABASE_URL || 'raxpmeltyxmtiihxoxpa.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const PORT = 3031;
const TOOLS = [
  { name: 'query_grant_applications', description: 'Query Jordan grant analysis records', inputSchema: { type: 'object', properties: { limit: { type: 'number' }, action: { type: 'string' } } } },
  { name: 'query_scout_reports', description: 'Query Scout BD and grant research reports', inputSchema: { type: 'object', properties: { limit: { type: 'number' }, mode: { type: 'string' } } } },
  { name: 'query_bd_pipeline', description: 'Query BD pipeline stages and MRR', inputSchema: { type: 'object', properties: { limit: { type: 'number' }, stage: { type: 'number' } } } },
  { name: 'query_compliance_items', description: 'Query Iris compliance deadlines', inputSchema: { type: 'object', properties: { limit: { type: 'number' }, resolved: { type: 'boolean' } } } },
  { name: 'query_agent_executions', description: 'Query agent execution health log', inputSchema: { type: 'object', properties: { limit: { type: 'number' }, agent: { type: 'string' } } } },
  { name: 'query_rfp_responses', description: 'Query Nova RFP analysis records', inputSchema: { type: 'object', properties: { limit: { type: 'number' } } } },
  { name: 'query_ecosystem_signals', description: 'Query ecosystem intelligence signals', inputSchema: { type: 'object', properties: { limit: { type: 'number' }, priority: { type: 'string' } } } },
  { name: 'platform_health_summary', description: 'Full KAI-Netics platform health summary', inputSchema: { type: 'object', properties: {} } }
];
function supabaseQuery(table, filters, limit) {
  return new Promise((resolve, reject) => {
    let path = `/rest/v1/${table}?select=*&order=created_at.desc&limit=${limit||10}`;
    if (filters) Object.entries(filters).forEach(([k,v]) => { if (v !== undefined && v !== null) path += `&${k}=eq.${v}`; });
    const req = https.request({ hostname: SUPABASE_URL, port: 443, path, method: 'GET', headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' } }, (res) => {
      let data = ''; res.on('data', c => data += c); res.on('end', () => { try { resolve(JSON.parse(data)); } catch(e) { reject(new Error(data.substring(0,200))); } });
    });
    req.on('error', reject); req.end();
  });
}
async function executeTool(name, args) {
  if (name === 'platform_health_summary') {
    const [exec, grants, pipe, comp] = await Promise.all([supabaseQuery('agent_executions',null,20), supabaseQuery('grant_applications',null,10), supabaseQuery('bd_pipeline',null,10), supabaseQuery('compliance_items',{resolved:false},10)]);
    return { agent_executions: exec, grant_applications: grants, bd_pipeline: pipe, compliance_items: comp };
  }
  const tableMap = { query_grant_applications:'grant_applications', query_scout_reports:'scout_reports', query_bd_pipeline:'bd_pipeline', query_compliance_items:'compliance_items', query_agent_executions:'agent_executions', query_rfp_responses:'rfp_responses', query_ecosystem_signals:'ecosystem_signals' };
  const table = tableMap[name]; if (!table) throw new Error('Unknown tool: '+name);
  const filters = {}; const skip = ['limit']; Object.entries(args).forEach(([k,v]) => { if (!skip.includes(k) && v !== undefined) filters[k]=v; });
  return await supabaseQuery(table, filters, args.limit||10);
}
const server = http.createServer(async (req, res) => {
  res.setHeader('Content-Type','application/json'); res.setHeader('Access-Control-Allow-Origin','*'); res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS'); res.setHeader('Access-Control-Allow-Headers','Content-Type,Authorization');
  if (req.method==='OPTIONS') { res.writeHead(200); res.end(); return; }
  let body=''; req.on('data',c=>body+=c); req.on('end', async()=>{
    try {
      const parsed = body ? JSON.parse(body) : {}; const method = parsed.method;
      if (method==='initialize') { res.writeHead(200); res.end(JSON.stringify({ jsonrpc:'2.0', id:parsed.id, result:{ protocolVersion:'2024-11-05', capabilities:{tools:{}}, serverInfo:{name:'kai-supabase-mcp',version:'1.0.0'} } })); return; }
      if (method==='tools/list') { res.writeHead(200); res.end(JSON.stringify({ jsonrpc:'2.0', id:parsed.id, result:{tools:TOOLS} })); return; }
      if (method==='tools/call') {
        const {name, arguments:args} = parsed.params;
        try { const result = await executeTool(name, args||{}); res.writeHead(200); res.end(JSON.stringify({ jsonrpc:'2.0', id:parsed.id, result:{content:[{type:'text',text:JSON.stringify(result,null,2)}]} })); }
        catch(e) { res.writeHead(200); res.end(JSON.stringify({ jsonrpc:'2.0', id:parsed.id, error:{code:-32000,message:e.message} })); }
        return;
      }
      res.writeHead(200); res.end(JSON.stringify({jsonrpc:'2.0',id:parsed.id||null,result:{}}));
    } catch(e) { res.writeHead(500); res.end(JSON.stringify({error:e.message})); }
  });
});
server.listen(PORT,'0.0.0.0',()=>{ console.log(`KAI-Netics Supabase MCP Bridge running on port ${PORT}`); });
process.on('uncaughtException',(e)=>console.error('Error:',e.message));
