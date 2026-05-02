const fs = require('fs');
const OLD = "ctx = JSON.parse(fs.readFileSync('/data/KAI_Context.json', 'utf8'));";
const NEW = "ctx = JSON.parse(fs.readFileSync('/data/KAI_Context.json', 'utf8').replace(/\uFEFF/g, ''));";

const iris = JSON.parse(fs.readFileSync('/data/workflows/4_iris_v3_supabase.json', 'utf8'));
const irisNode = iris.nodes.find(function(n){ return n.id === 'iris-003'; });
if(irisNode && irisNode.parameters.jsCode.indexOf(OLD) !== -1){
  irisNode.parameters.jsCode = irisNode.parameters.jsCode.replace(OLD, NEW);
  fs.writeFileSync('/data/workflows/4_iris_v3_supabase.json', JSON.stringify(iris, null, 2), 'utf8');
  console.log('OK: Iris BOM fix written');
} else { console.log('SKIP: Iris already fixed or pattern not found'); }

const atlas = JSON.parse(fs.readFileSync('/data/workflows/1_atlas_v2.json', 'utf8'));
const atlasNode = atlas.nodes.find(function(n){ return n.id === 'atlas-002'; });
if(atlasNode && atlasNode.parameters.jsCode.indexOf(OLD) !== -1){
  atlasNode.parameters.jsCode = atlasNode.parameters.jsCode.replace(OLD, NEW);
  fs.writeFileSync('/data/workflows/1_atlas_v2.json', JSON.stringify(atlas, null, 2), 'utf8');
  console.log('OK: Atlas BOM fix written');
} else { console.log('SKIP: Atlas already fixed or pattern not found'); }

console.log('DONE');
